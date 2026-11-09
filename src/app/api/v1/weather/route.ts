import { getHkoWeatherSnapshot } from "@/lib/weather";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(): Promise<Response> {
  try {
    const data = await getHkoWeatherSnapshot();
    return Response.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("[api/v1/weather] HKO weather request failed.");
    return Response.json(
      {
        ok: false,
        error: "weather_unavailable",
        message: "香港天文台天氣資料暫時無法取得。",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
