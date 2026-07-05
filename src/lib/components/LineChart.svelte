<script>
  import { scaleLinear, scalePoint } from "d3-scale";

  // series: [{ id, label, color, serie: [{ lasar, franvaroProcent }] }]
  let { series = [], title = "" } = $props();

  const W = 580;
  const H = 380;
  const M = { top: 18, right: 150, bottom: 34, left: 40 };

  const lasarList = $derived(series[0]?.serie.map((p) => p.lasar) ?? []);
  const x = $derived(
    scalePoint().domain(lasarList).range([M.left, W - M.right])
  );
  const yMax = $derived(
    Math.ceil(
      Math.max(...series.flatMap((s) => s.serie.map((p) => p.franvaroProcent))) + 1
    )
  );
  const y = $derived(scaleLinear().domain([0, yMax]).range([H - M.bottom, M.top]));

  function pathFor(s) {
    return s.serie
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.lasar)} ${y(p.franvaroProcent)}`)
      .join(" ");
  }

  const yTicks = $derived(y.ticks(5));
</script>

<figure class="linechart">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <svg viewBox="0 0 {W} {H}" role="img" aria-label={title}>
    {#each yTicks as t}
      <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} class="grid" />
      <text x={M.left - 8} y={y(t)} class="tick" text-anchor="end" dominant-baseline="middle">{t}%</text>
    {/each}
    {#each lasarList as l}
      <text x={x(l)} y={H - M.bottom + 20} class="tick" text-anchor="middle">{l}</text>
    {/each}
    <line x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} class="axis" />

    {#each series as s, si}
      <path
        d={pathFor(s)}
        class="line"
        style="stroke: {s.color}; animation-delay: {si * 250}ms"
        pathLength="1"
      />
      {#each s.serie as p, pi}
        <circle
          cx={x(p.lasar)}
          cy={y(p.franvaroProcent)}
          r={pi === s.serie.length - 1 ? 5.5 : 4}
          fill={s.color}
          stroke="var(--surface-1)"
          stroke-width="2"
          class="pt"
          style="animation-delay: {si * 250 + pi * 180}ms"
        />
      {/each}
      {@const last = s.serie[s.serie.length - 1]}
      <text
        x={x(last.lasar) + 12}
        y={y(last.franvaroProcent)}
        class="end-label"
        style="animation-delay: {si * 250 + 900}ms"
        dominant-baseline="middle"
      >
        <tspan class="end-value" style="fill: {s.color}">{last.franvaroProcent}%</tspan>
        <tspan class="end-name" x={x(last.lasar) + 12} dy="15">{s.label}</tspan>
      </text>
    {/each}
  </svg>
</figure>

<style>
  .linechart {
    margin: 0;
    width: 100%;
    max-width: 580px;
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
  .line {
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 1.1s cubic-bezier(0.5, 0, 0.3, 1) forwards;
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  .pt {
    opacity: 0;
    animation: pt-in 0.3s ease forwards;
  }
  @keyframes pt-in {
    to {
      opacity: 1;
    }
  }
  .end-label {
    opacity: 0;
    animation: pt-in 0.4s ease forwards;
  }
  .end-value {
    font-size: 17px;
    font-weight: 700;
  }
  .end-name {
    font-size: 11.5px;
    fill: var(--text-secondary);
  }
  @media (max-width: 860px) {
    .end-value {
      font-size: 15px;
    }
  }
</style>
