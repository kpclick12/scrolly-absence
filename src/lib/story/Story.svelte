<script>
  import { fade } from "svelte/transition";
  import Scrolly from "../components/Scrolly.svelte";
  import Classroom from "../components/Classroom.svelte";
  import Heatmap from "../components/Heatmap.svelte";
  import BarChart from "../components/BarChart.svelte";
  import BucketSwarm from "../components/BucketSwarm.svelte";
  import CalendarStrip from "../components/CalendarStrip.svelte";
  import CorrelationScatter from "../components/CorrelationScatter.svelte";
  import LineChart from "../components/LineChart.svelte";
  import DumbbellChart from "../components/DumbbellChart.svelte";
  import StackedAreaChart from "../components/StackedAreaChart.svelte";
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
  const lovBars = $derived(
    data.lovEffekt.flatMap((l) => [
      { label: `${l.lov} — veckan före`, value: l.fore, color: "var(--series-blue)" },
      { label: `${l.lov} — veckan efter`, value: l.efter, color: "var(--series-red)" },
    ])
  );
  const BUCKET_COLORS = ["#0068b2", "#499fe3", "#dc785f", "#a7391d"];
  const progressionDumbbell = $derived(
    data.progression.buckets.map((b, i) => ({
      label: b.label,
      from: b.andelOver15Ak6,
      to: b.andelOver15Ak9,
      color: BUCKET_COLORS[i],
    }))
  );
  // låg-gruppens hopp från åk 6 till åk 9 — poängen i steget
  const lagBucket = $derived(data.progression.buckets[0]);

  // Stadietrenden — berättelsens nyckeldiagram. Högstadiet i rött.
  const STADIUM_COLORS = { lag: "#649ecf", mellan: "#0068b2", hog: "#a7391d" };
  const trendSeries = $derived(
    data.stadiumTrend.map((s) => ({ ...s, color: STADIUM_COLORS[s.id] }))
  );
  const hogTrend = $derived(data.stadiumTrend.find((s) => s.id === "hog").serie);
  const hogFirst = $derived(hogTrend[0].franvaroProcent);
  const hogNow = $derived(hogTrend[hogTrend.length - 1].franvaroProcent);
  // ~178 skoldagar per läsår -> missade veckor vid högstadiets nivå
  const hogWeeksLost = $derived(Math.round((hogNow / 100) * 178 / 5));

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

  // Andel elever med hög frånvaro (≥15%) — första vs senaste läsåret, för texten
  const over15First = $derived(Math.round(100 - data.bucketTrend.serie[0].shares[0]));
  const over15Now = $derived(Math.round(100 - data.bucketTrend.serie[data.bucketTrend.serie.length - 1].shares[0]));
  // Andel behöriga till gymnasiet per frånvaronivå — sambandet, inte en
  // enskild siffra: ju högre frånvaro, desto brantare faller behörigheten.
  const behorighetBars = $derived(
    data.studentDistribution.gymnasiebehorighet.perBucket.map((b, i) => ({
      label: `${b.label} frånvaro`,
      value: b.andelBehoriga,
      color: BUCKET_COLORS[i],
    }))
  );

  // Avslutande klassrum: börjar på en genomsnittsdag (~2 av 25), växer sedan
  // till den grupp som är ofta borta över läsåret (~6 av 25).
  let closingAbsent = $state(2);
  $effect(() => {
    if (currentStep === 13) {
      closingAbsent = 2;
      const t = setTimeout(() => (closingAbsent = 6), 1100);
      return () => clearTimeout(t);
    }
    closingAbsent = 2;
  });

  const steps = $derived([
    {
      kicker: "Grundskoleförvaltningen",
      headline: "En helt vanlig skoldag",
    },
    {
      kicker: "Larmet",
      headline: "Högstadiet drar ifrån",
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
      kicker: "Lovffekten",
      headline: "Efter lovet står fler stolar tomma",
    },
    {
      kicker: "Årskurs",
      headline: "Trappan upp mot högstadiet",
    },
    {
      kicker: "Progression",
      headline: "Hög frånvaro tidigt biter sig fast",
    },
    {
      kicker: "Ämne i högstadiet",
      headline: "Vissa lektioner tappar fler elever",
    },
    {
      kicker: "Skola och socioekonomi",
      headline: "Frånvaron följer skolans förutsättningar",
    },
    {
      kicker: "Giltig eller ogiltig",
      headline: "Sjukanmäld — men borta ändå",
    },
    {
      kicker: "Vad står på spel",
      headline: "Från tomma stolar till stängda dörrar",
    },
    {
      kicker: "Sammansättningen över tid",
      headline: "Allt fler i riskzonen",
    },
    {
      kicker: "Tillbaka i klassrummet",
      headline: "Sex av tjugofem",
    },
  ]);
</script>

<Scrolly onStepChange={(i) => (currentStep = i)}>
  {#snippet visual()}
    <div class="visual-stack">
      <!-- BucketSwarm stannar kvar monterad (ur/i {#key}) så att bollen faktiskt
           hinner klumpa ihop sig och sprida ut sig — inte bara poppa upp klar. -->
      <div class="bucket-layer" class:active={currentStep === 2}>
        <BucketSwarm
          dots={data.studentDistribution.dots}
          buckets={data.studentDistribution.buckets}
          spread={currentStep === 2}
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
          {:else if currentStep === 1}
          <LineChart
            series={trendSeries}
            title="Frånvaro % per stadium och läsår"
          />
        {:else if currentStep === 3}
          <div class="stack">
            <CalendarStrip
              weeks={CAL_WEEKS}
              highlighted={scatteredDays}
              color="var(--series-blue)"
              title="10 spridda sjukdagar under året"
            />
            <CalendarStrip
              weeks={CAL_WEEKS}
              highlighted={continuousDays}
              color="var(--series-red)"
              title="10 dagar i följd, två veckor"
              caption="Samma antal dagar — men det sammanhängande blocket väger tyngre."
            />
          </div>
        {:else if currentStep === 4}
          <Heatmap
            rows={heatmapRows}
            cols={heatmapCols}
            data={heatmapCells}
            title="Frånvaro % per läsår och månad"
          />
        {:else if currentStep === 5}
          <BarChart
            data={lovBars}
            color="var(--series-blue)"
            title="Frånvaro % veckan före och veckan efter lov, {latestYear}"
          />
        {:else if currentStep === 6}
          <BarChart data={gradeData} color="var(--series-blue)" title="Frånvaro % per årskurs, {latestYear}" />
        {:else if currentStep === 7}
          <DumbbellChart
            data={progressionDumbbell}
            title="Andel med ≥15% frånvaro, efter nivå i åk 4"
            fromLabel="åk 6"
            toLabel="åk 9"
          />
        {:else if currentStep === 8}
          <BarChart data={subjectBars} color="var(--series-orange)" title="Lektionsfrånvaro % per ämne i högstadiet (åk 7–9), {latestYear}" />
        {:else if currentStep === 9}
          <CorrelationScatter
            data={data.bySchool}
            title="Socioekonomiskt index vs frånvaro per skola, {latestYear}"
            xLabel="Socioekonomiskt index (högre = större utmaningar)"
            yLabel="Frånvaro %"
          />
        {:else if currentStep === 10}
          <BarChart
            data={konBars}
            color="var(--giltig)"
            title="Giltig/ogiltig frånvaro % per kön, {latestYear}"
          />
        {:else if currentStep === 11}
          <BarChart
            data={behorighetBars}
            color="var(--series-blue)"
            maxValue={100}
            title="Andel behöriga till gymnasiet efter frånvaronivå (illustrativt)"
          />
        {:else if currentStep === 12}
          <StackedAreaChart
            series={data.bucketTrend.serie}
            labels={data.bucketTrend.labels}
            colors={["#0068b2","#499fe3","#dc785f","#a7391d"]}
            title="Elevernas frånvaronivå, andel av alla elever per läsår"
            caption="Det blå fältet krymper, de röda växer."
          />
        {:else if currentStep === 13}
          <Classroom
            total={25}
            cols={5}
            absent={closingAbsent}
            caption={closingAbsent <= 2 ? "En genomsnittlig dag — ungefär var tionde elev" : "Ofta borta under läsåret — 6 av 25 barn"}
          />
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
          {data.overview.totalElever.toLocaleString("sv-SE")} elever inte i skolan —
          ungefär <strong>var tionde elev</strong>. I en klass om {CLASSROOM_SIZE}
          elever är det {Math.round((overall.franvaroProcent / 100) * CLASSROOM_SIZE)}
          tomma stolar, varje dag, i varje klassrum.
        </p>
        <p>Och snittet döljer det verkliga larmet.</p>
      {:else if i === 1}
        <p>
          Dela upp eleverna efter stadium och bilden blir skarp: i lågstadiet
          och mellanstadiet har frånvaron legat stilla i fem år. I
          <strong>högstadiet har den ökat varje läsår</strong> — från
          {hogFirst}% till <strong>{hogNow}%</strong>.
        </p>
        <p>
          {hogNow}% betyder att <strong>var femte högstadieelev</strong> är
          borta en vanlig skoldag. I en klass om 25 är det fem tomma stolar.
          För en enskild elev på den nivån motsvarar det en missad skoldag i
          veckan — ungefär <strong>{hogWeeksLost} veckors undervisning</strong>
          på ett enda läsår.
        </p>
        <p>
          Och det ackumuleras: en elev som håller den nivån genom hela
          högstadiet förlorar sammanlagt över
          <strong>20 veckors undervisning</strong> — mer än en hel termin av
          sin skolgång.
        </p>
      {:else if i === 2}
        <p>
          Men ett snitt är bara ett snitt. Om vi istället tittar på
          <strong>varje enskild elevs</strong> egen frånvaro under läsåret ser
          bilden annorlunda ut: de flesta elever är sällan borta.
        </p>
        <p>
          En betydande grupp — elever med hög eller kronisk frånvaro — står
          däremot för en oproportionerligt stor del av alla missade skoldagar.
          Det är den gruppen som riskerar att halka efter, och som snittet gör
          osynlig.
        </p>
      {:else if i === 3}
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
      {:else if i === 4}
        <p>
          Frånvaron är som lägst i början av höstterminen. Sedan stiger den brant
          under vintern — förkylnings- och influensasäsongen syns tydligt i varje
          läsår, från november till februari.
        </p>
        <p>
          Men lägg märke till att vintertopparna inte längre klingar av till
          samma nivå som förr — golvet höjs, läsår för läsår.
        </p>
        <p>Och varje gång skolan startar om efter ett längre uppehåll händer något mer.</p>
      {:else if i === 5}
        <p>
          Frånvaron är som högst direkt <strong>efter loven</strong>. Veckan
          efter jullovet ligger den omkring en tredjedel högre än veckan före
          — alla kommer helt enkelt inte tillbaka när skolan öppnar igen.
        </p>
        <p>
          För elever med skör skolanknytning är varje lov en risksituation:
          ju längre uppehåll, desto tyngre återstart. Det gör veckorna efter
          lov till ett givet läge för skolan att agera snabbt på ny frånvaro.
        </p>
      {:else if i === 6}
        <p>
          Samma mönster som stadietrenden, i finare upplösning. Från
          förskoleklass till årskurs 6 stiger frånvaron långsamt. Sedan kommer
          språnget: <strong>från årskurs 7 nästan fördubblas den</strong>, och i
          årskurs 9 är den uppe i {gradeData[gradeData.length - 1].value}% —
          fyra gånger nivån i förskoleklass.
        </p>
      {:else if i === 7}
        <p>
          Så vi följde <strong>samma barn</strong>. Vi delade in dem efter
          frånvaronivå i årskurs 4 och mätte igen i årskurs 6 och årskurs 9 —
          hur stor andel av varje grupp som då låg över 15%.
        </p>
        <p>
          De som låg högt tidigt ligger kvar högt: av dem som redan var över
          15% i åk 4 ligger omkring <strong>{data.progression.kvarProcent}%</strong>
          kvar där i åk 9. Hög frånvaro är sällan en fas — den är en bana.
        </p>
        <p>
          Men se på den lägsta gruppen: bland dem som knappt var borta i åk 4
          <strong>mer än fördubblas</strong> andelen med hög frånvaro från åk 6
          till åk 9 ({lagBucket.andelOver15Ak6}% → {lagBucket.andelOver15Ak9}%).
          Högstadiet drar upp även de som var trygga tidigt. Det är inte bara
          samma elever som halkar — det blir fler.
        </p>
      {:else if i === 8}
        <p>
          Här zoomar vi in på högstadiet, där problemet finns — och tittar på
          lektionsfrånvaro per ämne, inte hela skoldagar. Idrott och moderna
          språk tappar flest elever, men även kärnämnena ligger högt.
        </p>
        <p>
          Och tänk om samma frånvaro istället satt samlad i ett enda ämne.
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
      {:else if i === 9}
        <p>
          Frånvaron varierar kraftigt mellan skolor — och skillnaderna är inte
          slumpmässiga. Varje skola har ett
          <strong>socioekonomiskt index</strong> — från cirka 30 till 200, där
          ett högre värde betyder större utmaningar i elevernas uppväxtvillkor.
        </p>
        <p>
          Sätter man indexet mot frånvaron träder mönstret fram: skolor med
          <span class="badge badge-blue">lågt index</span> ligger oftast under
          genomsnittet, medan skolor med
          <span class="badge badge-red">högt index</span> oftare ligger över.
          Frånvaron är med andra ord inte bara en fråga om individer — den
          hänger ihop med skolans förutsättningar.
        </p>
      {:else if i === 10}
        <p>
          Går det att skylla på skolk? Nej. Merparten av frånvaron är
          <strong>giltig</strong> — sjukanmäld eller anmäld på annat sätt.
          Skillnaden mellan flickor och pojkar är liten; under ytan har flickor
          något mer giltig (sjuk-)frånvaro och pojkar något mer ogiltig.
        </p>
        <p>
          Men för eleven spelar uppdelningen mindre roll:
          <strong>borta är borta</strong>. Undervisningen som missas kommer
          inte tillbaka, oavsett om frånvaron var anmäld eller inte.
        </p>
      {:else if i === 11}
        <p>
          Varför måste frånvaron tas på allvar? För att den är den tidigaste
          varningssignalen för det som avgör mest:
          <strong>gymnasiebehörigheten</strong>. Ju högre frånvaro, desto
          brantare faller chansen att klara den.
        </p>
        <p>
          Med dagens nivåer motsvarar det ungefär
          <strong>{data.studentDistribution.gymnasiebehorighet.ejBehorigaPerArskull}
          elever i varje årskull</strong> som riskerar att lämna grundskolan
          utan behörighet — dörrar som stängs vid 16 års ålder. (Sambandet är
          illustrativt i testdatat.)
        </p>
      {:else if i === 12}
        <p>
          Lägg ihop alla elever och följ hur gruppen förändras över tid. För
          fem år sedan hade drygt <strong>{over15First}%</strong> av eleverna
          hög frånvaro — över 15%. Idag är det nästan
          <strong>var fjärde</strong>, {over15Now}%.
        </p>
        <p>
          Det blå fältet — eleverna som knappt är borta — krymper läsår för
          läsår, medan de röda växer. Problemet klättrar alltså inte bara uppåt
          i årskurserna; det breder ut sig i hela elevgruppen.
        </p>
      {:else if i === 13}
        <p>
          Vi började med en helt vanlig dag: ett par tomma stolar i varje
          klassrum, ungefär var tionde elev.
        </p>
        <p>
          Men det är inte samma stolar varje dag. Räknar man alla barn som är
          <strong>ofta borta</strong> under läsåret — mer än en dag i veckan —
          handlar det om ungefär <strong>sex av tjugofem</strong> i varje klass.
        </p>
        <p>
          Det är vad som står på spel bakom siffrorna. Varje tom stol är ett
          barn vi riskerar att tappa.
        </p>
      {/if}
    </section>
  {/each}
</Scrolly>

<style>
  .visual-stack {
    position: relative;
    width: 100%;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /* Ligger i flödet så att panelen får sitt innehålls höjd — inget klipps. */
  .visual-frame {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /* Svärmen ligger kvar monterad som ett lager ovanpå, för animationens skull. */
  .bucket-layer {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
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
  /* Kortets bakgrund är alltid täckande — annars blöder diagrammet igenom
     texten på mobil när kortet glider över panelen. Bara innehållet tonas. */
  :global(.scrolly-step) {
    background: var(--surface-1);
    border-left: 6px solid var(--hero-navy);
    padding: 28px 32px;
    box-shadow: 0 2px 10px rgba(22, 40, 58, 0.08);
  }
  :global(.scrolly-step > *) {
    opacity: 0.35;
    transition: opacity 0.3s ease;
  }
  :global(.scrolly-step.is-active > *) {
    opacity: 1;
  }
  :global(.scrolly-step) .kicker {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--series-blue);
    margin: 0 0 8px;
    font-weight: 700;
  }
  :global(.scrolly-step) h2 {
    font-family: var(--serif);
    margin: 0 0 14px;
    font-size: 24px;
    line-height: 1.2;
  }
  :global(.scrolly-step) p {
    margin: 0 0 12px;
    font-size: 15px;
    line-height: 1.6;
  }
  :global(.scrolly-step) p:last-child {
    margin-bottom: 0;
  }
</style>
