<script>
  let {
    colors = ["#0068b2", "#649ecf", "#98948a", "#cc8370", "#a7391d"],
    low = "Låg frånvaro",
    high = "Hög",
  } = $props();
</script>

<div class="color-legend" role="img" aria-label="{low} till {high}">
  <span class="end">{low}</span>
  <span class="swatches">
    {#each colors as c}
      <span class="swatch" style="background:{c}"></span>
    {/each}
  </span>
  <span class="end">{high}</span>
</div>

<style>
  .color-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
  }
  .end {
    font-size: 11px;
    color: var(--text-muted);
  }
  .swatches {
    display: flex;
    gap: 2px;
  }
  .swatch {
    width: 22px;
    height: 9px;
    border-radius: 2px;
  }
</style>
