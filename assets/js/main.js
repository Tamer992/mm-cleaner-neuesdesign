import { richtwert } from "./calc.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Grundriss: Raum wählen, Beschreibung austauschen */
const ROOMS = {
  empfang: ["Empfang", "Böden wischen, Theke und Glasflächen abwischen, Sitzbereich ordnen.", "Täglich"],
  buero: ["Großraumbüro", "Böden saugen und feucht wischen, Arbeitsplätze und Kontaktflächen abwischen, Papierkörbe leeren.", "Täglich"],
  flur: ["Flur", "Böden saugen und wischen, Türen und Handläufe abwischen.", "Täglich"],
  besprechung: ["Besprechungsräume", "Tische und Stühle abwischen, Böden saugen, Whiteboards reinigen.", "3x pro Woche"],
  kueche: ["Küche", "Arbeitsflächen, Spüle und Geräte außen reinigen, Kühlschrank wöchentlich auswischen.", "Täglich"],
  sanitaer: ["Sanitärbereich", "Desinfizierende Reinigung aller Flächen, Verbrauchsmaterial auffüllen.", "Täglich"],
  lager: ["Lager und Technik", "Böden kehren und feucht wischen.", "1x pro Woche"],
};
const rooms = $$(".room");
const cap = { name: $(".plan__name"), what: $(".plan__what"), freq: $(".plan__freq") };
function pick(el) {
  const [name, what, freq] = ROOMS[el.dataset.room];
  rooms.forEach((r) => { r.classList.toggle("is-on", r === el); r.setAttribute("aria-pressed", r === el); });
  cap.name.textContent = name; cap.what.textContent = what; cap.freq.textContent = freq;
}
rooms.forEach((r) => {
  r.setAttribute("aria-pressed", "false");
  r.addEventListener("click", () => pick(r));
  r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(r); } });
});
pick($('[data-room="buero"]'));

/* Tabs mit gleitender Markierung */
const tabs = $("[data-tabs]");
if (tabs) {
  const btns = $$('[role="tab"]', tabs);
  const ind = $(".tabs__ind", tabs);
  const place = (b) => {
    ind.style.width = b.offsetWidth + "px";
    ind.style.transform = `translateX(${b.offsetLeft}px)`;
  };
  const select = (b, focus) => {
    btns.forEach((x) => {
      const on = x === b;
      x.setAttribute("aria-selected", on);
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
    });
    place(b);
    b.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    if (focus) b.focus();
  };
  btns.forEach((b, i) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: btns.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      select(btns[(n + btns.length) % btns.length], true);
    });
  });
  const cur = () => btns.find((b) => b.getAttribute("aria-selected") === "true");
  place(cur());
  document.fonts?.ready.then(() => place(cur()));
  addEventListener("resize", () => place(cur()));
}

/* Richtwert */
const calc = $("#calc");
if (calc) {
  const range = $("#flaeche");
  const fmt = new Intl.NumberFormat("de-DE");
  const state = () => ({
    art: calc.elements.art.value,
    flaeche: +range.value,
    turnus: +calc.elements.turnus.value,
  });
  const render = () => {
    const s = state();
    const r = richtwert(s);
    $("#flaeche-out").textContent = fmt.format(s.flaeche) + " m²";
    range.style.setProperty("--fill", ((s.flaeche - range.min) / (range.max - range.min)) * 100 + "%");
    $("#res").textContent = `${fmt.format(r.von)} bis ${fmt.format(r.bis)} €`;
    $("#res-hint").textContent = `Etwa ${fmt.format(r.stunden)} Stunden Reinigungszeit im Monat`;
  };
  calc.addEventListener("input", render);
  render();
  $("#calc-go").addEventListener("click", () => {
    const s = state();
    const art = { buero: "Büro", praxis: "Praxis", handel: "Handel", industrie: "Industrie" }[s.art];
    const t = $("#f-text");
    if (!t.value) t.value = `${art}, ca. ${fmt.format(s.flaeche)} m², ${s.turnus}x pro Woche. Richtwert: ${$("#res").textContent}.`;
  });
}

/* Formular */
const form = $("#form");
if (form) {
  const show = (id, bad) => {
    const el = document.getElementById(id);
    el.hidden = !bad;
  };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = form.elements;
    const okName = f.name.value.trim().length > 1;
    const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.mail.value.trim());
    const okDs = f.dsgvo.checked;
    show("e-name", !okName); show("e-mail", !okMail); show("e-dsgvo", !okDs);
    f.name.setAttribute("aria-invalid", !okName); f.mail.setAttribute("aria-invalid", !okMail);
    if (!(okName && okMail && okDs)) {
      (!okName ? f.name : !okMail ? f.mail : f.dsgvo).focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    delete data.dsgvo;
    const endpoint = form.dataset.endpoint;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error(res.status);
      } catch {
        alert("Senden hat nicht geklappt. Bitte schreiben Sie uns an info@mmcleaner.de");
        return;
      }
    } else {
      // shortcut: ohne Backend per mailto, auf Formular-Endpunkt umstellen sobald vorhanden
      const body = `Name: ${data.name}\nUnternehmen: ${data.firma}\nE-Mail: ${data.mail}\nTelefon: ${data.tel}\n\n${data.text}`;
      location.href = `mailto:info@mmcleaner.de?subject=${encodeURIComponent("Angebotsanfrage")}&body=${encodeURIComponent(body)}`;
    }
    $("#form-ok").hidden = false;
    form.reset();
  });
}

/* Referenzen: Bühne mit Reitern, Autowechsel am PC bis zur ersten Eingabe */
const ref = $("[data-ref]");
if (ref) {
  const rTabs = $$('[role="tab"]', ref);
  const rSlides = $$(".slide", ref);
  let timer, stopped = false;
  const show = (i, focus) => {
    rTabs.forEach((t, k) => { t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1; });
    rSlides.forEach((s, k) => s.classList.toggle("is-on", k === i));
    if (focus) rTabs[i].focus();
  };
  const cur = () => rTabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  const restart = () => { ref.classList.remove("is-auto"); void ref.offsetWidth; ref.classList.add("is-auto"); };
  const stop = () => { stopped = true; clearInterval(timer); ref.classList.remove("is-auto"); };
  rTabs.forEach((t, i) => {
    t.addEventListener("click", () => { stop(); show(i); });
    t.addEventListener("keydown", (e) => {
      const n = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: rTabs.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault(); stop(); show((n + rTabs.length) % rTabs.length, true);
    });
  });
  const auto = matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (auto) {
    const tick = () => { if (!ref.matches(":hover")) { show((cur() + 1) % rTabs.length); restart(); } };
    new IntersectionObserver(([en]) => {
      clearInterval(timer);
      if (en.isIntersecting && !stopped) { restart(); timer = setInterval(tick, 6000); } else ref.classList.remove("is-auto");
    }, { threshold: 0.5 }).observe(ref);
  }
}

/* Kopfzeile: Abschnitt markieren, Linie einmal pro Besuch, Jahr im Fuß */
{
  const links = $$(".nav__links a");
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const clear = () => links.forEach((l) => l.removeAttribute("aria-current"));
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    clear();
    byId.get(e.target.id)?.setAttribute("aria-current", "true");
  }), { rootMargin: "-45% 0px -50% 0px" });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  [$(".hero"), $("#kontakt")].forEach((s) => s && io.observe(s));
  try {
    if (!sessionStorage.getItem("kopflinie")) { $(".nav").classList.add("is-intro"); sessionStorage.setItem("kopflinie", "1"); }
  } catch { /* privater Modus: ohne Linie weiter */ }
  const y = $("#jahr"); if (y) y.textContent = new Date().getFullYear();
}

/* Anrufknopf: erst nach dem Startbereich, nicht im Kontaktbereich */
{
  const call = $(".callbar");
  if (call) {
    const seen = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      call.classList.toggle("is-off", seen.size > 0);
    }, { threshold: 0.4 });
    [$(".hero"), $("#kontakt")].forEach((s) => s && io.observe(s));
  }
}
