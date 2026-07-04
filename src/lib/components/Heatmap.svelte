<script>
  import { scaleQuantize } from "d3-scale";

  // sekventiell blå-ramp (ljus -> mörk), se dataviz-palettens 100->700-steg
  const BLUE_RAMP = [
    "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5",
    "#256abf", "#184f95", "#0d366b",
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
    {#each rows as row}
      <div class="row-label">{row}</div>
      {#each cols as col}
        {@const v = byKey.get(`${row}__${col}`)}
        <div
          class="cell"
          style="background:{v != null ? color(v) : 'var(--gridline)'}"
          title="{row} {col}: {v}{unit}"
        ></div>
      {/each}
    {/each}
  </div>
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
  }
</style>
