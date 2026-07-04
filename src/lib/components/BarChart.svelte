<script>
  import { scaleLinear } from "d3-scale";

  let {
    data = [],
    color = "var(--series-blue)",
    unit = "%",
    title = "",
    maxValue = null,
  } = $props();

  const domainMax = $derived(
    maxValue ?? Math.max(...data.map((d) => d.value)) * 1.15
  );
  const x = $derived(scaleLinear().domain([0, domainMax]).range([0, 100]));
</script>

<figure class="barchart">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <div class="rows">
    {#each data as d (d.label)}
      <div class="row">
        <span class="label">{d.label}</span>
        <div class="track">
          <div
            class="bar"
            style="width:{x(d.value)}%; background:{d.color ?? color};"
          ></div>
        </div>
        <span class="value">{d.value.toFixed(1)}{unit}</span>
      </div>
    {/each}
  </div>
</figure>

<style>
  .barchart {
    margin: 0;
    width: 100%;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(90px, auto) 1fr 48px;
    align-items: center;
    gap: 10px;
  }
  .label {
    font-size: 13px;
    color: var(--text-secondary);
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .track {
    height: 16px;
    background: var(--gridline);
    border-radius: 4px;
    overflow: hidden;
  }
  .bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  .value {
    font-size: 13px;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
</style>
