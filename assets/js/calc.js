// Richtwert: Fläche / Leistungswert = Stunden je Reinigung. Stundensatz netto, Spanne +/- 15 %.
// shortcut: Pauschalwerte, vor Livegang mit echten Kalkulationsdaten ersetzen.
export const LEISTUNG_QM_PRO_H = { buero: 200, praxis: 100, handel: 180, industrie: 300 };
export const STUNDENSATZ = 32;
export const WOCHEN_PRO_MONAT = 4.33;

export function richtwert({ art, flaeche, turnus }) {
  const lw = LEISTUNG_QM_PRO_H[art];
  if (!lw || !(flaeche > 0) || !(turnus > 0)) throw new RangeError("ungueltige Eingabe");
  const stunden = (flaeche / lw) * turnus * WOCHEN_PRO_MONAT;
  const mitte = stunden * STUNDENSATZ;
  const rund = (x) => Math.round(x / 10) * 10;
  return { stunden: Math.round(stunden), von: rund(mitte * 0.85), bis: rund(mitte * 1.15) };
}
