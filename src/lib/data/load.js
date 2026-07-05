const FILES = [
  "overview",
  "timeseries",
  "byGrade",
  "bySubject",
  "bySchool",
  "explore",
  "studentDistribution",
  "stadiumTrend",
];

export async function loadData() {
  const base = import.meta.env.BASE_URL;
  const entries = await Promise.all(
    FILES.map(async (name) => {
      const res = await fetch(`${base}data/${name}.json`);
      if (!res.ok) throw new Error(`Kunde inte läsa ${name}.json`);
      return [name, await res.json()];
    })
  );
  return Object.fromEntries(entries);
}
