// Editable shortcut tiles on the Browser page. Saved in this browser only.
(() => {
  const $ = (s) => document.querySelector(s);
  const KEY = "goob:shortcuts";
  const row = $("#shortcuts"), editBtn = $("#scEdit"), ov = $("#scOverlay"), form = $("#scForm");
  const fName = $("#scName"), fUrl = $("#scUrl"), fErr = $("#scError"), fDel = $("#scDelete"), fTitle = $("#scTitle");
  if (!row) return;

  // Optional: owner can set GOOB_CONFIG.defaultShortcuts = [{ name, url }] in public/js/config.js
  const defaults = (window.GOOB_CONFIG && window.GOOB_CONFIG.defaultShortcuts) || [];
  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v)) return v; } catch {} return defaults.map((x) => ({ ...x })); };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} };
  let list = load(), editing = false, idx = -1;

  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
  const hue = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const el = GG.el.bind(GG);

  function render() {
    row.classList.toggle("editing", editing);
    editBtn.textContent = editing ? "✓ Done" : "✎ Edit";
    const tiles = list.map((s, i) => {
      const label = s.name || host(s.url);
      return el("button", { class: "sc", type: "button", title: s.url, onclick: () => (editing ? openDialog(i) : launch(s.url)) },
        el("span", { class: "av", style: `background:linear-gradient(135deg,hsl(${hue(label)} 60% 42%),hsl(${(hue(label) + 50) % 360} 60% 32%))` }, (label[0] || "?").toUpperCase()),
        el("span", { class: "nm" }, label), el("span", { class: "pen" }, "✎"));
    });
    tiles.push(el("button", { class: "sc add", type: "button", onclick: () => openDialog(-1) }, "+ Add shortcut"));
    if (!list.length && !editing) tiles.push(el("span", { class: "sc-hint" }, "Pin the sites you use most"));
    row.replaceChildren(...tiles);
  }

  // Reuses the address bar + Go flow from proxy.js, waiting for the proxy to finish starting
  function whenReady() {
    return new Promise((resolve) => {
      let n = 0;
      const t = setInterval(() => {
        const s = ($("#status") && $("#status").textContent) || "";
        const ok = s === "Ready" || ($("#splash") && $("#splash").hidden);
        if (ok || /^Couldn't/.test(s) || ++n > 80) { clearInterval(t); resolve(ok); }
      }, 125);
    });
  }
  async function launch(url) {
    if (!(await whenReady())) return;
    $("#url").value = url;
    const f = $("#form");
    f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  }

  function openDialog(i) {
    idx = i; const s = list[i] || { name: "", url: "" };
    fTitle.textContent = i < 0 ? "Add shortcut" : "Edit shortcut";
    fName.value = s.name || ""; fUrl.value = s.url || ""; fErr.hidden = true; fDel.hidden = i < 0;
    ov.hidden = false; (i < 0 ? fUrl : fName).focus();
  }
  const closeDialog = () => { ov.hidden = true; };
  function cleanUrl(v) {
    v = v.trim(); if (!v) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) v = "https://" + v;
    try { const u = new URL(v); if (!/^https?:$/.test(u.protocol)) return null; if (!u.hostname.includes(".") && u.hostname !== "localhost") return null; return u.href; } catch { return null; }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = cleanUrl(fUrl.value);
    if (!url) { fErr.textContent = "Enter a website like example.com"; fErr.hidden = false; return; }
    const item = { name: fName.value.trim(), url };
    if (idx < 0) list.push(item); else list[idx] = item;
    save(); closeDialog(); render();
  });
  fDel.addEventListener("click", () => { if (idx >= 0) { list.splice(idx, 1); save(); } closeDialog(); render(); });
  $("#scCancel").addEventListener("click", closeDialog);
  ov.addEventListener("click", (e) => { if (e.target === ov) closeDialog(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !ov.hidden) closeDialog(); });
  editBtn.addEventListener("click", () => { editing = !editing; render(); });

  render();
})();
