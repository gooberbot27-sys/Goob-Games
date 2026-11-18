(async () => {
  const $ = (s) => document.querySelector(s);
  const movies = await GG.loadList("movies");
  let cat = "All", q = "";
  const cats = ["All", ...new Set(movies.map((m) => m.category || "Films"))];
  const renderCats = () => $("#cats").replaceChildren(...(cats.length > 2 ? cats : []).map((c) =>
    GG.el("button", { class: "chip" + (c === cat ? " on" : ""), onclick: () => { cat = c; renderCats(); render(); } }, c)));

  function render() {
    const list = movies.filter((m) => (cat === "All" || m.category === cat) && (m.title + " " + (m.year || "") + " " + (m.description || "")).toLowerCase().includes(q));
    $("#grid").replaceChildren(...list.map((m) => GG.card({ title: m.title, image: m.poster, sub: [m.year, m.category].filter(Boolean).join(" · "), onOpen: () => play(m) })));
    const empty = $("#empty");
    empty.hidden = list.length > 0;
    if (!list.length) empty.innerHTML = movies.length
      ? "No films match your search."
      : "No films yet.<br>Add entries to <code>public/data/movies.json</code> or drop video files into <code>public/assets/movies/</code>.";
  }

  const isFile = (u) => /\.(mp4|webm|m4v|ogv|mov)(\?|#|$)/i.test(u);
  function play(m) {
    $("#pTitle").textContent = m.title + (m.year ? ` (${m.year})` : "");
    const body = $("#pBody");
    let node;
    if (isFile(m.src)) {
      node = GG.el("video", { controls: "", autoplay: "", playsinline: "", src: m.src, poster: m.poster || false, style: "flex:1;width:100%;min-height:0;background:#000" });
    } else {
      node = GG.el("iframe", { src: m.src, allow: "fullscreen; autoplay; picture-in-picture", allowfullscreen: "", style: "flex:1;width:100%;border:0;background:#000" });
    }
    body.replaceChildren(node);
    $("#player").hidden = false; document.body.style.overflow = "hidden";
  }
  const close = () => { $("#pBody").replaceChildren(); $("#player").hidden = true; document.body.style.overflow = ""; };
  $("#pClose").onclick = close;
  $("#pFs").onclick = () => $("#pBody").firstElementChild?.requestFullscreen?.();
  document.addEventListener("keydown", (e) => e.key === "Escape" && !$("#player").hidden && close());
  $("#s").oninput = (e) => { q = e.target.value.toLowerCase(); render(); };
  renderCats(); render();
})();
