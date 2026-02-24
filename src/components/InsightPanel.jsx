import { formatTime } from "../lib/usgs";

function MiniBars({ title, items }) {
  const max = Math.max(...items.map((d) => d.count), 1);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
        {title}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((d) => (
          <div
            key={d.label}
            style={{
              display: "grid",
              gridTemplateColumns: "70px 1fr 42px",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              opacity: 0.95,
            }}
          >
            <div style={{ opacity: 0.9 }}>{d.label}</div>
            <div
              style={{
                height: 10,
                background: "rgba(255,255,255,0.12)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(d.count / max) * 100}%`,
                  background: "rgba(154, 211, 255, 0.9)",
                }}
              />
            </div>
            <div style={{ textAlign: "right", opacity: 0.9 }}>{d.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InsightPanel({
  isOpen,
  onToggle,
  summary,
  selected,
  selectedHex,
  magBins,
  depthBins,
}) {
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 10,
        top: 12,
        right: 12,
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
          title="Expand insights"
        >
          ☰
        </button>
      ) : (
        <div
          style={{
            width: 360,
            background: "rgba(0,0,0,0.72)",
            color: "white",
            padding: "12px 12px",
            borderRadius: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 800, flex: 1 }}>Insights</div>
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
              title="Collapse insights"
            >
              ⇥
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.95, marginTop: 6, marginBottom: 10 }}>
            Latest event time: <b>{summary.latest ? formatTime(summary.latest) : "—"}</b>
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
                <b>Time:</b> {formatTime(selected.time)}
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
          ) : selectedHex ? (
            <div style={{ fontSize: 13, lineHeight: 1.4 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Selected hotspot</div>
              <div>
                <b>Events in hex:</b> {selectedHex.count}
              </div>
              <div>
                <b>Max magnitude in hex:</b>{" "}
                {selectedHex.maxMag != null ? selectedHex.maxMag.toFixed(1) : "—"}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, opacity: 0.9 }}>Nothing selected.</div>
          )}

          <MiniBars title="Magnitude distribution" items={magBins} />
          <MiniBars title="Depth distribution (km)" items={depthBins} />
        </div>
      )}
    </div>
  );
}