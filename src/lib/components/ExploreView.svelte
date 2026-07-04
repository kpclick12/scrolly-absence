<script>
  import Classroom from "./Classroom.svelte";
  import Legend from "./Legend.svelte";

  let { data } = $props();

  const ALLA = "Alla";
  const lasarOptions = $derived([ALLA, ...new Set(data.explore.map((r) => r.lasar))]);
  const skolaOptions = $derived([ALLA, ...new Set(data.explore.map((r) => r.skola))].sort());
  const arskursOptions = $derived([
    ALLA,
    ...["F", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ]);
  const konOptions = [ALLA, "Flicka", "Pojke"];

  let lasar = $state(ALLA);
  let skola = $state(ALLA);
  let arskurs = $state(ALLA);
  let kon = $state(ALLA);
  let showTable = $state(false);

  const filtered = $derived(
    data.explore.filter(
      (r) =>
        (lasar === ALLA || r.lasar === lasar) &&
        (skola === ALLA || r.skola === skola) &&
        (arskurs === ALLA || r.arskurs === arskurs) &&
        (kon === ALLA || r.kon === kon)
    )
  );

  const result = $derived.by(() => {
    let total = 0;
    let absent = 0;
    let invalid = 0;
    for (const r of filtered) {
      total += r.totalElever;
      absent += (r.totalElever * r.franvaroProcent) / 100;
      invalid += (r.totalElever * r.ogiltigProcent) / 100;
    }
    if (total === 0) return { totalElever: 0, franvaroProcent: 0, giltigProcent: 0, ogiltigProcent: 0 };
    return {
      totalElever: total,
      franvaroProcent: Math.round((absent / total) * 1000) / 10,
      giltigProcent: Math.round(((absent - invalid) / total) * 1000) / 10,
      ogiltigProcent: Math.round((invalid / total) * 1000) / 10,
    };
  });

  const CLASSROOM_SIZE = 22;
</script>

<section class="explore">
  <h2>Utforska själv</h2>
  <p class="intro">
    Kombinera filter för läsår, skola, årskurs och kön för att se hur frånvaron
    ser ut för just den grupp du är intresserad av.
  </p>

  <div class="filters">
    <label>
      Läsår
      <select bind:value={lasar}>
        {#each lasarOptions as opt}<option value={opt}>{opt}</option>{/each}
      </select>
    </label>
    <label>
      Skola
      <select bind:value={skola}>
        {#each skolaOptions as opt}<option value={opt}>{opt}</option>{/each}
      </select>
    </label>
    <label>
      Årskurs
      <select bind:value={arskurs}>
        {#each arskursOptions as opt}
          <option value={opt}>{opt === ALLA ? ALLA : opt === "F" ? "Förskoleklass" : `Åk ${opt}`}</option>
        {/each}
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
      <Classroom
        total={CLASSROOM_SIZE}
        absent={(result.franvaroProcent / 100) * CLASSROOM_SIZE}
        segments={[
          { label: "Giltig (sjuk/anmäld)", color: "var(--giltig)", value: result.giltigProcent },
          { label: "Ogiltig (skolk)", color: "var(--ogiltig)", value: result.ogiltigProcent },
        ]}
        caption="{result.franvaroProcent}% frånvaro · {result.totalElever.toLocaleString('sv-SE')} elever i urvalet"
      />
      <Legend
        items={[
          { label: "Giltig (sjuk/anmäld)", color: "var(--giltig)" },
          { label: "Ogiltig (skolk)", color: "var(--ogiltig)" },
        ]}
      />
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
