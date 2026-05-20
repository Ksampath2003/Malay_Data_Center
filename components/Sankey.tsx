"use client";

// Lightweight 3-column Sankey (Source → Vehicle → Destination).
// Avoids a dep on d3-sankey/recharts-sankey by doing layout by hand.
// Assumes nodes have a `group` of "source" | "vehicle" | "destination".

import { useMemo } from "react";
import type { SankeyNode, SankeyLink } from "@/lib/types";

interface Props {
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: number;
  width?: number;
}

const GROUP_ORDER = ["source", "vehicle", "destination"] as const;
const GROUP_COLOR: Record<string, string> = {
  source: "#60A5FA",
  vehicle: "#FBBF24",
  destination: "#34D399",
};

export function Sankey({ nodes, links, height = 480, width = 1080 }: Props) {
  const layout = useMemo(() => {
    const cols = GROUP_ORDER.map((g) => nodes.filter((n) => n.group === g));
    const colX = [40, width / 2 - 60, width - 220];
    const colW = 16;
    const padding = 14;
    const usableH = height - 40;

    // Compute totals flowing through each node
    const nodeFlow: Record<string, number> = {};
    nodes.forEach((n) => (nodeFlow[n.id] = 0));
    links.forEach((l) => {
      nodeFlow[l.sourceId] = (nodeFlow[l.sourceId] ?? 0) + l.valueUSD_MM;
      nodeFlow[l.targetId] = (nodeFlow[l.targetId] ?? 0) + l.valueUSD_MM;
    });

    // For each column, total flow (max of outflow vs inflow per node summed)
    const colSums = cols.map((col) => col.reduce((s, n) => s + (nodeFlow[n.id] || 0), 0));
    const maxColSum = Math.max(...colSums, 1);

    // Pixel scale: 1 USD-MM → ? px
    const pxPerUnit = (usableH - padding * (Math.max(...cols.map((c) => c.length)) - 1)) / maxColSum;

    // Place each node — top-down within column
    const positioned: Record<
      string,
      { x: number; y: number; h: number; node: SankeyNode }
    > = {};
    cols.forEach((col, ci) => {
      let y = 20;
      col.forEach((n) => {
        const h = Math.max(8, (nodeFlow[n.id] || 0) * pxPerUnit);
        positioned[n.id] = { x: colX[ci], y, h, node: n };
        y += h + padding;
      });
    });

    // Compute link positions per node (running offset along node side)
    const outOffset: Record<string, number> = {};
    const inOffset: Record<string, number> = {};
    nodes.forEach((n) => {
      outOffset[n.id] = 0;
      inOffset[n.id] = 0;
    });

    const renderLinks = links.map((l) => {
      const src = positioned[l.sourceId];
      const tgt = positioned[l.targetId];
      if (!src || !tgt) return null;
      const lh = l.valueUSD_MM * pxPerUnit;
      const sy = src.y + outOffset[l.sourceId];
      const ty = tgt.y + inOffset[l.targetId];
      outOffset[l.sourceId] += lh;
      inOffset[l.targetId] += lh;
      const x0 = src.x + colW;
      const x1 = tgt.x;
      const xm = (x0 + x1) / 2;
      const path = `M ${x0} ${sy + lh / 2}
                    C ${xm} ${sy + lh / 2},
                      ${xm} ${ty + lh / 2},
                      ${x1} ${ty + lh / 2}`;
      return {
        path,
        thickness: lh,
        color: GROUP_COLOR[src.node.group] ?? "#60A5FA",
        link: l,
      };
    });

    return { positioned, renderLinks, colW };
  }, [nodes, links, height, width]);

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="block">
        <g>
          {layout.renderLinks.map((rl, i) =>
            rl ? (
              <path
                key={i}
                d={rl.path}
                fill="none"
                stroke={rl.color}
                strokeOpacity={0.32}
                strokeWidth={Math.max(1, rl.thickness)}
              >
                <title>
                  {`${nodes.find((n) => n.id === rl.link.sourceId)?.label ?? ""} → ${nodes.find((n) => n.id === rl.link.targetId)?.label ?? ""}: $${rl.link.valueUSD_MM.toLocaleString()}M`}
                </title>
              </path>
            ) : null,
          )}
        </g>
        <g>
          {Object.values(layout.positioned).map(({ x, y, h, node }) => (
            <g key={node.id}>
              <rect
                x={x}
                y={y}
                width={layout.colW}
                height={h}
                rx={2}
                fill={GROUP_COLOR[node.group]}
                opacity={0.9}
              />
              <text
                x={node.group === "destination" ? x - 8 : x + layout.colW + 8}
                y={y + h / 2 + 4}
                textAnchor={node.group === "destination" ? "end" : "start"}
                fill="var(--text)"
                fontSize={11}
                style={{ fontFamily: "Inter, ui-sans-serif" }}
              >
                {node.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
