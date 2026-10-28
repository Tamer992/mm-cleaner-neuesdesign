import assert from "node:assert/strict";
import { ostern, istFeiertag, istBegehungstag } from "../assets/js/kalender.js";

const ymd = (d) => [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");
assert.equal(ymd(ostern(2026)), "2026-4-5");
assert.equal(ymd(ostern(2027)), "2027-3-28");
assert.equal(ymd(ostern(2038)), "2038-4-25");

// Feiertage 2026 in Baden-Württemberg
for (const t of ["2026-1-1", "2026-1-6", "2026-4-3", "2026-4-6", "2026-5-1", "2026-5-14", "2026-5-25", "2026-6-4", "2026-10-3", "2026-11-1", "2026-12-25", "2026-12-26"]) {
  const [y, m, d] = t.split("-").map(Number);
  assert.ok(istFeiertag(new Date(y, m - 1, d)), t);
}
assert.ok(!istFeiertag(new Date(2026, 10, 2)));

// Begehungstage: Montag ja, Wochenende nein, Vorlauf 2 Tage, Feiertag nein
const heute = new Date(2026, 9, 28); // Mittwoch
assert.ok(!istBegehungstag(new Date(2026, 9, 29), heute), "Vorlauf");
assert.ok(istBegehungstag(new Date(2026, 9, 30), heute), "Freitag in 2 Tagen");
assert.ok(!istBegehungstag(new Date(2026, 10, 1), heute), "Sonntag");
assert.ok(!istBegehungstag(new Date(2026, 10, 7), heute), "Samstag");
assert.ok(istBegehungstag(new Date(2026, 10, 2), heute), "Montag");
assert.ok(!istBegehungstag(new Date(2026, 11, 25), heute), "Feiertag");
assert.ok(!istBegehungstag(new Date(2028, 0, 3), heute), "zu weit voraus");
console.log("kalender ok");
