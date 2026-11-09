import "server-only";

export type WeatherWarning = {
  key: string;
  name: string;
  code: string;
  type: string | null;
  actionCode: string | null;
  issueTime: string | null;
  expireTime: string | null;
};

export type WeatherSnapshot = {
  station: string | null;
  temperature: number | null;
  temperatureUnit: string | null;
  temperatureRecordTime: string | null;
  humidity: number | null;
  humidityRecordTime: string | null;
  weatherIcon: number | null;
  updateTime: string | null;
  fetchedAt: string;
  warnings: WeatherWarning[];
  warningsAvailable: boolean;
  warningsUpdatedAt: string | null;
};

type JsonRecord = Record<string, unknown>;

const HKO_API_URL = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";
const HKO_STATION = "香港天文台";
const REQUEST_TIMEOUT_MS = 8_000;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asMeasurement(section: unknown): {
  place: string | null;
  value: number | null;
  unit: string | null;
} {
  const sectionRecord = asRecord(section);
  const data = sectionRecord?.data;
  if (!Array.isArray(data)) return { place: null, value: null, unit: null };

  const entries = data.map(asRecord).filter((item): item is JsonRecord => item !== null);
  const preferred = entries.find((item) => item.place === HKO_STATION);
  const entry = preferred ?? entries[0];
  if (!entry) return { place: null, value: null, unit: null };

  return {
    place: asString(entry.place),
    value:
      typeof entry.value === "number" && Number.isFinite(entry.value)
        ? entry.value
        : null,
    unit: asString(entry.unit),
  };
}

function normalizeWarnings(payload: unknown): WeatherWarning[] {
  const root = asRecord(payload);
  if (!root) throw new Error("Invalid HKO warning response.");

  return Object.entries(root).flatMap(([key, value]) => {
    const item = asRecord(value);
    if (!item) return [];

    const actionCode = asString(item.actionCode);
    if (actionCode?.toUpperCase() === "CANCEL") return [];

    const expireTime = asString(item.expireTime);
    if (expireTime) {
      const expiry = Date.parse(expireTime);
      if (Number.isFinite(expiry) && expiry <= Date.now()) return [];
    }

    return [
      {
        key,
        name: asString(item.name) ?? key,
        code: asString(item.code) ?? key,
        type: asString(item.type),
        actionCode,
        issueTime: asString(item.issueTime),
        expireTime,
      },
    ];
  });
}

function buildApiUrl(dataType: "rhrread" | "warnsum"): string {
  const url = new URL(HKO_API_URL);
  url.searchParams.set("dataType", dataType);
  url.searchParams.set("lang", "tc");
  return url.toString();
}

async function fetchHkoJson(dataType: "rhrread" | "warnsum"): Promise<unknown> {
  const response = await fetch(buildApiUrl(dataType), {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HKO ${dataType} returned HTTP ${response.status}.`);
  }

  return (await response.json()) as unknown;
}

export async function getHkoWeatherSnapshot(): Promise<WeatherSnapshot> {
  const [currentResult, warningResult] = await Promise.allSettled([
    fetchHkoJson("rhrread"),
    fetchHkoJson("warnsum"),
  ]);

  if (currentResult.status === "rejected") {
    throw new Error("HKO current weather is unavailable.");
  }

  const current = asRecord(currentResult.value);
  if (!current) throw new Error("Invalid HKO current weather response.");

  const temperatureSection = asRecord(current.temperature);
  const humiditySection = asRecord(current.humidity);
  const temperature = asMeasurement(temperatureSection);
  const humidity = asMeasurement(humiditySection);

  const warningPayload =
    warningResult.status === "fulfilled" ? warningResult.value : null;
  let warnings: WeatherWarning[] = [];
  let warningsAvailable = false;
  if (warningResult.status === "fulfilled") {
    try {
      warnings = normalizeWarnings(warningPayload);
      warningsAvailable = true;
    } catch {
      warningsAvailable = false;
    }
  }

  const warningTimes = warnings
    .map((warning) => warning.expireTime ?? warning.issueTime)
    .filter((value): value is string => value !== null)
    .sort((left, right) => Date.parse(right) - Date.parse(left));
  const iconList = Array.isArray(current.icon) ? current.icon : [];
  const weatherIcon = iconList.find(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (temperature.value === null && humidity.value === null) {
    throw new Error("HKO current report has no temperature or humidity readings.");
  }

  return {
    station: temperature.place ?? humidity.place ?? HKO_STATION,
    temperature: temperature.value,
    temperatureUnit: temperature.unit ?? "C",
    temperatureRecordTime:
      asString(temperatureSection?.recordTime) ?? asString(current.updateTime),
    humidity: humidity.value,
    humidityRecordTime:
      asString(humiditySection?.recordTime) ?? asString(current.updateTime),
    weatherIcon: weatherIcon ?? null,
    updateTime: asString(current.updateTime),
    fetchedAt: new Date().toISOString(),
    warnings,
    warningsAvailable,
    warningsUpdatedAt: warningTimes[0] ?? null,
  };
}
