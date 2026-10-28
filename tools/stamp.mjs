// Hängt an CSS und JS in den HTML-Seiten eine Versionsnummer aus dem Dateiinhalt (?v=...),
// damit Browser nach einem Upload nicht den alten Stil aus dem Zwischenspeicher zeigen.
// Aufruf im Projektordner: node tools/stamp.mjs
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const hash = (f) => createHash("sha1").update(readFileSync(f)).digest("hex").slice(0, 8);
const dateien = ["assets/css/style.css", "assets/js/main.js", "assets/js/kalender.js"];
const v = Object.fromEntries(dateien.map((f) => [f, hash(f)]));

for (const seite of ["index.html", "impressum.html", "datenschutz.html"]) {
  let h = readFileSync(seite, "utf8");
  for (const f of dateien) h = h.replace(new RegExp(`(${f.replace(/\./g, "\\.")})(\\?v=[0-9a-f]+)?"`, "g"), `$1?v=${v[f]}"`);
  writeFileSync(seite, h);
}
console.log(v);
