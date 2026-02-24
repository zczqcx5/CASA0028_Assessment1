export default function Controls({
  isOpen,
  onToggle,
  timeRange,
  setTimeRange,
  mode,
  setMode,
  minMag,
  setMinMag,
  depthMin,
  setDepthMin,
  depthMax,
  setDepthMax,
  loading,
  onRefresh,
  err,
  summary,
  onFocusRegion,
}) {
  const btnStyle = {
    padding: "6px 8px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
  };

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 10,
        top: 12,
        left: 12,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      {!isOpen ? (
        <button
          onClick={onToggle}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "none",
            background: "rgba(0,0,0,0.72)",
            color: "white",
            cursor: "pointer",
          }}
          title="Expand controls"
        >
          ☰
        </button>
      ) : (
        <div
          style={{
            width: 340,
            background: "rgba(0,0,0,0.72)",
            color: "white",
            padding: "12px 12px",
            borderRadius: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 800, flex: 1 }}>
              Global Earthquakes Explorer
            </div>
            <button
              onClick={onToggle}
              style={{
                border: "none",
                background: "rgba(255,255,255,0.12)",
                color: "white",
                borderRadius: 10,
                padding: "6px 8px",
                cursor: "pointer",
              }}
              title="Collapse controls"
            >
              ⇤
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6, marginBottom: 10 }}>
            Data: USGS feed. Use controls to filter and switch layers.
          </div>

          {/* Region focus buttons */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
              Region focus
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button style={btnStyle} onClick={() => onFocusRegion("global")}>
                Global
              </button>
              <button style={btnStyle} onClick={() => onFocusRegion("ringOfFire")}>
                Ring of Fire
              </button>
              <button style={btnStyle} onClick={() => onFocusRegion("japan")}>
                Japan
              </button>
              <button style={btnStyle} onClick={() => onFocusRegion("chile")}>
                Chile
              </button>
              <button style={btnStyle} onClick={() => onFocusRegion("med")}>
                Mediterranean
              </button>
              <button style={btnStyle} onClick={() => onFocusRegion("indo")}>
                Indonesia
              </button>
            </div>
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
                onChange={(e) => setMode(e.target.value)}
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
              onClick={onRefresh}
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

            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Source: USGS “all_{timeRange}” feed
            </div>
          </div>
        </div>
      )}
    </div>
  );
}