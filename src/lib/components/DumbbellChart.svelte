<script>
  import { onMount } from "svelte";

  // data: [{ label, from, to, color }]  — from/to i procent (0–100)
  let {
    data = [],
    unit = "%",
    title = "",
    fromLabel = "åk 6",
    toLabel = "åk 9",
    maxValue = 100,
  } = $props();

  // Ritas in när steget blir aktivt (komponenten monteras om per steg)
  let revealed = $state(false);
  onMount(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => (revealed = true)));
  });

  const pct = (v) => `${(v / maxValue) * 100}%`;
</script>

<figure class="dumbbell">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}

  <div class="legend">
    <span class="key"><span class="dot from"></span>{fromLabel}</span>
    <span class="key"><span class="dot to"></span>{toLabel}</span>
  </div>

  <div class="rows">
    {#each data as d, i (d.label)}
      <div class="row">
        <span class="label">{d.label}</span>
        <div class="pair">
          <div class="track">
            <!-- linjen mellan mätpunkterna: höjningen i högstadiet -->
            <div
              class="connector"
              style="left:{pct(d.from)}; width:{revealed ? pct(d.to - d.from) : '0%'}; background:{d.color}; transition-delay:{i * 90}ms"
            ></div>
            <span
              class="dot from"
              style="left:{pct(d.from)}; opacity:{revealed ? 1 : 0}; transition-delay:{i * 90}ms"
            ></span>
            <span
              class="dot to"
              style="left:{revealed ? pct(d.to) : pct(d.from)}; background:{d.color}; transition-delay:{i * 90}ms"
            ></span>
          </div>
          <span class="values">
            <span class="v-from">{d.from}</span>
            <span class="arrow">→</span>
            <span class="v-to" style="color:{d.color}">{d.to}{unit}</span>
          </span>
        </div>
      </div>
    {/each}
  </div>
</figure>

<style>
  .dumbbell {
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
    gap: 16px;
    margin-bottom: 16px;
  }
  .key {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .label {
    display: block;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }
  .pair {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .track {
    position: relative;
    flex: 1;
    height: 14px;
    background: var(--gridline);
    border-radius: 7px;
  }
  .connector {
    position: absolute;
    top: 50%;
    height: 5px;
    transform: translateY(-50%);
    border-radius: 3px;
    transition: width 0.7s cubic-bezier(0.25, 1, 0.35, 1);
  }
  /* Grundutseende — delas av både förklaringen och prickarna i spåret */
  .dot {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--surface-1);
  }
  .dot.from {
    background: var(--surface-1);
    border: 2px solid var(--baseline);
  }
  .dot.to {
    background: var(--series-red);
  }
  /* Positionering gäller bara prickarna inne i spåret, inte förklaringen */
  .track .dot {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    transition: left 0.7s cubic-bezier(0.25, 1, 0.35, 1), opacity 0.4s ease;
  }
  .legend .dot {
    width: 11px;
    height: 11px;
    box-shadow: none;
  }
  .values {
    flex: 0 0 auto;
    min-width: 72px;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
    text-align: right;
    white-space: nowrap;
  }
  .v-to {
    font-weight: 700;
  }
  .arrow {
    margin: 0 2px;
    color: var(--text-muted);
  }
  @media (max-width: 860px) {
    .rows {
      gap: 12px;
    }
    .label {
      font-size: 12px;
      margin-bottom: 4px;
    }
    .values {
      min-width: 66px;
      font-size: 12px;
    }
  }
</style>
