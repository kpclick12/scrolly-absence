<script>
  import { fade } from "svelte/transition";
  import Scrolly from "../components/Scrolly.svelte";
  import Classroom from "../components/Classroom.svelte";
  import Heatmap from "../components/Heatmap.svelte";
  import BarChart from "../components/BarChart.svelte";
  import ScatterMap from "../components/ScatterMap.svelte";
  import Legend from "../components/Legend.svelte";
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

  const CLASSROOM_SIZE = 22;

  const steps = $derived([
    {
      kicker: "Grundskoleförvaltningen",
      headline: "En helt vanlig skoldag",
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
    {#key currentStep}
      <div class="visual-frame" in:fade={{ duration: 250 }}>
        {#if currentStep === 0}
          <Classroom
            total={CLASSROOM_SIZE}
            absent={(overall.franvaroProcent / 100) * CLASSROOM_SIZE}
            caption="{overall.franvaroProcent}% frånvaro — {latestYear}"
          />
        {:else if currentStep === 1}
          <Heatmap
            rows={heatmapRows}
            cols={heatmapCols}
            data={heatmapCells}
            title="Frånvaro % per läsår och månad"
          />
        {:else if currentStep === 2}
          <BarChart data={gradeData} color="var(--series-blue)" title="Frånvaro % per årskurs, {latestYear}" />
        {:else if currentStep === 3}
          <div class="side-by-side">
            <Classroom
              total={14}
              absent={(flicka.franvaroProcent / 100) * 14}
              caption="Flickor — {flicka.franvaroProcent}%"
            />
            <Classroom
              total={14}
              absent={(pojke.franvaroProcent / 100) * 14}
              caption="Pojkar — {pojke.franvaroProcent}%"
            />
          </div>
        {:else if currentStep === 4}
          <BarChart data={subjectBars} color="var(--series-orange)" title="Lektionsfrånvaro % per ämne, {latestYear}" />
        {:else if currentStep === 5}
          <ScatterMap data={data.bySchool} title="Frånvaro % per skola, {latestYear}" />
        {:else if currentStep === 6}
          <div class="stack">
            <Classroom
              total={CLASSROOM_SIZE}
              absent={(overall.franvaroProcent / 100) * CLASSROOM_SIZE}
              segments={[
                { label: 'Giltig (sjuk/anmäld)', color: 'var(--giltig)', value: overall.giltigProcent },
                { label: 'Ogiltig (skolk)', color: 'var(--ogiltig)', value: overall.ogiltigProcent },
              ]}
              caption="{overall.franvaroProcent}% total frånvaro"
            />
            <Legend
              items={[
                { label: 'Giltig (sjuk/anmäld)', color: 'var(--giltig)' },
                { label: 'Ogiltig (skolk)', color: 'var(--ogiltig)' },
              ]}
            />
          </div>
        {:else if currentStep === 7}
          <Classroom
            total={CLASSROOM_SIZE}
            absent={(overall.franvaroProcent / 100) * CLASSROOM_SIZE}
            caption="{data.overview.elevFranvarandeEnGenomsnittsdag.toLocaleString('sv-SE')} av {data.overview.totalElever.toLocaleString('sv-SE')} elever"
          />
        {/if}
      </div>
    {/key}
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
          Frånvaron är som lägst i början av höstterminen. Sedan stiger den brant
          under vintern — förkylnings- och influensasäsongen syns tydligt i varje
          läsår, från november till februari.
        </p>
        <p>
          Notera också den förhöjda frånvaron läsåret 2021/22, i den post-pandemiska
          perioden, som sakta klingat av sedan dess.
        </p>
      {:else if i === 2}
        <p>
          Från förskoleklass till årskurs 5 är skillnaderna små. Sedan stiger
          frånvaron påtagligt — särskilt från årskurs 7 och uppåt, i högstadiet,
          där både sjukfrånvaro och skolk ökar.
        </p>
      {:else if i === 3}
        <p>
          Skillnaden i total frånvaro mellan flickor och pojkar är liten. Men under
          ytan skiljer sig <em>typen</em> av frånvaro — flickor har något högre
          giltig (sjuk-) frånvaro, medan pojkar har något högre ogiltig frånvaro.
        </p>
      {:else if i === 4}
        <p>
          Detta är lektionsfrånvaro — inte hela skoldagar. Idrott och moderna
          språk sticker ut med högst frånvaro, medan kärnämnen som svenska och
          engelska ligger lägre.
        </p>
      {:else if i === 5}
        <p>
          Frånvaron varierar mellan skolor — inte bara mellan årskurser eller
          ämnen. Vissa skolor ligger tydligt över genomsnittet, andra tydligt
          under.
        </p>
      {:else if i === 6}
        <p>
          All frånvaro är inte densamma. En del är sjukanmäld eller på annat sätt
          giltig — men en växande andel, särskilt i högstadiet, är ogiltig
          frånvaro: eleven är borta utan giltigt skäl.
        </p>
      {:else if i === 7}
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
  .visual-frame {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .side-by-side {
    display: flex;
    gap: 24px;
    width: 100%;
    justify-content: center;
  }
  .side-by-side :global(.classroom) {
    max-width: 200px;
  }
  .stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
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
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--series-blue);
    margin: 0 0 6px;
    font-weight: 600;
  }
  :global(.scrolly-step) h2 {
    margin: 0 0 14px;
    font-size: 26px;
  }
  :global(.scrolly-step) p {
    margin: 0 0 12px;
  }
  :global(.scrolly-step) p:last-child {
    margin-bottom: 0;
  }
</style>
