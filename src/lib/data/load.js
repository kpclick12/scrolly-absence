// Datat importeras statiskt och bundlas med appen — kod och data är alltid
// atomiskt konsistenta, och inget "Laddar data…"-läge behövs.
import overview from "../../data/overview.json";
import timeseries from "../../data/timeseries.json";
import byGrade from "../../data/byGrade.json";
import bySubject from "../../data/bySubject.json";
import bySchool from "../../data/bySchool.json";
import explore from "../../data/explore.json";
import studentDistribution from "../../data/studentDistribution.json";
import stadiumTrend from "../../data/stadiumTrend.json";
import lovEffekt from "../../data/lovEffekt.json";
import progression from "../../data/progression.json";
import bucketTrend from "../../data/bucketTrend.json";

export const appData = {
  overview,
  timeseries,
  byGrade,
  bySubject,
  bySchool,
  explore,
  studentDistribution,
  stadiumTrend,
  lovEffekt,
  progression,
  bucketTrend,
};
