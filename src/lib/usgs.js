export const USGS_FEEDS = {
  day: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  week: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
  month: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
};

export async function fetchQuakes(rangeKey) {
  const url = USGS_FEEDS[rangeKey];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS request failed: ${res.status}`);
  const geo = await res.json();

  return (geo.features ?? [])
    .map((f) => {
      const c = f?.geometry?.coordinates;
      const p = f?.properties;
      if (!c || c.length < 3) return null;
      return {
        id: f.id,
        lon: c[0],
        lat: c[1],
        depth: c[2],
        mag: p?.mag ?? null,
        time: p?.time ?? null,
        place: p?.place ?? "",
        url: p?.url ?? "",
      };
    })
    .filter(Boolean);
}

export function formatTime(ms) {
  return ms ? new Date(ms).toLocaleString() : "—";
}