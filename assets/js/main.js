import { istBegehungstag } from "./kalender.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

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
    delete data.zeit;
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
      const body = `Name: ${data.name}\nUnternehmen: ${data.firma}\nE-Mail: ${data.mail}\nTelefon: ${data.tel}\nWunschtermin Begehung: ${data.termin || "keiner"}\n\n${data.text}`;
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

/* Kalender: Begehungstag wählen */
{
  const cal = $("[data-cal]");
  if (cal) {
    const grid = $(".cal__grid", cal), title = $(".cal__title", cal), sel = $(".cal__sel", cal);
    const feld = $('input[name="termin"]', cal);
    const nav = $$(".cal__nav", cal);
    const heute = new Date();
    const ersterAktuell = new Date(heute.getFullYear(), heute.getMonth(), 1);
    const letzter = new Date(heute.getFullYear(), heute.getMonth() + 5, 1);
    const fmtTag = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const fmtMonat = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
    let monat = ersterAktuell, gewaehlt = null;
    const gleich = (a, b) => a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const zeit = () => cal.querySelector('input[name="zeit"]:checked').value;

    const info = () => {
      if (!gewaehlt) { feld.value = ""; sel.textContent = "Wählen Sie einen Tag. Wir bestätigen den Termin per Mail oder Telefon."; return; }
      feld.value = fmtTag.format(gewaehlt) + ", " + zeit();
      sel.replaceChildren("Ihr Wunsch: ", Object.assign(document.createElement("strong"), { textContent: feld.value }), ". Wir bestätigen per Mail oder Telefon.");
    };
    const render = (fokus) => {
      title.textContent = fmtMonat.format(monat);
      nav[0].disabled = monat <= ersterAktuell;
      nav[1].disabled = monat >= letzter;
      grid.replaceChildren();
      ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].forEach((t) => grid.append(Object.assign(document.createElement("span"), { className: "cal__wd", textContent: t })));
      for (let i = 0; i < (monat.getDay() + 6) % 7; i++) grid.append(document.createElement("span"));
      const n = new Date(monat.getFullYear(), monat.getMonth() + 1, 0).getDate();
      for (let t = 1; t <= n; t++) {
        const d = new Date(monat.getFullYear(), monat.getMonth(), t);
        const b = Object.assign(document.createElement("button"), { type: "button", className: "cal__d", textContent: t });
        b.setAttribute("aria-label", fmtTag.format(d));
        b.setAttribute("aria-pressed", gleich(gewaehlt, d));
        b.disabled = !istBegehungstag(d, heute);
        if (gleich(heute, d)) b.dataset.heute = "";
        b.dataset.t = t;
        grid.append(b);
      }
      if (fokus) grid.querySelector(".cal__d:not(:disabled)")?.focus();
    };
    grid.addEventListener("click", (e) => {
      const b = e.target.closest(".cal__d");
      if (!b || b.disabled) return;
      gewaehlt = new Date(monat.getFullYear(), monat.getMonth(), +b.dataset.t);
      $$(".cal__d", grid).forEach((x) => x.setAttribute("aria-pressed", x === b));
      info();
    });
    grid.addEventListener("keydown", (e) => {
      const tage = $$(".cal__d", grid), i = tage.indexOf(document.activeElement);
      const schritt = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (i < 0 || schritt === undefined) return;
      e.preventDefault();
      for (let k = i + schritt; k >= 0 && k < tage.length; k += schritt) { if (!tage[k].disabled) { tage[k].focus(); break; } }
    });
    nav.forEach((b) => b.addEventListener("click", () => { monat = new Date(monat.getFullYear(), monat.getMonth() + +b.dataset.dir, 1); render(); }));
    cal.addEventListener("change", (e) => { if (e.target.name === "zeit") info(); });
    cal.closest("form").addEventListener("reset", () => { gewaehlt = null; monat = ersterAktuell; setTimeout(() => { render(); info(); }); });
    // erster Monat ohne wählbaren Tag: gleich zum nächsten
    render();
    if (!$(".cal__d:not(:disabled)", grid) && monat < letzter) { monat = new Date(monat.getFullYear(), monat.getMonth() + 1, 1); render(); }
    info();
  }
}
