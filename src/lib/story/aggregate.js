// Hjälpfunktioner för att vikta ihop rader ur byGrade.json till en total.
export function overallForYear(byGrade, lasar) {
  const rows = byGrade.filter((r) => r.lasar === lasar);
  let total = 0;
  let absent = 0;
  let invalid = 0;
  for (const r of rows) {
    total += r.totalElever;
    absent += (r.totalElever * r.franvaroProcent) / 100;
    invalid += (r.totalElever * r.ogiltigProcent) / 100;
  }
  return {
    totalElever: total,
    franvaroProcent: round1((absent / total) * 100),
    giltigProcent: round1(((absent - invalid) / total) * 100),
    ogiltigProcent: round1((invalid / total) * 100),
  };
}

export function overallForYearByKon(byGrade, lasar, kon) {
  const rows = byGrade.filter((r) => r.lasar === lasar && r.kon === kon);
  let total = 0;
  let absent = 0;
  for (const r of rows) {
    total += r.totalElever;
    absent += (r.totalElever * r.franvaroProcent) / 100;
  }
  return { totalElever: total, franvaroProcent: round1((absent / total) * 100) };
}

export function gradeBarData(byGrade, lasar) {
  const arskurser = ["F", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return arskurser.map((ak) => {
    const rows = byGrade.filter((r) => r.lasar === lasar && r.arskurs === ak);
    let total = 0;
    let absent = 0;
    for (const r of rows) {
      total += r.totalElever;
      absent += (r.totalElever * r.franvaroProcent) / 100;
    }
    return {
      label: ak === "F" ? "Förskoleklass" : `Åk ${ak}`,
      value: round1((absent / total) * 100),
    };
  });
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
