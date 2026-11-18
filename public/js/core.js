// Shared by every page: settings store, theme, tab cloak, panic key, nav/footer, data helpers.
(() => {
  const CFG = window.GOOB_CONFIG;
  const KEY = "goob:settings";
  const DEFAULTS = {
    theme: "arctic", transport: "libcurl", wisp: "goob", customWisp: "",
    engine: "DuckDuckGo", cloak: "none", customTitle: "", customIcon: "",
    panicKey: "", panicUrl: "https://classroom.google.com", confirmLeave: false,
  };
  const gfav = (d) => `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
  const CLOAKS = {
    none:       { label: "Off (Goob Games)" },
    classroom:  { label: "Google Classroom", title: "Classes", icon: gfav("classroom.google.com") },
    docs:       { label: "Google Docs", title: "Untitled document - Google Docs", icon: gfav("docs.google.com") },
    drive:      { label: "Google Drive", title: "My Drive - Google Drive", icon: gfav("drive.google.com") },
    canvas:     { label: "Canvas", title: "Dashboard", icon: gfav("instructure.com") },
    schoology:  { label: "Schoology", title: "Home | Schoology", icon: gfav("schoology.com") },
    clever:     { label: "Clever", title: "Clever | Portal", icon: gfav("clever.com") },
    khan:       { label: "Khan Academy", title: "Khan Academy", icon: gfav("khanacademy.org") },
    desmos:     { label: "Desmos", title: "Desmos | Graphing Calculator", icon: gfav("desmos.com") },
    wikipedia:  { label: "Wikipedia", title: "Wikipedia, the free encyclopedia", icon: gfav("wikipedia.org") },
    custom:     { label: "Custom…" },
  };
  const THEMES = { arctic: "Arctic Blue", goob: "Goob Green", midnight: "Midnight", purple: "Purple Haze", sunset: "Sunset", ocean: "Ocean", light: "Light" };
  const DEFAULT_ICON = "/assets/img/favicon.png?v=2";

  const load = () => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { ...DEFAULTS }; } };
  const GG = (window.GG = {
    cfg: CFG, CLOAKS, THEMES, DEFAULTS, settings: load(),
    set(patch) { Object.assign(this.settings, patch); try { localStorage.setItem(KEY, JSON.stringify(this.settings)); } catch {} this.apply(); },
    reset() { try { localStorage.removeItem(KEY); } catch {} this.settings = load(); this.apply(); },
    wispUrl() {
      const s = this.settings;
      if (s.wisp === "custom" && s.customWisp.trim()) return s.customWisp.trim();
      const w = CFG.wispServers[s.wisp];
      return w && w.url ? w.url : CFG.wispServers.anura.url;
    },
    searchUrl(q) { return (CFG.searchEngines[this.settings.engine] || Object.values(CFG.searchEngines)[0]).replace("%s", encodeURIComponent(q)); },
    resolveInput(v) {
      v = v.trim(); if (!v) return "";
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) return v;
      if (/^[^\s]+\.[^\s]{2,}$/.test(v) && !v.includes(" ")) return "https://" + v;
      return this.searchUrl(v);
    },
    // ---- favorites ----
    favs() { try { return new Set(JSON.parse(localStorage.getItem("goob:favs") || "[]")); } catch { return new Set(); } },
    toggleFav(id) { const f = this.favs(); f.has(id) ? f.delete(id) : f.add(id); try { localStorage.setItem("goob:favs", JSON.stringify([...f])); } catch {} return f.has(id); },
    // ---- data ----
    async loadList(name) {
      const get = async (f) => { try { const r = await fetch(f, { cache: "no-cache" }); return r.ok ? await r.json() : []; } catch { return []; } };
      const [auto, manual] = await Promise.all([get(`/data/${name}.generated.json`), get(`/data/${name}.json`)]);
      const m = new Map();
      [...auto, ...manual].forEach((x) => m.set((x.title || "").toLowerCase(), x));
      return [...m.values()].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    },
    el(tag, attrs = {}, ...kids) {
      const e = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v);
      }
      kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
      return e;
    },
    // Card with image (or an auto-generated colour tile when there is no image)
    card({ title, image, sub, id, onOpen, star }) {
      const hue = [...title].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
      const fb = () => this.el("div", { class: "fb", style: `background:linear-gradient(135deg,hsl(${hue} 60% 38%),hsl(${(hue + 50) % 360} 60% 28%))` }, title.trim()[0] || "?");
      const art = image ? this.el("img", { class: "art", src: image, alt: "", loading: "lazy" }) : fb();
      if (image) art.addEventListener("error", () => art.replaceWith(fb()));
      const c = this.el("button", { class: "card", onclick: onOpen, title }, art,
        this.el("div", { class: "info" }, this.el("b", {}, title), sub ? this.el("small", {}, sub) : null));
      if (star) {
        const s = this.el("span", { class: "star" + (this.favs().has(id) ? " on" : ""), role: "button", "aria-label": "Favorite",
          onclick: (e) => { e.stopPropagation(); s.classList.toggle("on", this.toggleFav(id)); s.textContent = s.classList.contains("on") ? "★" : "☆"; star(); } },
          this.favs().has(id) ? "★" : "☆");
        c.append(s);
      }
      return c;
    },
    // ---- apply theme + cloak ----
    _origTitle: null,
    apply() {
      const s = this.settings;
      document.documentElement.dataset.theme = s.theme;
      if (this._origTitle === null) this._origTitle = document.title;
      let t = this._origTitle, icon = DEFAULT_ICON;
      if (s.cloak === "custom") { if (s.customTitle) t = s.customTitle; if (s.customIcon) icon = s.customIcon; }
      else if (CLOAKS[s.cloak] && CLOAKS[s.cloak].title) { t = CLOAKS[s.cloak].title; icon = CLOAKS[s.cloak].icon; }
      document.title = t;
      let link = document.getElementById("gg-icon");
      if (!link) { link = document.createElement("link"); link.id = "gg-icon"; link.rel = "icon"; document.head.append(link); }
      link.href = icon;
      if (!document.getElementById("gg-apple")) {
        const a = document.createElement("link"); a.id = "gg-apple"; a.rel = "apple-touch-icon"; a.href = "/assets/img/apple-touch-icon.png?v=2"; document.head.append(a);
      }
      window.onbeforeunload = s.confirmLeave ? (e) => { e.preventDefault(); e.returnValue = ""; } : null;
    },
  });
  GG.apply(); // runs in <head> so the theme is set before first paint

  document.addEventListener("keydown", (e) => {
    const s = GG.settings;
    if (!s.panicKey || e.key !== s.panicKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    window.onbeforeunload = null; location.replace(s.panicUrl || "https://classroom.google.com");
  });

  document.addEventListener("DOMContentLoaded", () => {
    GG._origTitle = document.title; GG.apply();
    const page = document.body.dataset.page;
    const nav = document.getElementById("nav");
    if (nav) {
      const L = [["home", "/", "Home"], ["games", "/games", "Games"], ["movies", "/movies", "Movies"], ["tools", "/tools", "Tools"], ["proxy", "/proxy", "Browser"], ["settings", "/settings", "Settings"]];
      nav.className = "nav";
      nav.innerHTML = `<div class="nav-in"><a class="brand" href="/"><img src="/assets/img/penguin-icon.png" alt="" width="34" height="34"><span>${CFG.siteName}</span></a><nav class="links">${
        L.map(([k, h, t]) => `<a href="${h}" class="${k === page ? "active" : ""}">${t}</a>`).join("")}</nav></div>`;
    }
    const f = document.getElementById("footer");
    if (f) f.innerHTML = `<footer>🐧 © ${new Date().getFullYear()} ${CFG.siteName}</footer>`;
  });
})();
