"use client";

// Client-only Leaflet wrapper. Imported via next/dynamic with ssr:false so
// `window` references inside Leaflet don't blow up during SSR.

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  LayerGroup,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import datacenters from "@/data/datacenters.json";
import operators from "@/data/operators.json";
import financiers from "@/data/financiers.json";
import type { DataCenter, Operator, Financier, ProjectStatus, Country } from "@/lib/types";
import { fmtMW, fmtUSD_MM } from "@/lib/calculations";

const STATUS_COLOR: Record<ProjectStatus, string> = {
  operational: "#34D399",
  under_construction: "#FBBF24",
  committed: "#60A5FA",
  planned: "#A78BFA",
  early_stage: "#94A3B8",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  operational: "Operational",
  under_construction: "Under construction",
  committed: "Committed",
  planned: "Planned",
  early_stage: "Early stage",
};

export interface MapFilters {
  statuses: Set<ProjectStatus>;
  countries: Set<Country | "ALL">;
  minMW: number;
}

interface Props {
  filters: MapFilters;
  showHeat: boolean;
}

export default function MapView({ filters, showHeat }: Props) {
  const dcs = datacenters as DataCenter[];
  const opMap = Object.fromEntries((operators as Operator[]).map((o) => [o.id, o]));
  const finMap = Object.fromEntries((financiers as Financier[]).map((f) => [f.id, f]));

  const visible = useMemo(() => {
    return dcs.filter((d) => {
      if (!filters.statuses.has(d.status)) return false;
      if (d.capacityMW < filters.minMW) return false;
      if (!filters.countries.has("ALL")) {
        const op = opMap[d.operatorId];
        if (!op || !filters.countries.has(op.country)) return false;
      }
      return true;
    });
  }, [dcs, filters, opMap]);

  // Fix default-icon ghosting that Next/Leaflet sometimes produces — we use
  // CircleMarker so the marker-icon doesn't apply, but keep the cleanup.
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
  }, []);

  // Center between Johor (1.49) and KL (3.14) so both clusters are visible.
  const center: [number, number] = [2.3, 102.5];

  return (
    <MapContainer
      center={center}
      zoom={8}
      style={{ height: 540, width: "100%", borderRadius: 10 }}
      zoomControl={false}
      attributionControl
    >
      <ZoomControl position="topright" />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/attributions">CARTO</a>'
      />

      {showHeat && (
        <LayerGroup>
          {visible.map((d) => (
            <CircleMarker
              key={`heat-${d.id}`}
              center={[d.lat, d.lng]}
              radius={Math.sqrt(d.capacityMW) * 4}
              pathOptions={{
                color: "transparent",
                fillColor: "#3B82F6",
                fillOpacity: 0.12,
              }}
              interactive={false}
            />
          ))}
        </LayerGroup>
      )}

      <LayerGroup>
        {visible.map((d) => {
          const op = opMap[d.operatorId];
          const fin = finMap[d.primaryFinancierId];
          // Radius scaled by sqrt(MW) so area ~ MW.
          const r = Math.max(6, Math.sqrt(d.capacityMW) * 1.4);
          return (
            <CircleMarker
              key={d.id}
              center={[d.lat, d.lng]}
              radius={r}
              pathOptions={{
                color: STATUS_COLOR[d.status],
                weight: 1.5,
                fillColor: STATUS_COLOR[d.status],
                fillOpacity: 0.5,
              }}
            >
              <Popup>
                <div style={{ minWidth: 220, fontFamily: "Inter, sans-serif" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0B1220" }}>
                    {d.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#56688B", marginTop: 2 }}>
                    {op?.name ?? d.operatorId} · {d.region}
                  </div>
                  <table style={{ marginTop: 8, fontSize: 11, color: "#0B1220" }}>
                    <tbody>
                      <tr><td style={{ paddingRight: 8, color: "#56688B" }}>Capacity</td><td><b>{fmtMW(d.capacityMW)}</b></td></tr>
                      <tr><td style={{ paddingRight: 8, color: "#56688B" }}>Capex</td><td><b>{fmtUSD_MM(d.capexUSD_MM)}</b></td></tr>
                      <tr><td style={{ paddingRight: 8, color: "#56688B" }}>Status</td><td>{STATUS_LABEL[d.status]}</td></tr>
                      <tr><td style={{ paddingRight: 8, color: "#56688B" }}>Online</td><td>{d.expectedOnlineYear ?? "—"}</td></tr>
                      <tr><td style={{ paddingRight: 8, color: "#56688B" }}>Financier</td><td>{fin?.name ?? d.primaryFinancierId}</td></tr>
                    </tbody>
                  </table>
                  {d.notes && (
                    <div style={{ fontSize: 11, color: "#56688B", marginTop: 6, lineHeight: 1.4 }}>{d.notes}</div>
                  )}
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8, letterSpacing: "0.1em" }}>
                    SRC · {d.source.toUpperCase()}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </LayerGroup>
    </MapContainer>
  );
}
