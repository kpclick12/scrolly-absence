<script>
  import { scaleLinear } from "d3-scale";

  // Divergerande skala: blått = låg frånvaro, rött = hög. 5 steg med grå
  // mitt — de blekaste stegen ur 7-stegsrampen försvinner mot cremefärgad
  // bakgrund när markören är en liten prick.
  const DIVERGING = ["#0068b2", "#649ecf", "#98948a", "#cc8370", "#a7391d"];

  let { data = [], title = "", xLabel = "", yLabel = "" } = $props();

  const W = 560;
  const H = 400;
  const M = { top: 16, right: 20, bottom: 46, left: 46 };

  const xs = $derived(data.map((d) => d.sociIndex));
  const ys = $derived(data.map((d) => d.franvaroProcent));

  const x = $derived(
    scaleLinear().domain([20, 210]).range([M.left, W - M.right])
  );
  const yMax = $derived(Math.ceil(Math.max(...ys) + 0.5));
  const yMin = $derived(Math.floor(Math.min(...ys) - 0.5));
  const y = $derived(
    scaleLinear().domain([yMin, yMax]).range([H - M.bottom, M.top])
  );

  const colorFor = $derived.by(() => {
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    return (v) => {
      const t = (v - lo) / Math.max(hi - lo, 0.001);
      return DIVERGING[Math.min(DIVERGING.length - 1, Math.floor(t * DIVERGING.length))];
    };
  });

  // Enkel minsta-kvadrat-linje för att visa riktningen på sambandet
  const trend = $derived.by(() => {
    const n = data.length;
    if (n < 2) return null;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) ** 2;
    }
    const slope = num / den;
    const intercept = my - slope * mx;
    return { x1: 30, y1: intercept + slope * 30, x2: 200, y2: intercept + slope * 200 };
  });

  const xTicks = [50, 100, 150, 200];
  const yTicks = $derived(y.ticks(5));
</script>

<figure class="corr">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <svg viewBox="0 0 {W} {H}" role="img" aria-label={title}>
    {#each yTicks as t}
      <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} class="grid" />
      <text x={M.left - 8} y={y(t)} class="tick" text-anchor="end" dominant-baseline="middle">{t}%</text>
    {/each}
    {#each xTicks as t}
      <text x={x(t)} y={H - M.bottom + 18} class="tick" text-anchor="middle">{t}</text>
    {/each}
    <line x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom} class="axis" />

    {#if trend}
      <line
        x1={x(trend.x1)} y1={y(trend.y1)}
        x2={x(trend.x2)} y2={y(trend.y2)}
        class="trend"
      />
    {/if}

    {#each data as d (d.skola)}
      <circle
        cx={x(d.sociIndex)}
        cy={y(d.franvaroProcent)}
        r="7"
        fill={colorFor(d.franvaroProcent)}
        stroke="var(--surface-1)"
        stroke-width="2"
      >
        <title>{d.skola}: index {d.sociIndex}, {d.franvaroProcent}% frånvaro</title>
      </circle>
    {/each}

    <text x={(M.left + W - M.right) / 2} y={H - 8} class="axis-label" text-anchor="middle">{xLabel}</text>
    <text x={12} y={(M.top + H - M.bottom) / 2} class="axis-label" text-anchor="middle" transform="rotate(-90 12 {(M.top + H - M.bottom) / 2})">{yLabel}</text>
  </svg>
</figure>

<style>
  .corr {
    margin: 0;
    width: 100%;
    max-width: 560px;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .grid {
    stroke: var(--gridline);
    stroke-width: 1;
  }
  .axis {
    stroke: var(--baseline);
    stroke-width: 1;
  }
  .tick {
    font-size: 11px;
    fill: var(--text-muted);
  }
  .axis-label {
    font-size: 12px;
    fill: var(--text-secondary);
    font-weight: 600;
  }
  .trend {
    stroke: var(--text-muted);
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
    opacity: 0.7;
  }
</style>
