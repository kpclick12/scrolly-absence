<script>
  import { onMount } from "svelte";
  import { scaleLinear, scalePoint } from "d3-scale";

  // series: [{ lasar, shares: [n,n,n,n] }] — shares summerar till 100.
  // labels[0]/colors[0] läggs längst ner i stapeln (0–15%), sista överst (50–100%).
  let { series = [], labels = [], colors = [], title = "", caption = "" } = $props();

  const W = 580;
  const H = 320;
  const M = { top: 12, right: 12, bottom: 30, left: 4 };

  const lasarList = $derived(series.map((p) => p.lasar));
  const x = $derived(scalePoint().domain(lasarList).range([M.left, W - M.right]));
  const y = $derived(scaleLinear().domain([0, 100]).range([H - M.bottom, M.top]));

  // Kumulativa gränser (0..100) för varje band, per läsår — bandet på index 0
  // (blått, 0–15%) ligger underst, sista bandet (rött) överst i stapeln.
  function cumBounds(shares) {
    let acc = 0;
    return shares.map((s) => {
      const bottom = acc;
      acc += s;
      return [bottom, acc];
    });
  }
  const bounds = $derived(series.map((p) => cumBounds(p.shares)));

  // Polygon-punkter för band j: undre kant vänster->höger, sedan övre kant höger->vänster.
  function bandPath(j) {
    if (!bounds.length) return "";
    const bottomPts = series.map((p, i) => `${x(p.lasar)},${y(bounds[i][j][0])}`);
    const topPts = series
      .map((p, i) => `${x(p.lasar)},${y(bounds[i][j][1])}`)
      .reverse();
    return `M ${bottomPts.concat(topPts).join(" L ")} Z`;
  }

  function shortLasar(l) {
    const [a, b] = l.split("/");
    return `${a.slice(-2)}/${b.slice(-2)}`;
  }

  // Första och sista ticken ankras in mot kanten så de inte klipps av.
  function tickAnchor(i, n) {
    if (i === 0) return "start";
    if (i === n - 1) return "end";
    return "middle";
  }

  // Andel per band senaste läsåret — visas i förklaringen.
  const legend = $derived(
    labels.map((label, j) => ({
      label,
      color: colors[j],
      share: series.length ? series[series.length - 1].shares[j] : 0,
    }))
  );

  // Ritas in när steget blir aktivt (komponenten monteras om per steg)
  let revealed = $state(false);
  onMount(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => (revealed = true)));
  });

  const innerLeft = M.left;
  const innerWidth = W - M.left - M.right;
</script>

<figure class="stacked-area">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}

  <div class="legend">
    {#each legend as l}
      <span class="key">
        <span class="swatch" style="background: {l.color}"></span>
        <span class="k-label">{l.label}</span>
        <span class="k-share">{l.share}%</span>
      </span>
    {/each}
  </div>

  <svg viewBox="0 0 {W} {H}" role="img" aria-label={title}>
    <clipPath id="reveal-clip">
      <rect
        x={innerLeft}
        y="0"
        width={revealed ? innerWidth : 0}
        height={H}
        style="transition: width 0.9s cubic-bezier(0.25, 1, 0.35, 1)"
      />
    </clipPath>

    <g clip-path="url(#reveal-clip)">
      {#each labels as label, j}
        <path d={bandPath(j)} fill={colors[j]} class="band" style="--i: {j}" />
      {/each}
    </g>

    {#each lasarList as l, i}
      <text
        x={x(l)}
        y={H - M.bottom + 20}
        class="tick"
        text-anchor={tickAnchor(i, lasarList.length)}
      >
        {shortLasar(l)}
      </text>
    {/each}
    <line x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} class="axis" />
  </svg>
  {#if caption}<figcaption class="caption">{caption}</figcaption>{/if}
</figure>

<style>
  .stacked-area {
    margin: 0;
    width: 100%;
    max-width: 540px;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 12px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-bottom: 14px;
  }
  .key {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .swatch {
    width: 11px;
    height: 11px;
    border-radius: 2px;
    flex: 0 0 auto;
  }
  .k-share {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .band {
    opacity: 0.92;
  }
  .axis {
    stroke: var(--baseline);
    stroke-width: 1;
  }
  .tick {
    font-size: 11px;
    fill: var(--text-muted);
  }
  .caption {
    margin-top: 10px;
    font-size: 13px;
    color: var(--text-muted);
  }
</style>
