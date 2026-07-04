<script>
  import { fade } from "svelte/transition";
  import Scrolly from "../components/Scrolly.svelte";
  import Classroom from "../components/Classroom.svelte";
  import Heatmap from "../components/Heatmap.svelte";
  import BarChart from "../components/BarChart.svelte";
  import ScatterMap from "../components/ScatterMap.svelte";
  import BucketSwarm from "../components/BucketSwarm.svelte";
  import CalendarStrip from "../components/CalendarStrip.svelte";
  import {
    overallForYear,
    overallForYearByKon,
    gradeBarData,
  } from "./aggregate.js";

  let { data } = $props();

  let currentStep = $state(0);

  const latestYear = $derived(data.overview.senasteLasar);
  const overall = $derived(overallForYear(data.byGrade, latestYear));
  const flicka = $derived(overallForYearByKon(data.byGrade, latestYear, "Flicka"));
  const pojke = $derived(overallForYearByKon(data.byGrade, latestYear, "Pojke"));
  const gradeData = $derived(gradeBarData(data.byGrade, latestYear));
  const heatmapRows = $derived([...new Set(data.timeseries.map((d) => d.lasar))]);
  const heatmapCols = $derived([...new Set(data.timeseries.map((d) => d.manad))]);
  const heatmapCells = $derived(
    data.timeseries.map((d) => ({ row: d.lasar, col: d.manad, value: d.franvaroProcent }))
  );
  const subjectBars = $derived(
    data.bySubject.map((d) => ({ label: d.amne, value: d.franvaroProcent }))
  );
  const konBars = $derived([
    { label: "Flickor — giltig", value: flicka.giltigProcent, color: "var(--giltig)" },
    { label: "Flickor — ogiltig", value: flicka.ogiltigProcent, color: "var(--ogiltig)" },
    { label: "Pojkar — giltig", value: pojke.giltigProcent, color: "var(--giltig)" },
    { label: "Pojkar — ogiltig", value: pojke.ogiltigProcent, color: "var(--ogiltig)" },
  ]);
  const giltigOgiltigBars = $derived([
    { label: "Giltig (sjuk/anmäld)", value: overall.giltigProcent, color: "var(--giltig)" },
    { label: "Ogiltig (skolk)", value: overall.ogiltigProcent, color: "var(--ogiltig)" },
  ]);

  // Skolverkets garanterade undervisningstid, hela grundskolan (åk 1-9, klocktimmar).
  // Matematik är bara en dryg sjundedel av all undervisningstid — så samma
  // antal frånvarotimmar väger mycket tyngre om man tänker sig dem samlade
  // i just matematiken, ett kumulativt ämne där varje moment bygger på det förra.
  const TIMPLAN_TOTAL = 6890;
  const TIMPLAN_MATEMATIK = 1090;
  const mathReframed = $derived(
    Math.round(overall.franvaroProcent * (TIMPLAN_TOTAL / TIMPLAN_MATEMATIK) * 10) / 10
  );

  const CLASSROOM_SIZE = 22;

  // Kalenderremsa: samma antal frånvarodagar (10 = två skolveckor), men
  // spridda över året kontra i följd — mönstret berättar olika historier.
  // Placerar det sammanhängande blocket i november, i linje med säsongstoppen.
  const CAL_WEEKS = 36;
  const continuousDays = Array.from({ length: 10 }, (_, i) => 14 * 5 + i);
  const scatteredDays = Array.from({ length: 10 }, (_, i) =>
    Math.floor((i + 0.5) * ((CAL_WEEKS * 5) / 10))
  );

  const steps = $derived([
    {
      kicker: "Grundskoleförvaltningen",
      headline: "En helt vanlig skoldag",
    },
    {
      kicker: "Snittet döljer sanningen",
      headline: "De flesta elever är knappt borta alls",
    },
    {
      kicker: "Mönstret spelar roll",
      headline: "Samma antal dagar, olika allvar",
    },
    {
      kicker: "Över läsåret",
      headline: "Frånvaron följer årstiderna",
    },
    {
      kicker: "Årskurs",
      headline: "Frånvaron ökar med åldern",
    },
    {
      kicker: "Kön",
      headline: "Flickor och pojkar",
    },
    {
      kicker: "Ämne",
      headline: "Vissa lektioner tappar fler elever",
    },
    {
      kicker: "Skola",
      headline: "Skillnader mellan skolor",
    },
    {
      kicker: "Giltig eller ogiltig",
      headline: "Sjukanmäld — eller skolkar eleven?",
    },
    {
      kicker: "Läsår " + latestYear,
      headline: "Utforska datan själv",
    },
  ]);
</script>

<Scrolly onStepChange={(i) => (currentStep = i)}>
  {#snippet visual()}
    <div class="visual-stack">
      <!-- BucketSwarm stannar kvar monterad (ur/i {#key}) så att bollen faktiskt
           hinner klumpa ihop sig och sprida ut sig — inte bara poppa upp klar. -->
      <div class="bucket-layer" class:active={currentStep === 1}>
        <BucketSwarm
          dots={data.studentDistribution.dots}
          buckets={data.studentDistribution.buckets}
          spread={currentStep === 1}
          caption="Varje prick ≈ {data.studentDistribution.studentsPerDot} elever"
        />
      </div>
      {#key currentStep}
        <div class="visual-frame" in:fade={{ duration: 250 }}>
          {#if currentStep === 0}
            <Classroom
              total={CLASSROOM_SIZE}
              absent={(overall.franvaroProcent / 100) * CLASSROOM_SIZE}
              caption="{overall.franvaroProcent}% frånvaro — {latestYear}"
            />
          {:else if currentStep === 2}
          <div class="stack">
            <CalendarStrip
              weeks={CAL_WEEKS}
              highlighted={scatteredDays}
              title="10 spridda sjukdagar under året"
            />
            <CalendarStrip
              weeks={CAL_WEEKS}
              highlighted={continuousDays}
              title="10 dagar i följd, två veckor"
              caption="Samma antal dagar — men det sammanhängande blocket väger tyngre."
            />
          </div>
        {:else if currentStep === 3}
          <Heatmap
            rows={heatmapRows}
            cols={heatmapCols}
            data={heatmapCells}
            title="Frånvaro % per läsår och månad"
          />
        {:else if currentStep === 4}
          <BarChart data={gradeData} color="var(--series-blue)" title="Frånvaro % per årskurs, {latestYear}" />
        {:else if currentStep === 5}
          <BarChart
            data={konBars}
            color="var(--giltig)"
            title="Giltig/ogiltig frånvaro % per kön, {latestYear}"
          />
        {:else if currentStep === 6}
          <BarChart data={subjectBars} color="var(--series-orange)" title="Lektionsfrånvaro % per ämne, {latestYear}" />
        {:else if currentStep === 7}
          <ScatterMap data={data.bySchool} title="Frånvaro % per skola, {latestYear}" />
        {:else if currentStep === 8}
          <BarChart
            data={giltigOgiltigBars}
            color="var(--giltig)"
            title="Frånvaro % efter typ, {latestYear}"
          />
        {:else if currentStep === 9}
          <div class="stat-tile">
            <span class="stat-value">
              {data.overview.elevFranvarandeEnGenomsnittsdag.toLocaleString("sv-SE")}
            </span>
            <span class="stat-label">
              av {data.overview.totalElever.toLocaleString("sv-SE")} elever borta en genomsnittsdag, {latestYear}
            </span>
          </div>
        {/if}
      </div>
      {/key}
    </div>
  {/snippet}

  {#each steps as step, i}
    <section class="scrolly-step" data-index={i}>
      <p class="kicker">{step.kicker}</p>
      <h2>{step.headline}</h2>
      {#if i === 0}
        <p>
          Just nu, en helt vanlig dag under läsåret {latestYear}, är i genomsnitt
          <strong>{overall.franvaroProcent}%</strong> av grundskoleförvaltningens
          {data.overview.totalElever.toLocaleString("sv-SE")} elever hemma. I en klass
          om {CLASSROOM_SIZE} elever motsvarar det ungefär
          <strong>{Math.round((overall.franvaroProcent / 100) * CLASSROOM_SIZE)} tomma stolar</strong> —
          varje dag, i varje klassrum.
        </p>
      {:else if i === 1}
        <p>
          Men ett snitt är bara ett snitt. Om vi istället tittar på
          <strong>varje enskild elevs</strong> egen frånvaro under läsåret ser
          bilden annorlunda ut: de allra flesta elever är knappt borta alls.
        </p>
        <p>
          En liten grupp — ofta kallad elever med hög eller kronisk frånvaro —
          står däremot för en oproportionerligt stor del av alla missade
          skoldagar. Det är den gruppen som riskerar att halka efter, och som
          ett snitt på {overall.franvaroProcent}% gör osynlig.
        </p>
      {:else if i === 2}
        <p>
          Tio dagars frånvaro kan se väldigt olika ut. Spridda över året, som
          enstaka förkylningar, är de sällan ett tecken på något allvarligt.
        </p>
        <p>
          Men <strong>tio dagar i följd</strong> — två hela skolveckor utan
          uppehåll — är en helt annan sak. De flesta kommuners rutiner säger
          att en rektor eller elevhälsan ska kopplas in ungefär vid den
          gränsen, eftersom en så lång sammanhängande frånvaro ofta hänger
          ihop med skolvägran, långvarig sjukdom eller andra allvarliga skäl.
        </p>
        <p>
          I grundskoleförvaltningen hade ungefär
          <strong>{data.studentDistribution.langvarigFranvaro.andelElever}%</strong>
          av eleverna — motsvarande
          {data.studentDistribution.langvarigFranvaro.antalElever.toLocaleString("sv-SE")}
          elever — minst en sådan sammanhängande period under läsåret.
        </p>
      {:else if i === 3}
        <p>
          Frånvaron är som lägst i början av höstterminen. Sedan stiger den brant
          under vintern — förkylnings- och influensasäsongen syns tydligt i varje
          läsår, från november till februari.
        </p>
        <p>
          Notera också den förhöjda frånvaron läsåret 2021/22, i den post-pandemiska
          perioden, som sakta klingat av sedan dess.
        </p>
      {:else if i === 4}
        <p>
          Från förskoleklass till årskurs 5 är skillnaderna små. Sedan stiger
          frånvaron påtagligt — särskilt från årskurs 7 och uppåt, i högstadiet,
          där både sjukfrånvaro och skolk ökar.
        </p>
      {:else if i === 5}
        <p>
          Skillnaden i total frånvaro mellan flickor och pojkar är liten. Men under
          ytan skiljer sig <em>typen</em> av frånvaro — flickor har något högre
          giltig (sjuk-) frånvaro, medan pojkar har något högre ogiltig frånvaro.
        </p>
      {:else if i === 6}
        <p>
          Detta är lektionsfrånvaro — inte hela skoldagar. Idrott och moderna
          språk sticker ut med högst frånvaro, medan kärnämnen som svenska och
          engelska ligger lägre.
        </p>
        <p>
          Men tänk om samma frånvaro istället satt samlad i ett enda ämne.
          Matematik utgör bara en dryg sjundedel av all undervisningstid i
          grundskolan — så {overall.franvaroProcent}% av all skoltid motsvarar
          hela <strong>{mathReframed}%</strong> av all matematikundervisning du
          någonsin får, om den frånvaron bara hade drabbat matematiken.
        </p>
        <p>
          Det är allvarligare än det låter: matematik bygger hela tiden vidare
          på det ni redan gått igenom, så tid du missar där väger tyngre —
          och kan följa med genom hela skolgången.
        </p>
      {:else if i === 7}
        <p>
          Frånvaron varierar mellan skolor — inte bara mellan årskurser eller
          ämnen. Vissa skolor ligger tydligt över genomsnittet, andra tydligt
          under.
        </p>
      {:else if i === 8}
        <p>
          All frånvaro är inte densamma. En del är sjukanmäld eller på annat sätt
          giltig — men en växande andel, särskilt i högstadiet, är ogiltig
          frånvaro: eleven är borta utan giltigt skäl.
        </p>
      {:else if i === 9}
        <p>
          Vi har tittat på läsår, årskurs, kön, ämne och skola var för sig. Nedan
          kan du kombinera filtren själv och utforska frånvaron i grundskole­förvaltningens
          data.
        </p>
      {/if}
    </section>
  {/each}
</Scrolly>

<style>
  .visual-stack {
    position: relative;
    width: 100%;
    min-height: 380px;
  }
  .visual-frame,
  .bucket-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .bucket-layer {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
  }
  .bucket-layer.active {
    opacity: 1;
    pointer-events: auto;
  }
  .stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  .stat-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    max-width: 360px;
  }
  .stat-value {
    font-size: 56px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1;
  }
  .stat-label {
    font-size: 14px;
    color: var(--text-muted);
  }
  :global(.scrolly-step) {
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 28px 32px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    opacity: 0.45;
    transition: opacity 0.3s ease;
  }
  :global(.scrolly-step.is-active) {
    opacity: 1;
  }
  :global(.scrolly-step) .kicker {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--series-blue);
    margin: 0 0 6px;
    font-weight: 600;
  }
  :global(.scrolly-step) h2 {
    margin: 0 0 12px;
    font-size: 21px;
  }
  :global(.scrolly-step) p {
    margin: 0 0 10px;
    font-size: 14px;
    line-height: 1.55;
  }
  :global(.scrolly-step) p:last-child {
    margin-bottom: 0;
  }
</style>
