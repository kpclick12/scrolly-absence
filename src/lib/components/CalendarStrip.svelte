<script>
  // Ett skolår som ett "commit-graph"-rutnät: kolumner = veckor, rader = veckodagar (mån-fre).
  let { weeks = 36, highlighted = [], title = "", caption = "", color = "var(--series-blue)" } = $props();

  const totalDays = weeks * 5;
</script>

<figure class="calstrip">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <div
    class="grid"
    style="grid-template-rows: repeat(5, 1fr); grid-auto-flow: column; grid-auto-columns: 1fr;"
  >
    {#each Array(totalDays) as _, i}
      {@const rank = highlighted.indexOf(i)}
      <div
        class="cell"
        class:on={rank >= 0}
        style="--dot-color: {color}; animation-delay: {rank >= 0 ? 300 + rank * 110 : 0}ms"
      ></div>
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
    /* frånvarodagarna tänds en i taget, som dagar som går */
    animation: day-on 0.3s ease backwards;
    background: var(--dot-color);
  }
  @keyframes day-on {
    from {
      background: var(--gridline);
      transform: scale(0.7);
    }
    to {
      transform: scale(1);
    }
  }
  .note {
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-muted);
  }
</style>
