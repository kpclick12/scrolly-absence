<script>
  // Ett skolår som ett "commit-graph"-rutnät: kolumner = veckor, rader = veckodagar (mån-fre).
  let { weeks = 36, highlighted = [], title = "", caption = "", color = "var(--series-blue)" } = $props();

  const totalDays = weeks * 5;
  const highlightedSet = $derived(new Set(highlighted));
</script>

<figure class="calstrip">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <div
    class="grid"
    style="grid-template-rows: repeat(5, 1fr); grid-auto-flow: column; grid-auto-columns: 1fr;"
  >
    {#each Array(totalDays) as _, i}
      <div class="cell" class:on={highlightedSet.has(i)} style="--dot-color: {color}"></div>
    {/each}
  </div>
  {#if caption}<figcaption class="note">{caption}</figcaption>{/if}
</figure>

<style>
  .calstrip {
    margin: 0;
    width: 100%;
    max-width: 560px;
  }
  .title {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 8px;
  }
  .grid {
    display: grid;
    gap: 2.5px;
    height: 64px;
  }
  .cell {
    background: var(--gridline);
    border-radius: 2px;
  }
  .cell.on {
    background: var(--dot-color);
  }
  .note {
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-muted);
  }
</style>
