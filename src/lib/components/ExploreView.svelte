<script>
  import Heatmap from "./Heatmap.svelte";

  let { data } = $props();

  const ALLA = "Alla";
  const ARSKURSER = ["F", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const skolaOptions = $derived([ALLA, ...new Set(data.explore.map((r) => r.skola))].sort());
  const konOptions = [ALLA, "Flicka", "Pojke"];
  const lasarList = $derived([...new Set(data.explore.map((r) => r.lasar))]);

  let skola = $state(ALLA);
  let kon = $state(ALLA);
  let showTable = $state(false);

  const filtered = $derived(
    data.explore.filter(
      (r) =>
        (skola === ALLA || r.skola === skola) &&
        (kon === ALLA || r.kon === kon)
    )
  );

  // Årskurs × läsår, viktat på elevantal — samma mönster som stadietrenden,
  // men i full upplösning och filtrerbart.
  const heatCells = $derived.by(() => {
    const acc = new Map();
    for (const r of filtered) {
      const key = `${r.arskurs}__${r.lasar}`;
      const cur = acc.get(key) ?? { t: 0, a: 0 };
      cur.t += r.totalElever;
      cur.a += (r.totalElever * r.franvaroProcent) / 100;
      acc.set(key, cur);
    }
    const cells = [];
    for (const ak of ARSKURSER) {
      for (const lasar of lasarList) {
        const cur = acc.get(`${ak}__${lasar}`);
        if (cur && cur.t > 0) {
          cells.push({
            row: ak === "F" ? "F-klass" : `Åk ${ak}`,
            col: lasar,
            value: Math.round((cur.a / cur.t) * 1000) / 10,
          });
        }
      }
    }
    return cells;
  });
  const heatRows = $derived(
    ARSKURSER.map((ak) => (ak === "F" ? "F-klass" : `Åk ${ak}`))
  );

  const result = $derived.by(() => {
    let total = 0;
    let absent = 0;
    for (const r of filtered) {
      if (r.lasar !== lasarList[lasarList.length - 1]) continue;
      total += r.totalElever;
      absent += (r.totalElever * r.franvaroProcent) / 100;
    }
    if (total === 0) return { totalElever: 0, franvaroProcent: 0 };
    return {
      totalElever: total,
      franvaroProcent: Math.round((absent / total) * 1000) / 10,
    };
  });
</script>

<section class="explore">
  <h2>Utforska själv</h2>
  <p class="intro">
    Hela mönstret i en bild: varje ruta är en årskurs under ett läsår.
    Ju rödare, desto högre frånvaro. Filtrera på skola och kön och se om
    högstadietrappan syns även där.
  </p>

  <div class="filters">
    <label>
      Skola
      <select bind:value={skola}>
        {#each skolaOptions as opt}<option value={opt}>{opt}</option>{/each}
      </select>
    </label>
    <label>
      Kön
      <select bind:value={kon}>
        {#each konOptions as opt}<option value={opt}>{opt}</option>{/each}
      </select>
    </label>
  </div>

  {#if result.totalElever === 0}
    <p class="empty">Inga elever matchar den här kombinationen.</p>
  {:else}
    <div class="result">
      {#key `${skola}__${kon}`}
        <Heatmap
          rows={heatRows}
          cols={lasarList}
          data={heatCells}
          title="Frånvaro % per årskurs och läsår · {result.franvaroProcent}% i snitt {lasarList[lasarList.length - 1]} · {result.totalElever.toLocaleString('sv-SE')} elever i urvalet"
        />
      {/key}
    </div>

    <button class="toggle-table" onclick={() => (showTable = !showTable)}>
      {showTable ? "Dölj tabell" : "Visa som tabell"}
    </button>

    {#if showTable}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Läsår</th>
              <th>Skola</th>
              <th>Årskurs</th>
              <th>Kön</th>
              <th>Elever</th>
              <th>Frånvaro %</th>
            </tr>
          </thead>
          <tbody>
            {#each filtered as r (r.lasar + r.skola + r.arskurs + r.kon)}
              <tr>
                <td>{r.lasar}</td>
                <td>{r.skola}</td>
                <td>{r.arskurs === "F" ? "Förskoleklass" : `Åk ${r.arskurs}`}</td>
                <td>{r.kon}</td>
                <td class="num">{r.totalElever}</td>
                <td class="num">{r.franvaroProcent}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</section>

<style>
  .explore {
    max-width: 760px;
    margin: 0 auto;
    padding: 80px 24px 120px;
  }
  h2 {
    font-size: 28px;
    text-align: center;
    margin: 0 0 12px;
  }
  .intro {
    text-align: center;
    max-width: 560px;
    margin: 0 auto 32px;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    margin-bottom: 32px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: var(--text-muted);
  }
  select {
    font: inherit;
    font-size: 14px;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface-1);
    color: var(--text-primary);
  }
  .result {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .result :global(.heatmap) {
    max-width: 460px;
  }
  /* Med bara 5 kolumner blir kvadratiska celler enorma på mobil —
     fast radhöjd ger ett kompakt rutnät och jämna rader. */
  .result :global(.heatmap .cell) {
    aspect-ratio: auto;
    height: 30px;
  }
  .empty {
    text-align: center;
    color: var(--text-muted);
  }
  .toggle-table {
    display: block;
    margin: 24px auto 0;
    font: inherit;
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface-1);
    color: var(--text-primary);
    cursor: pointer;
  }
  .toggle-table:hover {
    background: var(--gridline);
  }
  .table-wrap {
    margin-top: 20px;
    max-height: 360px;
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th, td {
    padding: 6px 10px;
    text-align: left;
    border-bottom: 1px solid var(--gridline);
    white-space: nowrap;
  }
  th {
    position: sticky;
    top: 0;
    background: var(--surface-1);
    color: var(--text-muted);
    font-weight: 600;
  }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
