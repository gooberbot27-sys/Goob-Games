// Tools launcher. Every tool is a standalone HTML page that opens in the player.
// Add one by dropping a folder in public/assets/tools/ (see TOOLS-GUIDE.md).
(async () => {
  const $ = (s) => document.querySelector(s);
  const get = async (f) => { try { const r = await fetch(f, { cache: "no-cache" }); return r.ok ? await r.json() : []; } catch { return []; } };

  // auto-detected folders + hand-written entries (hand-written wins when the url matches)
  const [auto, manual] = await Promise.all([get("/data/tools.generated.json"), get("/data/tools.json")]);
  const merged = new Map();
  [...auto, ...manual].forEach((t) => { if (t && t.url) merged.set(t.url, { ...(merged.get(t.url) || {}), ...t }); });
  const tools = [...merged.values()].map((t) => ({ ...t, title: t.title || "Untitled tool" })).sort((a, b) => a.title.localeCompare(b.title));

  let cat = "All", q = "";
  const cats = ["All", ...new Set(tools.map((t) => t.category || "Tools"))];
  const hue = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  function renderCats() {
    $("#cats").replaceChildren(...(cats.length > 2 ? cats : []).map((c) =>
      GG.el("button", { class: "chip" + (c === cat ? " on" : ""), type: "button", onclick: () => { cat = c; renderCats(); render(); } }, c)));
  }
  function render() {
    const list = tools.filter((t) => (cat === "All" || (t.category || "Tools") === cat) && (t.title + " " + (t.description || "")).toLowerCase().includes(q));
    $("#apps").replaceChildren(...list.map((t) => {
      const h = hue(t.title);
      const icon = GG.el("div", { class: "app-ic", style: t.image ? "" : `background:linear-gradient(135deg,hsl(${h} 60% 40%),hsl(${(h + 50) % 360} 60% 30%))` },
        t.image ? GG.el("img", { src: t.image, alt: "", loading: "lazy" }) : (t.icon || "🧩"));
      return GG.el("button", { class: "app", type: "button", onclick: () => open(t) }, icon, GG.el("b", {}, t.title),
        t.description ? GG.el("small", {}, t.description) : null, tools.length > 1 && cats.length > 2 ? GG.el("span", { class: "cat" }, t.category || "Tools") : null);
    }));
    const empty = $("#empty");
    empty.hidden = list.length > 0;
    if (!list.length) empty.innerHTML = tools.length ? "No tools match your search."
      : "No tools yet.<br>Add a folder with an <code>index.html</code> to <code>public/assets/tools/</code> and redeploy.";
  }

  function open(t) {
    $("#pTitle").textContent = t.title;
    const f = $("#pFrame");
    f.onload = () => { try { f.contentWindow.focus(); } catch {} };
    f.src = t.url;
    $("#player").hidden = false; document.body.style.overflow = "hidden";
    history.replaceState(null, "", "/tools?open=" + encodeURIComponent(t.title));
  }
  function close() {
    $("#player").hidden = true; $("#pFrame").src = "about:blank"; document.body.style.overflow = "";
    history.replaceState(null, "", "/tools");
  }
  $("#pClose").onclick = close;
  $("#pFs").onclick = () => $("#pFrame").requestFullscreen?.();
  $("#s").oninput = (e) => { q = e.target.value.toLowerCase(); render(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#player").hidden) close(); });

  renderCats(); render();
  const want = (new URLSearchParams(location.search).get("open") || "").toLowerCase();
  const hit = want && tools.find((t) => t.title.toLowerCase() === want);
  if (hit) open(hit);
})();
