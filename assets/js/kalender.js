// Begehungstage: Montag bis Freitag, ohne gesetzliche Feiertage in Baden-Württemberg,
// frühestens in VORLAUF_TAGE Tagen, höchstens MAX_TAGE Tage voraus.
// shortcut: feste Regeln statt Kundenkalender, bei echten Terminen auf Buchungssystem umstellen.
export const BEGEHUNG_WOCHENTAGE = [1, 2, 3, 4, 5];
export const VORLAUF_TAGE = 2;
export const MAX_TAGE = 150;

const tag = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const gleich = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Ostersonntag nach der Gauß-Formel (gregorianisch)
export function ostern(jahr) {
  const a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31), t = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(jahr, monat - 1, t);
}

export function feiertage(jahr) {
  const o = ostern(jahr);
  const fest = [[0, 1], [0, 6], [4, 1], [9, 3], [10, 1], [11, 25], [11, 26]].map(([m, t]) => new Date(jahr, m, t));
  return [...fest, plus(o, -2), plus(o, 1), plus(o, 39), plus(o, 50), plus(o, 60)];
}

export const istFeiertag = (d) => feiertage(d.getFullYear()).some((f) => gleich(f, d));

export function istBegehungstag(d, heute = new Date()) {
  const x = tag(d), start = plus(tag(heute), VORLAUF_TAGE), ende = plus(start, MAX_TAGE);
  return x >= start && x <= ende && BEGEHUNG_WOCHENTAGE.includes(x.getDay()) && !istFeiertag(x);
}
