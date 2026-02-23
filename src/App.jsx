import { useMemo, useState } from "react";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";

// USGS: Past day earthquakes (GeoJSON)
const USGS_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

export default function App() {
  const [quakes, setQuakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // global view
  const initialViewState = useMemo(
    () => ({
      longitude: 0,
      latitude: 20,
      zoom: 1.6,
      pitch: 0,
      bearing: 0,
    }),
    []
  );

  async function loadQuakes() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(USGS_URL);
      if (!res.ok) throw new Error(`USGS request failed: ${res.status}`);
      const geo = await res.json();
      const features = geo.features ?? [];

      // flatten to array for deck.gl
      const rows = features
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
          };
        })
        .filter(Boolean);

      setQuakes(rows);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  const layers = useMemo(() => {
    return [
      new ScatterplotLayer({
        id: "quakes",
        data: quakes,
        getPosition: (d) => [d.lon, d.lat],
        // radius in meters; scale by magnitude (fallback 2)
        getRadius: (d) => Math.max(20000, (d.mag ?? 2) * 25000),
        radiusMinPixels: 2,
        radiusMaxPixels: 30,
        getFillColor: (d) => {
          // simple color ramp by magnitude (no need perfect, later refine)
          const m = d.mag ?? 0;
          if (m >= 6) return [220, 60, 60, 180];
          if (m >= 4) return [240, 160, 60, 180];
          return [80, 180, 220, 160];
        },
        pickable: true,
        autoHighlight: true,
      }),
    ];
  }, [quakes]);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          top: 12,
          left: 12,
          background: "rgba(0,0,0,0.65)",
          color: "white",
          padding: "10px 12px",
          borderRadius: 10,
          maxWidth: 360,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          Global Earthquakes (USGS)
        </div>
        <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
          Click “Load data” to fetch the last 24h earthquakes and explore them on
          the map.
        </div>
        <button
          onClick={loadQuakes}
          disabled={loading}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading…" : "Load data"}
        </button>
        <div style={{ fontSize: 12, marginTop: 8 }}>
          {err ? (
            <span style={{ color: "#ffb4b4" }}>Error: {err}</span>
          ) : (
            <span style={{ opacity: 0.9 }}>
              Points: <b>{quakes.length}</b>
            </span>
          )}
        </div>
      </div>

      {/* Map + DeckGL */}
      <DeckGL
        initialViewState={initialViewState}
        controller={true}
        layers={layers}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        />
      </DeckGL>
    </div>
  );
}