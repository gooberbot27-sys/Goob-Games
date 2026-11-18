document.getElementById("q").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = document.getElementById("qi").value.trim();
  if (v) location.href = "/proxy?q=" + encodeURIComponent(v);
});
(async () => {
  const games = await GG.loadList("games");
  const open = (g) => (location.href = "/games?play=" + encodeURIComponent(g.title));
  const make = (g) => GG.card({ title: g.title, image: g.image, sub: g.category, onOpen: () => open(g) });
  const fav = GG.favs();
  const favGames = games.filter((g) => fav.has(g.url));
  if (favGames.length) { favs.replaceChildren(...favGames.map(make)); favWrap.hidden = false; }
  if (games.length) {
    const pick = [...games].sort(() => Math.random() - 0.5).slice(0, 6);
    rnd.replaceChildren(...pick.map(make)); rndWrap.hidden = false;
  }
})();

// gentle falling snow (skipped for people who prefer reduced motion)
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.getElementById("snow");
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("span"), size = 3 + Math.random() * 5;
    s.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;opacity:${0.35 + Math.random() * 0.5};animation-duration:${9 + Math.random() * 12}s;animation-delay:${-Math.random() * 20}s`;
    box.append(s);
  }
})();
