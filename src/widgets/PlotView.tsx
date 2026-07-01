import React, { useEffect, useMemo, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

export type PlotSeries = { key: string; label: string; unit?: string };

export function PlotView(props: {
  frames: any[];
  series: PlotSeries[];
  title?: string;
  height?: number;
  formatter?: (key: string, v: number) => number;
}) {
  const height = props.height ?? 240;

  const data = useMemo(() => {
    const t: number[] = [];
    const ys: number[][] = props.series.map(() => []);

    for (const f of props.frames) {
      const tt = Number(f?.t_ms);
      if (!Number.isFinite(tt)) continue;

      t.push(tt / 1000);
      props.series.forEach((s, i) => {
        const raw = f?.[s.key];
        const v = typeof raw === "number" ? raw : NaN;
        ys[i].push(Number.isFinite(v) ? (props.formatter ? props.formatter(s.key, v) : v) : NaN);
      });
    }

    return [t, ...ys] as any[];
  }, [props.frames, props.series, props.formatter]);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    plotRef.current?.destroy();
    plotRef.current = null;

    const opts: uPlot.Options = {
      title: props.title ?? "",
      width: hostRef.current.clientWidth,
      height,
      series: [
        { label: "t (s)" },
        ...props.series.map((s) => ({ label: `${s.label}${s.unit ? ` (${s.unit})` : ""}` })),
      ],
      axes: [{}, {}],
      scales: { x: { time: false } },
    };

    const p = new uPlot(opts, data, hostRef.current);
    plotRef.current = p;

    const ro = new ResizeObserver(() => {
      if (!plotRef.current || !hostRef.current) return;
      plotRef.current.setSize({ width: hostRef.current.clientWidth, height });
    });
    ro.observe(hostRef.current);

    return () => {
      ro.disconnect();
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [data, props.series, props.title, height]);

  function exportCSV() {
    const headers = ["t_s", ...props.series.map((s) => s.key)];
    const rows: string[] = [];
    rows.push(headers.join(","));

    const t = data[0] as number[];
    for (let i = 0; i < t.length; i++) {
      const row = [t[i].toFixed(3)];
      for (let si = 0; si < props.series.length; si++) {
        const y = (data[si + 1] as number[])[i];
        row.push(Number.isFinite(y) ? String(y) : "");
      }
      rows.push(row.join(","));
    }

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(props.title ?? "plot").replace(/\s+/g, "_").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPNG() {
    const canvas = hostRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(props.title ?? "plot").replace(/\s+/g, "_").toLowerCase()}.png`;
    a.click();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={exportCSV}>Export CSV</button>
        <button onClick={exportPNG}>Export PNG</button>
      </div>

      <div
        ref={hostRef}
        style={{
          width: "100%",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.18)",
          padding: 6,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}