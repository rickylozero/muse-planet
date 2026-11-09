"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CloudSun,
  Droplets,
  ExternalLink,
  Clock3,
  MapPin,
  Thermometer,
} from "lucide-react";
import type { WeatherSnapshot, WeatherWarning } from "@/lib/weather";

const MIN_REFRESH_AGE_MS = 15 * 60 * 1000;

type WeatherApiResponse = {
  ok: boolean;
  data?: WeatherSnapshot;
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [failedToRefresh, setFailedToRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let activeController: AbortController | null = null;
    let requestInFlight = false;
    let lastAttemptAt = 0;

    async function refreshWeather() {
      if (requestInFlight) return;

      const controller = new AbortController();
      activeController = controller;
      requestInFlight = true;
      lastAttemptAt = Date.now();

      try {
        const response = await fetch("/api/v1/weather", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as WeatherApiResponse;
        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error("Weather endpoint unavailable.");
        }
        if (mounted) {
          setWeather(payload.data);
          setFailedToRefresh(false);
          setLoading(false);
        }
      } catch {
        if (mounted && !controller.signal.aborted) {
          setFailedToRefresh(true);
          setWeather((current) =>
            current
              ? { ...current, warnings: [], warningsAvailable: false }
              : current,
          );
          setLoading(false);
        }
      } finally {
        requestInFlight = false;
        if (activeController === controller) activeController = null;
      }
    }

    function refreshIfStale() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastAttemptAt >= MIN_REFRESH_AGE_MS
      ) {
        void refreshWeather();
      }
    }

    if (document.visibilityState === "visible") void refreshWeather();
    document.addEventListener("visibilitychange", refreshIfStale);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", refreshIfStale);
      activeController?.abort();
    };
  }, []);

  return (
    <div className="weather-strip" aria-label="香港天文台即時天氣" aria-live="polite">
      <div className="page-shell weather-inner">
        <div className="weather-brand">
          <CloudSun size={16} strokeWidth={1.8} aria-hidden="true" />
          <span>即時天氣</span>
        </div>

        {weather ? (
          <>
            <div className="weather-measures" aria-label={`資料測站：${weather.station ?? "香港天文台"}`}>
              <span className="weather-station">
                <MapPin size={13} strokeWidth={1.9} aria-hidden="true" />
                {weather.station ?? "香港天文台"}
              </span>
              <span className="weather-measure">
                <Thermometer size={14} strokeWidth={1.8} aria-hidden="true" />
                氣溫 {formatTemperature(weather.temperature, weather.temperatureUnit)}
              </span>
              <span className="weather-measure">
                <Droplets size={14} strokeWidth={1.8} aria-hidden="true" />
                相對濕度 {weather.humidity === null ? "—" : `${weather.humidity}%`}
              </span>
            </div>

            <div className="weather-alerts" aria-label="天氣警告">
              {weather.warningsAvailable ? (
                weather.warnings.length > 0 ? (
                  weather.warnings.map((warning) => (
                    <WeatherAlert key={warning.key} warning={warning} />
                  ))
                ) : (
                  <span className="weather-alert-clear">
                    <BadgeCheck size={14} strokeWidth={1.8} aria-hidden="true" />
                    現時沒有生效警告
                  </span>
                )
              ) : (
                <span className="weather-alert-unavailable">
                  <AlertTriangle size={14} strokeWidth={1.8} aria-hidden="true" />
                  警告資料暫時無法讀取
                </span>
              )}
            </div>

            <time
              className="weather-updated"
              dateTime={weather.temperatureRecordTime ?? weather.updateTime ?? undefined}
            >
              <Clock3 size={13} strokeWidth={1.8} aria-hidden="true" />
              {failedToRefresh ? "更新暫不可用 · " : "更新 "}
              {formatTime(weather.temperatureRecordTime ?? weather.updateTime)}
            </time>
          </>
        ) : (
          <p className="weather-loading" role="status">
            {loading ? "正在取得天氣資料…" : "天氣資料暫時無法取得"}
          </p>
        )}

        <a
          className="weather-attribution"
          href="https://www.hko.gov.hk/tc/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={13} strokeWidth={1.9} aria-hidden="true" />
          資料來源：香港天文台
        </a>
      </div>
    </div>
  );
}

function WeatherAlert({ warning }: { warning: WeatherWarning }) {
  const level = warning.type?.toLowerCase().includes("red")
    ? "red"
    : warning.type?.toLowerCase().includes("amber")
      ? "amber"
      : "general";

  return (
    <span className="weather-alert" data-level={level}>
      <AlertTriangle size={14} strokeWidth={1.9} aria-hidden="true" />
      {warning.name}
    </span>
  );
}

function formatTemperature(value: number | null, unit: string | null): string {
  if (value === null) return "—";
  return `${value}°${unit === "F" ? "F" : "C"}`;
}

function formatTime(value: string | null): string {
  if (!value) return "時間待更新";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "時間待更新";
  return new Intl.DateTimeFormat("zh-HK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Hong_Kong",
  }).format(date);
}
