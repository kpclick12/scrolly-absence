<script>
  import { scaleQuantize } from "d3-scale";
  import ColorLegend from "./ColorLegend.svelte";

  // Divergerande blå-röd: blått = låg frånvaro, rött = hög. Byggd på
  // Göteborgsblå + profilens röda, med neutral mitt.
  const BLUE_RAMP = [
    "#0068b2", "#649ecf", "#bfd4e7", "#e7e3d8",
    "#e7c9c2", "#cc8370", "#a7391d",
  ];

  let { rows = [], cols = [], data = [], title = "", unit = "%" } = $props();

  const byKey = $derived(
    new Map(data.map((d) => [`${d.row}__${d.col}`, d.value]))
  );
  const values = $derived(data.map((d) => d.value));
  const color = $derived(
    scaleQuantize()
      .domain([Math.min(...values), Math.max(...values)])
      .range(BLUE_RAMP)
  );
</script>

<figure class="heatmap">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <div class="grid" style="grid-template-columns: auto repeat({cols.length}, 1fr);">
    <div class="corner"></div>
    {#each cols as col}
      <div class="col-label">{col}</div>
    {/each}
    {#each rows as row, ri}
      <div class="row-label">{row}</div>
      {#each cols as col, ci}
        {@const v = byKey.get(`${row}__${col}`)}
        <div
          class="cell"
          style="background:{v != null
            ? color(v)
            : 'var(--gridline)'}; animation-delay: {ri * 90 + ci * 22}ms"
          title="{row} {col}: {v}{unit}"
        ></div>
      {/each}
    {/each}
  </div>
  <ColorLegend colors={BLUE_RAMP} low="Låg frånvaro" high="Hög" />
</figure>

<style>
  .heatmap {
    margin: 0;
    width: 100%;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .grid {
    display: grid;
    gap: 2px;
  }
  .corner {
    width: 44px;
  }
  .col-label,
  .row-label {
    font-size: 10px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .row-label {
    justify-content: flex-end;
    padding-right: 6px;
    white-space: nowrap;
  }
  .cell {
    aspect-ratio: 1;
    border-radius: 2px;
    min-width: 12px;
    animation: cell-in 0.45s ease backwards;
  }
  @keyframes cell-in {
    from {
      opacity: 0;
      transform: scale(0.6);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
