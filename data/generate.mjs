// Genererar syntetisk (fiktiv) frånvarodata för grundskoleförvaltningen.
// Modellerar aggregerade andelar per strata (skola/årskurs/kön/ämne/läsår/månad)
// istället för miljontals enskilda dagsrader — det är vad frontend faktiskt behöver.
// Deterministiskt (seedad PRNG) så datat är stabilt mellan körningar.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Skrivs till src/ så att datat bundlas in i appen (importeras statiskt).
// Ingen runtime-fetch = inga trasiga "Laddar data"-lägen när GitHub Pages
// CDN serverar gammalt/blandat innehåll direkt efter en deploy.
const OUT_DIR = join(__dirname, "..", "src", "data");
mkdirSync(OUT_DIR, { recursive: true });

// --- Seedad PRNG (mulberry32) för reproducerbarhet ---
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260704);
const rand = () => rng();
const randRange = (min, max) => min + rand() * (max - min);
const randInt = (min, max) => Math.floor(randRange(min, max + 1));

// --- Dimensioner ---

const LASAR = ["2021/22", "2022/23", "2023/24", "2024/25", "2025/26"];

const ARSKURSER = ["F", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const KON = ["Flicka", "Pojke"];

const AMNEN = [
  "Idrott och hälsa",
  "Matematik",
  "Svenska",
  "Engelska",
  "Moderna språk",
  "SO (samhällsorienterande ämnen)",
  "NO (naturorienterande ämnen)",
  "Bild",
  "Musik",
  "Slöjd",
];

// Fiktiva skolor placerade i verkliga kommuner (för en enkel punktkarta).
// Namnen är påhittade, koordinaterna ungefärliga.
const SKOLOR = [
  { skola: "Vasaskolan", kommun: "Stockholm", lat: 59.33, lon: 18.06 },
  { skola: "Kungsängsskolan", kommun: "Uppsala", lat: 59.86, lon: 17.64 },
  { skola: "Sjöstadsskolan", kommun: "Göteborg", lat: 57.71, lon: 11.97 },
  { skola: "Öresundsskolan", kommun: "Malmö", lat: 55.6, lon: 13.0 },
  { skola: "Domkyrkoskolan", kommun: "Lund", lat: 55.7, lon: 13.19 },
  { skola: "Ryhovsskolan", kommun: "Jönköping", lat: 57.78, lon: 14.16 },
  { skola: "Stångåskolan", kommun: "Linköping", lat: 58.41, lon: 15.62 },
  { skola: "Svampenskolan", kommun: "Örebro", lat: 59.27, lon: 15.21 },
  { skola: "Mälarskolan", kommun: "Västerås", lat: 59.61, lon: 16.55 },
  { skola: "Sundstaskolan", kommun: "Karlstad", lat: 59.38, lon: 13.5 },
  { skola: "Knuthöjdsskolan", kommun: "Helsingborg", lat: 56.05, lon: 12.69 },
  { skola: "Himlaskolan", kommun: "Norrköping", lat: 58.59, lon: 16.19 },
  { skola: "Vätterskolan", kommun: "Halmstad", lat: 56.67, lon: 12.86 },
  { skola: "Storsjöskolan", kommun: "Östersund", lat: 63.18, lon: 14.64 },
  { skola: "Kopparskolan", kommun: "Falun", lat: 60.61, lon: 15.63 },
  { skola: "Ångermannaskolan", kommun: "Sundsvall", lat: 62.39, lon: 17.31 },
  { skola: "Umestrandskolan", kommun: "Umeå", lat: 63.83, lon: 20.26 },
  { skola: "Malmfältsskolan", kommun: "Kiruna", lat: 67.85, lon: 20.22 },
  { skola: "Guldstadsskolan", kommun: "Skellefteå", lat: 64.75, lon: 20.95 },
  { skola: "Linnéskolan", kommun: "Växjö", lat: 56.88, lon: 14.81 },
  { skola: "Kalmarsundsskolan", kommun: "Kalmar", lat: 56.66, lon: 16.36 },
  { skola: "Gestriklandsskolan", kommun: "Gävle", lat: 60.67, lon: 17.14 },
  { skola: "Fristadsskolan", kommun: "Borås", lat: 57.72, lon: 12.94 },
  { skola: "Rekarneskolan", kommun: "Eskilstuna", lat: 59.37, lon: 16.51 },
  { skola: "Gutaskolan", kommun: "Visby", lat: 57.64, lon: 18.3 },
];

const SCHOOL_MONTHS = [
  "Aug", "Sep", "Okt", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
];
// Säsongsmultiplikator (förkylnings-/influensasäsong högre, sommarterminen lägre)
const SEASON_FACTOR = {
  Aug: 0.85, Sep: 0.85, Okt: 1.0, Nov: 1.2, Dec: 1.25,
  Jan: 1.3, Feb: 1.2, Mar: 1.0, Apr: 0.9, Maj: 0.85, Jun: 0.9,
};

// Ett stabilt "skoleffekt"-brus per skola (simulerar t.ex. socioekonomiska skillnader)
const schoolEffect = Object.fromEntries(
  SKOLOR.map((s) => [s.skola, randRange(-0.35, 0.55)])
);

// Socioekonomiskt index per skola (~30-200, högre = större utmaningar).
// Härlett ur samma skoleffekt som driver frånvaron, plus brus — så sambandet
// blir tydligt men inte perfekt, som i verkligheten.
const sociIndex = Object.fromEntries(
  SKOLOR.map((s) => {
    const base = 30 + ((schoolEffect[s.skola] + 0.35) / 0.9) * 170;
    return [s.skola, Math.round(Math.min(200, Math.max(30, base + randRange(-45, 45))))];
  })
);

// Grundfrånvaro per årskurs (senaste läsåret). Verklighetsnära nivåer:
// låg-/mellanstadiet runt 5-9%, högstadiet 16-22% — snittet över F-9 ≈ 10%.
const GRADE_BASE = {
  F: 0.052, "1": 0.055, "2": 0.058, "3": 0.062, "4": 0.07, "5": 0.078,
  "6": 0.088, "7": 0.16, "8": 0.19, "9": 0.22,
};

// Kärnan i berättelsen: högstadiets frånvaro har ÖKAT läsår för läsår,
// medan låg- och mellanstadiet legat i princip stilla.
function stadium(arskurs) {
  if (arskurs === "F" || +arskurs <= 3) return "lag";
  if (+arskurs <= 6) return "mellan";
  return "hog";
}
const YEAR_TREND_BY_STADIUM = {
  lag:    { "2021/22": 1.02, "2022/23": 0.99, "2023/24": 1.01, "2024/25": 1.0, "2025/26": 1.0 },
  mellan: { "2021/22": 0.98, "2022/23": 1.01, "2023/24": 0.99, "2024/25": 1.01, "2025/26": 1.0 },
  hog:    { "2021/22": 0.68, "2022/23": 0.76, "2023/24": 0.85, "2024/25": 0.93, "2025/26": 1.0 },
};

// Andel av frånvaron som är ogiltig (skolk) ökar med årskurs.
const INVALID_SHARE_BASE = {
  F: 0.06, "1": 0.06, "2": 0.07, "3": 0.07, "4": 0.08, "5": 0.09,
  "6": 0.12, "7": 0.18, "8": 0.24, "9": 0.3,
};

// --- Elevfördelning: 50 000 elever fördelade över skola x årskurs x kön ---
const TOTAL_STUDENTS = 50000;
const schoolWeight = Object.fromEntries(
  SKOLOR.map((s) => [s.skola, randRange(0.6, 1.5)])
);
const weightSum = SKOLOR.reduce((sum, s) => sum + schoolWeight[s.skola], 0);

const enrollment = []; // { skola, arskurs, kon, elever }
for (const s of SKOLOR) {
  const schoolTotal = Math.round(
    (schoolWeight[s.skola] / weightSum) * TOTAL_STUDENTS
  );
  for (const ak of ARSKURSER) {
    const gradeShare = 1 / ARSKURSER.length;
    const gradeTotal = Math.round(schoolTotal * gradeShare);
    for (const k of KON) {
      const half = Math.round(gradeTotal / 2);
      enrollment.push({ skola: s.skola, arskurs: ak, kon: k, elever: half });
    }
  }
}
const actualTotal = enrollment.reduce((sum, e) => sum + e.elever, 0);

function round1(n) {
  return Math.round(n * 10) / 10;
}

function absenceRate({ arskurs, kon, skola, lasar, monthFactor = 1 }) {
  let rate = GRADE_BASE[arskurs];
  rate *= YEAR_TREND_BY_STADIUM[stadium(arskurs)][lasar];
  rate *= monthFactor;
  rate *= 1 + schoolEffect[skola] * 0.4;
  if (kon === "Flicka") rate *= 1.04; // något högre giltig/sjukfrånvaro
  if (kon === "Pojke") rate *= 1.02; // något högre ogiltig frånvaro (se invalidShare)
  rate *= randRange(0.94, 1.06); // litet brus
  return Math.min(rate, 0.4);
}

function invalidShare({ arskurs, kon }) {
  let share = INVALID_SHARE_BASE[arskurs];
  if (kon === "Pojke") share *= 1.15;
  return Math.min(share, 0.45);
}

// --- 1) overview.json: headline-tal för hook-steget ---
const latestYear = LASAR[LASAR.length - 1];
let latestTotalAbsent = 0;
for (const e of enrollment) {
  const rate = absenceRate({
    arskurs: e.arskurs,
    kon: e.kon,
    skola: e.skola,
    lasar: latestYear,
  });
  latestTotalAbsent += e.elever * rate;
}
const overview = {
  totalElever: actualTotal,
  senasteLasar: latestYear,
  franvaroProcentSenasteLasar: round1((latestTotalAbsent / actualTotal) * 100),
  elevFranvarandeEnGenomsnittsdag: Math.round(latestTotalAbsent),
  // en tänkt genomsnittsklass för stol-illustrationen
  exempelKlasstorlek: 22,
};
writeFileSync(
  join(OUT_DIR, "overview.json"),
  JSON.stringify(overview, null, 2)
);

// --- 2) timeseries.json: läsår x månad, total + giltig/ogiltig ---
const timeseries = [];
for (const lasar of LASAR) {
  for (const month of SCHOOL_MONTHS) {
    let totalWeighted = 0;
    let absentWeighted = 0;
    let invalidWeighted = 0;
    for (const e of enrollment) {
      const rate = absenceRate({
        arskurs: e.arskurs,
        kon: e.kon,
        skola: e.skola,
        lasar,
        monthFactor: SEASON_FACTOR[month],
      });
      const invShare = invalidShare({ arskurs: e.arskurs, kon: e.kon });
      totalWeighted += e.elever;
      absentWeighted += e.elever * rate;
      invalidWeighted += e.elever * rate * invShare;
    }
    timeseries.push({
      lasar,
      manad: month,
      franvaroProcent: round1((absentWeighted / totalWeighted) * 100),
      giltigProcent: round1(
        ((absentWeighted - invalidWeighted) / totalWeighted) * 100
      ),
      ogiltigProcent: round1((invalidWeighted / totalWeighted) * 100),
    });
  }
}
writeFileSync(
  join(OUT_DIR, "timeseries.json"),
  JSON.stringify(timeseries, null, 2)
);

// --- 3) byGrade.json: läsår x årskurs x kön ---
const byGrade = [];
for (const lasar of LASAR) {
  for (const ak of ARSKURSER) {
    for (const kon of KON) {
      const rows = enrollment.filter(
        (e) => e.arskurs === ak && e.kon === kon
      );
      let total = 0;
      let absent = 0;
      let invalid = 0;
      for (const e of rows) {
        const rate = absenceRate({ arskurs: ak, kon, skola: e.skola, lasar });
        const invShare = invalidShare({ arskurs: ak, kon });
        total += e.elever;
        absent += e.elever * rate;
        invalid += e.elever * rate * invShare;
      }
      byGrade.push({
        lasar,
        arskurs: ak,
        kon,
        totalElever: total,
        franvaroProcent: round1((absent / total) * 100),
        giltigProcent: round1(((absent - invalid) / total) * 100),
        ogiltigProcent: round1((invalid / total) * 100),
      });
    }
  }
}
writeFileSync(join(OUT_DIR, "byGrade.json"), JSON.stringify(byGrade, null, 2));

// --- 4) bySubject.json: ämnesnivå (lektionsfrånvaro), senaste läsår ---
// Ämnesspecifik multiplikator - illustrativ, inte statistiskt underbyggd.
const SUBJECT_FACTOR = {
  "Idrott och hälsa": 1.35,
  Matematik: 1.05,
  Svenska: 0.85,
  Engelska: 0.9,
  "Moderna språk": 1.4,
  "SO (samhällsorienterande ämnen)": 1.0,
  "NO (naturorienterande ämnen)": 1.05,
  Bild: 0.95,
  Musik: 0.9,
  "Slöjd": 1.1,
};
// Ämnesfrånvaron beräknas för högstadiet (åk 7-9) — det är där problemet
// finns, och ett snitt över alla årskurser skulle dölja nivåerna.
const bySubject = AMNEN.map((amne) => {
  let total = 0;
  let absent = 0;
  for (const e of enrollment) {
    if (stadium(e.arskurs) !== "hog") continue;
    const rate = absenceRate({
      arskurs: e.arskurs,
      kon: e.kon,
      skola: e.skola,
      lasar: latestYear,
    });
    total += e.elever;
    absent += e.elever * rate * SUBJECT_FACTOR[amne] * randRange(0.97, 1.03);
  }
  return {
    amne,
    franvaroProcent: round1(Math.min((absent / total) * 100, 40)),
  };
}).sort((a, b) => b.franvaroProcent - a.franvaroProcent);
writeFileSync(
  join(OUT_DIR, "bySubject.json"),
  JSON.stringify(bySubject, null, 2)
);

// --- 5) bySchool.json: skolnivå, senaste läsår, för kartan ---
const bySchool = SKOLOR.map((s) => {
  const rows = enrollment.filter((e) => e.skola === s.skola);
  let total = 0;
  let absent = 0;
  let invalid = 0;
  for (const e of rows) {
    const rate = absenceRate({
      arskurs: e.arskurs,
      kon: e.kon,
      skola: s.skola,
      lasar: latestYear,
    });
    const invShare = invalidShare({ arskurs: e.arskurs, kon: e.kon });
    total += e.elever;
    absent += e.elever * rate;
    invalid += e.elever * rate * invShare;
  }
  return {
    skola: s.skola,
    kommun: s.kommun,
    lat: s.lat,
    lon: s.lon,
    sociIndex: sociIndex[s.skola],
    totalElever: total,
    franvaroProcent: round1((absent / total) * 100),
    giltigProcent: round1(((absent - invalid) / total) * 100),
    ogiltigProcent: round1((invalid / total) * 100),
  };
}).sort((a, b) => b.franvaroProcent - a.franvaroProcent);
writeFileSync(join(OUT_DIR, "bySchool.json"), JSON.stringify(bySchool, null, 2));

// --- 6) explore.json: läsår x skola x årskurs x kön, för fri utforskning ---
const explore = [];
for (const lasar of LASAR) {
  for (const s of SKOLOR) {
    for (const ak of ARSKURSER) {
      for (const kon of KON) {
        const e = enrollment.find(
          (row) =>
            row.skola === s.skola && row.arskurs === ak && row.kon === kon
        );
        const rate = absenceRate({ arskurs: ak, kon, skola: s.skola, lasar });
        const invShare = invalidShare({ arskurs: ak, kon });
        // Andel elever med ≥15% egen frånvaro — härledd ur stratumets snitt
        const over15 = Math.min(0.9, Math.max(0.02, 2.2 * rate - 0.04)) * randRange(0.92, 1.08);
        explore.push({
          lasar,
          skola: s.skola,
          arskurs: ak,
          kon,
          totalElever: e.elever,
          franvaroProcent: round1(rate * 100),
          giltigProcent: round1(rate * (1 - invShare) * 100),
          ogiltigProcent: round1(rate * invShare * 100),
          andelOver15: round1(Math.min(90, over15 * 100)),
        });
      }
    }
  }
}
writeFileSync(join(OUT_DIR, "explore.json"), JSON.stringify(explore));

// --- 6b) stadiumTrend.json: frånvaro per stadium och läsår ---
// Berättelsens nyckeldiagram: högstadiet drar ifrån medan låg- och
// mellanstadiet ligger stilla.
const STADIER = [
  { id: "lag", label: "Lågstadiet (F–3)", arskurser: ["F", "1", "2", "3"] },
  { id: "mellan", label: "Mellanstadiet (4–6)", arskurser: ["4", "5", "6"] },
  { id: "hog", label: "Högstadiet (7–9)", arskurser: ["7", "8", "9"] },
];
const stadiumTrend = STADIER.map((st) => ({
  id: st.id,
  label: st.label,
  serie: LASAR.map((lasar) => {
    let total = 0;
    let absent = 0;
    for (const e of enrollment) {
      if (!st.arskurser.includes(e.arskurs)) continue;
      total += e.elever;
      absent +=
        e.elever *
        absenceRate({ arskurs: e.arskurs, kon: e.kon, skola: e.skola, lasar });
    }
    return { lasar, franvaroProcent: round1((absent / total) * 100) };
  }),
}));
writeFileSync(
  join(OUT_DIR, "stadiumTrend.json"),
  JSON.stringify(stadiumTrend, null, 2)
);

// --- 6c) lovEffekt.json: frånvaron veckan före vs veckan efter lov ---
// Återstarten efter ett lov är en känd risksituation: elever med skör
// skolanknytning kommer inte tillbaka direkt när skolan öppnar igen.
const LOV = [
  { lov: "Jullovet", manad: "Jan", faktor: 1.32 },
  { lov: "Sportlovet", manad: "Feb", faktor: 1.22 },
  { lov: "Påsklovet", manad: "Apr", faktor: 1.18 },
];
const lovEffekt = LOV.map(({ lov, manad, faktor }) => {
  let total = 0;
  let absent = 0;
  for (const e of enrollment) {
    total += e.elever;
    absent +=
      e.elever *
      absenceRate({
        arskurs: e.arskurs,
        kon: e.kon,
        skola: e.skola,
        lasar: latestYear,
        monthFactor: SEASON_FACTOR[manad],
      });
  }
  const fore = (absent / total) * 100;
  return { lov, fore: round1(fore * 0.96), efter: round1(fore * faktor) };
});
writeFileSync(join(OUT_DIR, "lovEffekt.json"), JSON.stringify(lovEffekt, null, 2));

// --- 6d) progression.json: biter sig hög frånvaro fast? ---
// Samma barn följda framåt. Vi delar in dem efter frånvaronivå i åk 4 och
// mäter andelen ≥15% igen i åk 6 och åk 9. Två budskap: hög frånvaro tidigt
// biter sig fast, OCH högstadiet drar upp även de som var trygga tidigt
// (låg-gruppen mer än fördubblas från åk 6 till åk 9).
const PROG_BUCKETS = [
  { label: "0–15% i åk 4", andelOver15Ak6: 8, andelOver15Ak9: 19, andelAvElever: 0.778 },
  { label: "15–30% i åk 4", andelOver15Ak6: 45, andelOver15Ak9: 64, andelAvElever: 0.152 },
  { label: "30–50% i åk 4", andelOver15Ak6: 72, andelOver15Ak9: 84, andelAvElever: 0.048 },
  { label: "50–100% i åk 4", andelOver15Ak6: 88, andelOver15Ak9: 94, andelAvElever: 0.022 },
];
const over15Grupper = PROG_BUCKETS.slice(1);
const over15Vikt = over15Grupper.reduce((s, b) => s + b.andelAvElever, 0);
const progression = {
  buckets: PROG_BUCKETS.map(({ label, andelOver15Ak6, andelOver15Ak9 }) => ({
    label,
    andelOver15Ak6,
    andelOver15Ak9,
  })),
  // andel av alla som låg ≥15% i åk 4 som fortfarande ligger ≥15% i åk 9
  kvarProcent: Math.round(
    over15Grupper.reduce((s, b) => s + b.andelOver15Ak9 * b.andelAvElever, 0) / over15Vikt
  ),
};
writeFileSync(
  join(OUT_DIR, "progression.json"),
  JSON.stringify(progression, null, 2)
);

// --- 7) studentDistribution.json: varje elevs egen frånvaro, inte bara snittet ---
// Medelvärdet (~10%) döljer att de flesta elever har låg frånvaro,
// medan en betydande grupp har mycket hög (kronisk) frånvaro. Vi samplar 500
// "prickar" (1 prick ≈ 100 elever) och lottar var och en till en av fyra
// hinkar, med sannolikheter valda så att det viktade snittet hamnar nära
// den faktiska totalen ovan.
const BUCKETS = [
  { id: 0, label: "0–15%", min: 0, max: 15, share: 0.78 },
  { id: 1, label: "15–30%", min: 15, max: 30, share: 0.14 },
  { id: 2, label: "30–50%", min: 30, max: 50, share: 0.05 },
  { id: 3, label: "50–100%", min: 50, max: 100, share: 0.03 },
];
const SAMPLE_SIZE = 500;
const studentsPerDot = Math.round(actualTotal / SAMPLE_SIZE);

function pickBucket() {
  const r = rand();
  let acc = 0;
  for (const b of BUCKETS) {
    acc += b.share;
    if (r < acc) return b.id;
  }
  return BUCKETS[BUCKETS.length - 1].id;
}

const dots = Array.from({ length: SAMPLE_SIZE }, (_, id) => ({
  id,
  bucket: pickBucket(),
}));

const bucketCounts = BUCKETS.map((b) => ({
  ...b,
  dots: dots.filter((d) => d.bucket === b.id).length,
}));
const bucketsOut = bucketCounts.map((b) => ({
  id: b.id,
  label: b.label,
  min: b.min,
  max: b.max,
  dots: b.dots,
  andelElever: round1((b.dots / SAMPLE_SIZE) * 100),
  antalElever: Math.round((b.dots / SAMPLE_SIZE) * actualTotal),
}));

// Långvarig (sammanhängande) frånvaro: minst två veckor (10 skoldagar) i rad.
// Många kommuners frånvarorutiner triggar en elevhälsoutredning ungefär vid
// den gränsen — det är alltså inte ett godtyckligt val. Sannolikheten att ha
// haft en sådan period ökar kraftigt med elevens totala frånvaronivå: den
// som ändå ligger på 0–15% för året har oftast bara enstaka spridda dagar,
// medan kronisk (50–100%) frånvaro nästan alltid innebär långa sammanhängande
// perioder (skolvägran, långvarig sjukdom, "hemmasittare").
const LONG_ABSENCE_PROB = { 0: 0.02, 1: 0.2, 2: 0.55, 3: 0.9 };
const langvarigFranvaroAndel = bucketsOut.reduce(
  (sum, b) => sum + (b.dots / SAMPLE_SIZE) * LONG_ABSENCE_PROB[b.id],
  0
);

// Illustrativt samband frånvaronivå -> gymnasiebehörighet.
const BEHORIGHET_BY_BUCKET = { 0: 0.93, 1: 0.74, 2: 0.52, 3: 0.27 };
const ejBehorigaShare = bucketsOut.reduce(
  (sum, b) => sum + (b.dots / SAMPLE_SIZE) * (1 - BEHORIGHET_BY_BUCKET[b.id]),
  0
);
const arskullStorlek = Math.round(actualTotal / 10);

const studentDistribution = {
  totalElever: actualTotal,
  sampleSize: SAMPLE_SIZE,
  studentsPerDot,
  senasteLasar: latestYear,
  buckets: bucketsOut,
  dots,
  langvarigFranvaro: {
    troskelSkoldagar: 10,
    andelElever: round1(langvarigFranvaroAndel * 100),
    antalElever: Math.round(langvarigFranvaroAndel * actualTotal),
  },
  gymnasiebehorighet: {
    perBucket: bucketsOut.map((b) => ({
      label: b.label,
      andelBehoriga: Math.round(BEHORIGHET_BY_BUCKET[b.id] * 100),
    })),
    ejBehorigaPerArskull: Math.round(ejBehorigaShare * arskullStorlek),
  },
};
writeFileSync(
  join(OUT_DIR, "studentDistribution.json"),
  JSON.stringify(studentDistribution)
);

console.log("Genererade testdata i public/data/:");
console.log("  overview.json  ", JSON.stringify(overview));
console.log("  timeseries.json", timeseries.length, "rader");
console.log("  byGrade.json   ", byGrade.length, "rader");
console.log("  bySubject.json ", bySubject.length, "rader");
console.log("  bySchool.json  ", bySchool.length, "rader");
console.log("  explore.json   ", explore.length, "rader");
console.log(
  "  studentDistribution.json",
  bucketsOut.map((b) => `${b.label}: ${b.andelElever}%`).join(", "),
  "| långvarig frånvaro:",
  studentDistribution.langvarigFranvaro.andelElever + "%"
);
