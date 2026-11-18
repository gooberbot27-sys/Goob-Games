// Changelog popup. To add an update, put a new entry at the TOP of public/data/changelog.json.
(async () => {
  const $ = (id) => document.getElementById(id);
  const btn = $("clBtn"), overlay = $("clOverlay"), body = $("clBody"), dot = $("clDot"), closeBtn = $("clClose");
  if (!btn || !overlay) return;

  const SEEN = "goob:changelog-seen";
  const getSeen = () => { try { return localStorage.getItem(SEEN); } catch { return null; } };
  const setSeen = (v) => { try { localStorage.setItem(SEEN, v); } catch {} };

  let data = [];
  try { const r = await fetch("/data/changelog.json", { cache: "no-cache" }); data = r.ok ? await r.json() : []; } catch {}
  const latest = (data[0] && data[0].version) || "";
  if (latest && getSeen() !== latest) dot.hidden = false;   // red dot until they've opened it

  const LABELS = { new: "New", improved: "Improved", fixed: "Fixed", removed: "Removed" };
  const { el } = GG;
  body.replaceChildren(...(data.length ? data.map((e) =>
    el("div", { class: "cl-entry" },
      el("div", { class: "cl-meta" }, el("span", { class: "cl-ver" }, "v" + e.version), e.date ? el("span", { class: "cl-date" }, e.date) : null),
      e.title ? el("h3", {}, e.title) : null,
      el("ul", {}, ...(e.changes || []).map((c) =>
        el("li", {}, el("span", { class: "cl-tag " + (LABELS[c.type] ? c.type : "new") }, LABELS[c.type] || "New"), el("span", {}, c.text))))
    )) : [el("div", { class: "cl-empty" }, "No updates yet.")]));

  function open() {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    if (latest) { setSeen(latest); dot.hidden = true; }
    closeBtn.focus();
  }
  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    btn.focus();
  }
  btn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });   // click the blurred area to close
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) close(); });
})();
