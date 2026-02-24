import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { HexagonLayer } from "deck.gl";

export default function QuakeMap({ initialViewState, quakes, mode, onClick, onHover,}) {
  const layers =
    mode === "hex"
      ? [
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
        ]
      : [
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

  return (
    <DeckGL
      initialViewState={initialViewState}
      controller
      layers={layers}
      onClick={onClick}
      onHover={onHover}
    >
      <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" />
    </DeckGL>
  );
}