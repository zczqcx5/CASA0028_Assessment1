import { useEffect, useMemo, useState } from "react";
import { FlyToInterpolator } from "@deck.gl/core";

import Controls from "./components/Controls";
import QuakeMap from "./components/QuakeMap";
import InsightPanel from "./components/InsightPanel";
import { fetchQuakes } from "./lib/usgs";

export default function App() {
  const [timeRange, setTimeRange] = useState("day");
  const [minMag, setMinMag] = useState(2.5);
  const [depthMin, setDepthMin] = useState(0);
  const [depthMax, setDepthMax] = useState(700);
  const [mode, setMode] = useState("points");

  const [rawQuakes, setRawQuakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [selected, setSelected] = useState(null);
  const [selectedHex, setSelectedHex] = useState(null);

  const [hoverInfo, setHoverInfo] = useState(null);

  // ✅ collapsible panels
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // ✅ viewState moved to App (supports fly-to)
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.6,
    pitch: 0,
    bearing: 0,
  });

  // region presets
  const focusPresets = useMemo(
    () => ({
      global: { longitude: 0, latitude: 20, zoom: 1.6 },
      ringOfFire: { longitude: -150, latitude: 10, zoom: 2.2 },
      japan: { longitude: 138.5, latitude: 37.5, zoom: 4.2 },
      chile: { longitude: -72.0, latitude: -33.0, zoom: 4.0 },
      med: { longitude: 15.0, latitude: 39.0, zoom: 4.0 },
      indo: { longitude: 118.0, latitude: -2.0, zoom: 3.6 },
    }),
    []
  );

  function focusRegion(key) {
    const target = focusPresets[key] || focusPresets.global;
    setViewState((vs) => ({
      ...vs,
      ...target,
      transitionDuration: 1100,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  }

  async function load(rangeKey) {
    try {
      setLoading(true);
      setErr(null);
      const rows = await fetchQuakes(rangeKey);
      setRawQuakes(rows);
      setSelected(null);
      setSelectedHex(null);
      setHoverInfo(null);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(timeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // mini chart bins
  const magBins = useMemo(() => {
    const bins = [
      { label: "0–2", count: 0 },
      { label: "2–4", count: 0 },
      { label: "4–6", count: 0 },
      { label: "6+", count: 0 },
    ];
    for (const q of quakes) {
      const m = q.mag ?? -999;
      if (m < 0) continue;
      if (m < 2) bins[0].count += 1;
      else if (m < 4) bins[1].count += 1;
      else if (m < 6) bins[2].count += 1;
      else bins[3].count += 1;
    }
    return bins;
  }, [quakes]);

  const depthBins = useMemo(() => {
    const bins = [
      { label: "0–70", count: 0 },
      { label: "70–300", count: 0 },
      { label: "300+", count: 0 },
    ];
    for (const q of quakes) {
      const d = q.depth ?? -999;
      if (d < 0) continue;
      if (d < 70) bins[0].count += 1;
      else if (d < 300) bins[1].count += 1;
      else bins[2].count += 1;
    }
    return bins;
  }, [quakes]);

  function handleClick(info) {
    if (!info) return;

    if (mode === "points") {
      setSelected(info.object ?? null);
      setSelectedHex(null);
      return;
    }

    if (mode === "hex") {
      if (info.object) {
        const obj = info.object;

        const count =
          typeof obj.count === "number"
            ? obj.count
            : Array.isArray(obj.points)
            ? obj.points.length
            : 0;

        let maxMag = null;
        const pts = Array.isArray(obj.points) ? obj.points : null;
        if (pts) {
          for (const p of pts) {
            if (p.mag != null)
              maxMag = maxMag == null ? p.mag : Math.max(maxMag, p.mag);
          }
        }

        setSelectedHex({ count, maxMag });
      } else {
        setSelectedHex(null);
      }
      setSelected(null);
    }
  }

  function handleHover(info) {
    if (!info || !info.object) {
      setHoverInfo(null);
      return;
    }

    if (mode === "points") {
      const q = info.object;
      setHoverInfo({
        x: info.x,
        y: info.y,
        kind: "point",
        mag: q.mag,
        depth: q.depth,
        time: q.time,
        place: q.place,
      });
      return;
    }

    if (mode === "hex") {
      const obj = info.object;

      const count =
        typeof obj.count === "number"
          ? obj.count
          : Array.isArray(obj.points)
          ? obj.points.length
          : 0;

      let maxMag = null;
      const pts = Array.isArray(obj.points) ? obj.points : null;
      if (pts) {
        for (const p of pts) {
          if (p.mag != null)
            maxMag = maxMag == null ? p.mag : Math.max(maxMag, p.mag);
        }
      }

      setHoverInfo({
        x: info.x,
        y: info.y,
        kind: "hex",
        count,
        maxMag,
      });
    }
  }

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <Controls
        isOpen={leftOpen}
        onToggle={() => setLeftOpen((v) => !v)}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        mode={mode}
        setMode={(v) => {
          setMode(v);
          setSelected(null);
          setSelectedHex(null);
          setHoverInfo(null);
        }}
        minMag={minMag}
        setMinMag={setMinMag}
        depthMin={depthMin}
        setDepthMin={setDepthMin}
        depthMax={depthMax}
        setDepthMax={setDepthMax}
        loading={loading}
        onRefresh={() => load(timeRange)}
        err={err}
        summary={summary}
        onFocusRegion={focusRegion}
      />

      <InsightPanel
        isOpen={rightOpen}
        onToggle={() => setRightOpen((v) => !v)}
        summary={summary}
        selected={selected}
        selectedHex={selectedHex}
        magBins={magBins}
        depthBins={depthBins}
      />

      <QuakeMap
        viewState={viewState}
        onViewStateChange={setViewState}
        quakes={quakes}
        mode={mode}
        onClick={handleClick}
        onHover={handleHover}
      />

      {/* Tooltip overlay */}
      {hoverInfo ? (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            left: hoverInfo.x + 12,
            top: hoverInfo.y + 12,
            pointerEvents: "none",
            background: "rgba(0,0,0,0.78)",
            color: "white",
            padding: "8px 10px",
            borderRadius: 10,
            fontSize: 12,
            lineHeight: 1.35,
            maxWidth: 260,
            fontFamily:
              "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          }}
        >
          {hoverInfo.kind === "point" ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                M {hoverInfo.mag != null ? hoverInfo.mag.toFixed(1) : "—"}
              </div>
              <div>
                Depth:{" "}
                {hoverInfo.depth != null
                  ? `${hoverInfo.depth.toFixed(0)} km`
                  : "—"}
              </div>
              <div>
                Time:{" "}
                {hoverInfo.time
                  ? new Date(hoverInfo.time).toLocaleString()
                  : "—"}
              </div>
              <div style={{ marginTop: 4, opacity: 0.95 }}>
                {hoverInfo.place || "—"}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Hotspot</div>
              <div>Events: {hoverInfo.count ?? 0}</div>
              <div>
                Max mag:{" "}
                {hoverInfo.maxMag != null ? hoverInfo.maxMag.toFixed(1) : "—"}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}