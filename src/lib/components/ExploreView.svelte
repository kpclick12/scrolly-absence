<script>
  import Heatmap from "./Heatmap.svelte";

  let { data } = $props();

  const ALLA = "Alla";
  const STADIER = [
    { id: "lag", label: "F–3", arskurser: ["F", "1", "2", "3"] },
    { id: "mellan", label: "4–6", arskurser: ["4", "5", "6"] },
    { id: "hog", label: "7–9", arskurser: ["7", "8", "9"] },
  ];
  const skolaOptions = $derived([ALLA, ...new Set(data.explore.map((r) => r.skola))].sort());
  const konOptions = [ALLA, "Flicka", "Pojke"];
  const lasarList = $derived([...new Set(data.explore.map((r) => r.lasar))]);

  let skola = $state(ALLA);
  let kon = $state(ALLA);
  let showTable = $state(false);
  let metric = $state("snitt"); // "snitt" | "andel"

  const filtered = $derived(
    data.explore.filter(
      (r) =>
        (skola === ALLA || r.skola === skola) &&
        (kon === ALLA || r.kon === kon)
    )
  );

  // Stadium × läsår, viktat på elevantal — både snittfrånvaro och
  // andel elever med ≥15% frånvaro.
  const aggregerat = $derived.by(() => {
    const acc = new Map();
    for (const r of filtered) {
      const st = STADIER.find((s) => s.arskurser.includes(r.arskurs));
      const key = `${st.id}__${r.lasar}`;
      const cur = acc.get(key) ?? { t: 0, a: 0, o15: 0 };
      cur.t += r.totalElever;
      cur.a += (r.totalElever * r.franvaroProcent) / 100;
      cur.o15 += (r.totalElever * r.andelOver15) / 100;
      acc.set(key, cur);
    }
    const rows = [];
    for (const st of STADIER) {
      for (const lasar of lasarList) {
        const cur = acc.get(`${st.id}__${lasar}`);
        if (cur && cur.t > 0) {
          rows.push({
            stadium: st.label,
            lasar,
            elever: cur.t,
            snitt: Math.round((cur.a / cur.t) * 1000) / 10,
            andelOver15: Math.round((cur.o15 / cur.t) * 1000) / 10,
          });
        }
      }
    }
    return rows;
  });
  const heatRows = STADIER.map((s) => s.label);
  const heatCells = $derived(
    aggregerat.map((r) => ({
      row: r.stadium,
      col: r.lasar,
      value: metric === "snitt" ? r.snitt : r.andelOver15,
    }))
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
    Hela mönstret i en bild: varje ruta är ett stadium under ett läsår.
    Ju rödare, desto värre. Växla mellan snittfrånvaro och andelen elever
    med hög frånvaro, filtrera på skola och kön.
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
    <div class="metric-toggle" role="group" aria-label="Välj mått">
      <button class:active={metric === "snitt"} onclick={() => (metric = "snitt")}>
        Snittfrånvaro %
      </button>
      <button class:active={metric === "andel"} onclick={() => (metric = "andel")}>
        Andel elever ≥15 %
      </button>
    </div>

    <div class="result">
      {#key `${skola}__${kon}__${metric}`}
        <Heatmap
          rows={heatRows}
          cols={lasarList}
          data={heatCells}
          title="{metric === 'snitt' ? 'Snittfrånvaro %' : 'Andel elever med ≥15% frånvaro'} per stadium och läsår · {result.totalElever.toLocaleString('sv-SE')} elever i urvalet"
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
              <th>Stadium</th>
              <th>Elever</th>
              <th>Snittfrånvaro %</th>
              <th>Andel ≥15 %</th>
            </tr>
          </thead>
          <tbody>
            {#each aggregerat as r (r.stadium + r.lasar)}
              <tr>
                <td>{r.lasar}</td>
                <td>{r.stadium}</td>
                <td class="num">{r.elever.toLocaleString("sv-SE")}</td>
                <td class="num">{r.snitt.toFixed(1)}</td>
                <td class="num">{r.andelOver15.toFixed(1)}</td>
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
  .metric-toggle {
    display: flex;
    gap: 6px;
    justify-content: center;
    margin-bottom: 18px;
  }
  .metric-toggle button {
    font: inherit;
    font-size: 13px;
    padding: 7px 14px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface-1);
    color: var(--text-secondary);
    cursor: pointer;
  }
  .metric-toggle button.active {
    background: var(--hero-navy);
    border-color: var(--hero-navy);
    color: #ffffff;
    font-weight: 600;
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
