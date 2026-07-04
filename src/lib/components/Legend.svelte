<script>
  let { items = [] } = $props(); // [{ label, color }]
</script>

<ul class="legend">
  {#each items as item (item.label)}
    <li>
      <span class="swatch" style="background:{item.color}"></span>
      {item.label}
    </li>
  {/each}
</ul>

<style>
  .legend {
    display: flex;
    gap: 16px;
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    flex-wrap: wrap;
    justify-content: center;
  }
  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
  }
  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }
</style>
