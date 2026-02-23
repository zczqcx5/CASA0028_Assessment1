import { useEffect, useMemo, useState } from "react";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { HexagonLayer } from "deck.gl";

const USGS_FEEDS = {
  day: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  week: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
  month:
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
};

function fmtTime(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleString();
}

export default function App() {
  
  const [timeRange, setTimeRange] = useState("day"); 
  const [minMag, setMinMag] = useState(2.5); 
  const [depthMin, setDepthMin] = useState(0);
  const [depthMax, setDepthMax] = useState(700);
  const [mode, setMode] = useState("points"); 
  const [selected, setSelected] = useState(null);
  const [selectedHex, setSelectedHex] = useState(null);

  
  const [rawQuakes, setRawQuakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

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

  async function loadQuakes(rangeKey) {
    const url = USGS_FEEDS[rangeKey];
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`USGS request failed: ${res.status}`);
      const geo = await res.json();

      const rows = (geo.features ?? [])
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

      setRawQuakes(rows);
      setSelected(null);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  
  useEffect(() => {
    loadQuakes(timeRange);
    
  }, [timeRange]);

  
  const quakes = useMemo(() => {
    return rawQuakes.filter((d) => {
      const m = d.mag ?? -999;
      const dep = d.depth ?? -999;
      return m >= minMag && dep >= depthMin && dep <= depthMax;
    });
  }, [rawQuakes, minMag, depthMin, depthMax]);

  
  const summary = useMemo(() => {
    const n = quakes.length;
    if (n === 0) return { n: 0, maxMag: null, avgDepth: null, latest: null };
    let maxMag = -Infinity;
    let sumDepth = 0;
    let latest = -Infinity;
    for (const q of quakes) {
      if (q.mag != null) maxMag = Math.max(maxMag, q.mag);
      if (q.depth != null) sumDepth += q.depth;
      if (q.time != null) latest = Math.max(latest, q.time);
    }
    return {
      n,
      maxMag: Number.isFinite(maxMag) ? maxMag : null,
      avgDepth: sumDepth / n,
      latest: Number.isFinite(latest) ? latest : null,
    };
  }, [quakes]);

  
  const layers = useMemo(() => {
    if (mode === "hex") {
      return [
        new HexagonLayer({
          id: "quakes-hex",
          data: quakes,
          getPosition: (d) => [d.lon, d.lat],
          radius: 60000, 
          elevationScale: 80,
          extruded: true,
          pickable: true,
          opacity: 0.65,
          coverage: 0.9,
          upperPercentile: 95,
        }),
      ];
    }

    return [
      new ScatterplotLayer({
        id: "quakes-points",
        data: quakes,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => Math.max(15000, (d.mag ?? 2) * 25000),
        radiusMinPixels: 2,
        radiusMaxPixels: 30,
        getFillColor: (d) => {
          const m = d.mag ?? 0;
          if (m >= 6) return [220, 60, 60, 190];
          if (m >= 4) return [240, 160, 60, 190];
          return [80, 180, 220, 170];
        },
        pickable: true,
        autoHighlight: true,
      }),
    ];
  }, [quakes, mode]);

  function handleClick(info) {
  if (!info) return;

  // Points mode
  if (mode === "points") {
    if (info.object) {
      setSelected(info.object);
    } else {
      setSelected(null);
    }
    setSelectedHex(null);
    return;
  }

  // Hex mode (deck.gl returns aggregated object)
  if (mode === "hex") {
    if (info.object) {
      // info.object.points 是该 hex 内的原始点
      const pts = info.object.points || [];
      let maxMag = null;
      for (const p of pts) {
        if (p.mag != null) maxMag = maxMag == null ? p.mag : Math.max(maxMag, p.mag);
      }
      setSelectedHex({
        count: info.object.points?.length ?? info.object.count ?? 0,
        maxMag,
      });
    } else {
      setSelectedHex(null);
    }
    setSelected(null);
  }
}

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      {/* Left: Controls */}
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          top: 12,
          left: 12,
          width: 340,
          background: "rgba(0,0,0,0.72)",
          color: "white",
          padding: "12px 12px",
          borderRadius: 12,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8 }}>
          Global Earthquakes Explorer
        </div>
        <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 10 }}>
          Data: USGS feed. Use controls to filter and switch layers.
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ fontSize: 12 }}>
            Time range
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ width: "100%", marginTop: 6, padding: 6 }}
            >
              <option value="day">Past day</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
            </select>
          </label>

          <label style={{ fontSize: 12 }}>
            Layer mode
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setSelected(null);
              }}
              style={{ width: "100%", marginTop: 6, padding: 6 }}
            >
              <option value="points">Points (by magnitude)</option>
              <option value="hex">Hexbin hotspots</option>
            </select>
          </label>

          <label style={{ fontSize: 12 }}>
            Minimum magnitude: <b>{minMag.toFixed(1)}</b>
            <input
              type="range"
              min="0"
              max="7"
              step="0.1"
              value={minMag}
              onChange={(e) => setMinMag(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ fontSize: 12 }}>
              Depth min (km): <b>{depthMin}</b>
              <input
                type="range"
                min="0"
                max="700"
                step="10"
                value={depthMin}
                onChange={(e) => setDepthMin(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              Depth max (km): <b>{depthMax}</b>
              <input
                type="range"
                min="0"
                max="700"
                step="10"
                value={depthMax}
                onChange={(e) => setDepthMax(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <button
            onClick={() => loadQuakes(timeRange)}
            disabled={loading}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Refreshing…" : "Refresh data"}
          </button>

          <div style={{ fontSize: 12 }}>
            {err ? (
              <span style={{ color: "#ffb4b4" }}>Error: {err}</span>
            ) : (
              <span style={{ opacity: 0.95 }}>
                Showing <b>{summary.n}</b> quakes · max mag{" "}
                <b>{summary.maxMag?.toFixed(1) ?? "—"}</b> · avg depth{" "}
                <b>{summary.avgDepth != null ? summary.avgDepth.toFixed(0) : "—"}</b>{" "}
                km
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
            Source: USGS “all_{timeRange}” feed
          </div>
        </div>
      </div>

      {/* Right: Insight panel */}
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          top: 12,
          right: 12,
          width: 360,
          background: "rgba(0,0,0,0.72)",
          color: "white",
          padding: "12px 12px",
          borderRadius: 12,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Insights</div>

        <div style={{ fontSize: 12, opacity: 0.95, marginBottom: 10 }}>
          Latest event time: <b>{summary.latest ? fmtTime(summary.latest) : "—"}</b>
          <br />
          Tip: switch to <b>Points</b> mode and click an event to inspect details.
        </div>

        {selected ? (
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Selected quake</div>
            <div>
              <b>Magnitude:</b> {selected.mag?.toFixed(1) ?? "—"}
            </div>
            <div>
              <b>Depth:</b> {selected.depth?.toFixed(0) ?? "—"} km
            </div>
            <div>
              <b>Time:</b> {selected.time ? new Date(selected.time).toLocaleString() : "—"}
            </div>
            <div style={{ marginTop: 6 }}>
              <b>Place:</b> {selected.place || "—"}
            </div>
            {selected.url ? (
              <div style={{ marginTop: 8 }}>
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#9ad3ff" }}
                >
                  Open USGS event page
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ fontSize: 13, opacity: 1.4 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Selected hotspot</div>
            <div>
              <b>Events in hex:</b> {selectedHex.count}
            </div>
            <div>
              <b>Max magnitude in hex:</b>{" "}
              {selectedHex.maxMag != null ? selectedHex.maxMag.toFixed(1) : "—"}
            </div>
            <div style={{ marginTop: 8, opacity: 0.9 }}>
              Tip: adjust <b>Min magnitude</b> and see hotspots reshape.
              </div>
          </div>
          ) : (
            <div style={{ fontSize: 13, opacity: 0.9 }}>Nothing selected.</div>
        )}
      </div>

      {/* Map + DeckGL */}
      <DeckGL
        initialViewState={initialViewState}
        controller={true}
        layers={layers}
        onClick={handleClick}
      >
        <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" />
      </DeckGL>
    </div>
  );
}