<script>
  import { onMount } from "svelte";

  // En ruta per elev — "ett barn bakom varje siffra". De första `value`
  // rutorna (avrundat) målas med affectedColor, resten med baseColor.
  let {
    value = 0,
    total = 100,
    cols = 10,
    affectedColor = "var(--series-red)",
    baseColor = "#cdd9e3",
    affectedLabel = "",
    baseLabel = "",
    title = "",
    caption = "",
  } = $props();

  const affectedCount = $derived(Math.round(value));
  const squares = $derived(
    Array.from({ length: total }, (_, i) => ({
      id: i,
      affected: i < affectedCount,
    }))
  );

  // Rutorna tonar/skalar in med liten stegrad fördröjning när steget blir aktivt
  let revealed = $state(false);
  onMount(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => (revealed = true)));
  });
</script>

<figure class="waffle">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}

  <div class="grid" style="grid-template-columns: repeat({cols}, 1fr)">
    {#each squares as sq, i (sq.id)}
      <div
        class="square"
        class:revealed
        style="background: {sq.affected ? affectedColor : baseColor}; transition-delay: {i * 8}ms"
      ></div>
    {/each}
  </div>

  <div class="legend">
    <span class="key"><span class="dot" style="background:{affectedColor}"></span>{affectedLabel}</span>
    <span class="key"><span class="dot" style="background:{baseColor}"></span>{baseLabel}</span>
  </div>

  {#if caption}<figcaption class="caption">{caption}</figcaption>{/if}
</figure>

<style>
  .waffle {
    margin: 0;
    width: 100%;
    max-width: 300px;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 12px;
  }
  .grid {
    display: grid;
    gap: 3px;
    width: 100%;
  }
  .square {
    aspect-ratio: 1;
    border-radius: 2px;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.25, 1, 0.35, 1),
      background 0.3s ease;
  }
  .square.revealed {
    opacity: 1;
    transform: scale(1);
  }
  .legend {
    display: flex;
    gap: 16px;
    margin-top: 14px;
    flex-wrap: wrap;
  }
  .key {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .dot {
    width: 11px;
    height: 11px;
    border-radius: 2px;
    flex: 0 0 auto;
  }
  .caption {
    margin-top: 10px;
    font-size: 13px;
    color: var(--text-muted);
  }
</style>
