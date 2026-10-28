import assert from "node:assert/strict";
import { richtwert } from "../assets/js/calc.js";

const r = richtwert({ art: "buero", flaeche: 500, turnus: 5 });
assert.equal(r.stunden, 54);
assert.ok(r.von < r.bis);
assert.ok(r.von > 1400 && r.bis < 2100, JSON.stringify(r));
assert.throws(() => richtwert({ art: "x", flaeche: 500, turnus: 5 }), RangeError);
assert.throws(() => richtwert({ art: "buero", flaeche: 0, turnus: 5 }), RangeError);
console.log("calc ok", r);
