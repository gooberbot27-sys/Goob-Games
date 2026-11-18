(async () => {
  const $ = (s) => document.querySelector(s);
  const games = await GG.loadList("games");
  let cat = "All", q = "", favOnly = false;

  const cats = ["All", ...new Set(games.map((g) => g.category || "Games"))];
  const renderCats = () => $("#cats").replaceChildren(...(cats.length > 2 ? cats : []).map((c) =>
    GG.el("button", { class: "chip" + (c === cat ? " on" : ""), onclick: () => { cat = c; renderCats(); render(); } }, c)));

  function render() {
    const fav = GG.favs();
    const list = games.filter((g) => (cat === "All" || g.category === cat) && (!favOnly || fav.has(g.url)) && g.title.toLowerCase().includes(q));
    $("#grid").replaceChildren(...list.map((g) => GG.card({ title: g.title, image: g.image, sub: g.category, id: g.url, onOpen: () => play(g), star: () => favOnly && render() })));
    const empty = $("#empty");
    empty.hidden = list.length > 0;
    if (!list.length) empty.innerHTML = games.length
      ? "No games match your search."
      : "No games yet.<br>Drop a game folder (with an <code>index.html</code>) into <code>public/assets/games/</code> and redeploy.";
  }

  function play(g) {
    $("#pTitle").textContent = g.title;
    $("#pFrame").src = g.url;
    $("#player").hidden = false;
    document.body.style.overflow = "hidden";
  }
  const close = () => { $("#player").hidden = true; $("#pFrame").src = "about:blank"; document.body.style.overflow = ""; history.replaceState(null, "", "/games"); };
  $("#pClose").onclick = close;
  $("#pFs").onclick = () => $("#pFrame").requestFullscreen?.();
  $("#s").oninput = (e) => { q = e.target.value.toLowerCase(); render(); };
  $("#favOnly").onclick = (e) => { favOnly = !favOnly; e.currentTarget.classList.toggle("on", favOnly); render(); };

  renderCats(); render();
  const want = new URLSearchParams(location.search).get("play");
  const hit = want && games.find((g) => g.title === want);
  if (hit) play(hit);
})();
