(() => {
  const $ = (s) => document.querySelector(s);
  const { el } = GG;
  const S = () => GG.settings;

  // ----- tabs -----
  document.querySelectorAll(".tab").forEach((t) => t.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === t));
    document.querySelectorAll(".pane").forEach((p) => p.hidden = p.id !== t.dataset.t);
  });

  const panel = (title, sub, ...kids) => el("div", { class: "panel" }, el("h3", {}, title), el("p", { class: "sub" }, sub), ...kids);
  const radio = (name, value, label, desc, checked, onchange) =>
    el("label", { class: "opt" }, el("input", { type: "radio", name, value, checked: checked ? "" : false, onchange }), el("div", {}, el("b", {}, label), desc ? el("small", {}, desc) : null));
  const toggle = (label, checked, onchange) =>
    el("label", { class: "toggle" }, el("input", { type: "checkbox", checked: checked ? "" : false, onchange: (e) => onchange(e.target.checked) }), label);

  // ----- Appearance -----
  const sw = () => el("div", { class: "swatches" }, ...Object.entries(GG.THEMES).map(([k, name]) => {
    const probe = el("div"); probe.dataset.theme = k; document.body.append(probe);
    const cs = getComputedStyle(probe);
    const dots = ["--bg", "--card", "--accent"].map((v) => el("i", { style: `background:${cs.getPropertyValue(v)}` }));
    probe.remove();
    return el("button", { class: "sw" + (S().theme === k ? " on" : ""), onclick: () => { GG.set({ theme: k }); drawAppearance(); } }, el("div", { class: "dots" }, ...dots), name);
  }));
  function drawAppearance() { $("#appearance").replaceChildren(panel("Theme", "Pick a look for the whole site. It's saved on this device.", sw())); }

  // ----- Proxy -----
  function drawProxy() {
    const wisps = GG.cfg.wispServers;
    const status = el("div", { class: "status" });
    const custom = el("input", { type: "text", placeholder: "wss://your-server.com/wisp/", value: S().customWisp, spellcheck: "false",
      oninput: (e) => GG.set({ customWisp: e.target.value }) });
    const test = () => {
      const url = GG.wispUrl(); status.className = "status"; status.textContent = "Testing " + url + " …";
      let done = false;
      try {
        const ws = new WebSocket(url);
        const t = setTimeout(() => { if (!done) { done = true; ws.close(); status.className = "status bad"; status.textContent = "Timed out. That server isn't responding."; } }, 6000);
        ws.onopen = () => { if (done) return; done = true; clearTimeout(t); ws.close(); status.className = "status ok"; status.textContent = "✓ Connected. That relay is working."; };
        ws.onerror = () => { if (done) return; done = true; clearTimeout(t); status.className = "status bad"; status.textContent = "Couldn't connect to that relay."; };
      } catch { status.className = "status bad"; status.textContent = "That doesn't look like a valid ws:// or wss:// address."; }
    };

    $("#proxy").replaceChildren(
      panel("Wisp server", "The relay your proxy traffic goes through.",
        ...Object.entries(wisps).map(([k, w]) => radio("wisp", k, w.label, w.url || "Not set up yet (falls back to Anura)", S().wisp === k, () => GG.set({ wisp: k }))),
        radio("wisp", "custom", "Custom", "Use your own Wisp server", S().wisp === "custom", () => GG.set({ wisp: "custom" })),
        el("label", { class: "field" }, "Custom Wisp URL"), custom,
        el("div", { class: "row" }, el("button", { class: "btn small", onclick: test }, "Test connection")), status),
      panel("Relay transport", "How the proxy talks to the Wisp server. If sites misbehave, try the other one.",
        radio("transport", "libcurl", "libcurl", "Most compatible. Recommended.", S().transport === "libcurl", () => GG.set({ transport: "libcurl" })),
        radio("transport", "epoxy", "Epoxy", "Lighter and sometimes faster.", S().transport === "epoxy", () => GG.set({ transport: "epoxy" }))),
      panel("Search engine", "Used when you type something that isn't a URL.",
        el("select", { onchange: (e) => GG.set({ engine: e.target.value }) },
          ...Object.keys(GG.cfg.searchEngines).map((n) => el("option", { value: n, selected: S().engine === n ? "" : false }, n)))),
      el("p", { class: "muted" }, "Proxy changes apply the next time you open the Browser page."));
  }

  // ----- Privacy -----
  function drawPrivacy() {
    const grid = el("div", { class: "swatches" }, ...Object.entries(GG.CLOAKS).map(([k, c]) =>
      el("button", { class: "sw" + (S().cloak === k ? " on" : ""), onclick: () => { GG.set({ cloak: k }); drawPrivacy(); } },
        c.icon ? el("img", { src: c.icon, width: 20, height: 20, style: "display:block;margin-bottom:6px;border-radius:4px", alt: "" }) : el("div", { style: "height:26px" }), c.label)));
    const custom = el("div", { hidden: S().cloak === "custom" ? false : "" },
      el("label", { class: "field" }, "Tab title"), el("input", { type: "text", value: S().customTitle, oninput: (e) => GG.set({ customTitle: e.target.value }) }),
      el("label", { class: "field" }, "Icon URL (png/ico/svg)"), el("input", { type: "text", value: S().customIcon, oninput: (e) => GG.set({ customIcon: e.target.value }) }));
    if (S().cloak !== "custom") custom.hidden = true;

    const openBlank = () => {
      const w = window.open("about:blank", "_blank");
      if (!w) return alert("Please allow pop-ups for this site, then try again.");
      const f = w.document.createElement("iframe");
      f.src = location.origin + "/"; f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0";
      w.document.title = document.title; w.document.body.style.margin = "0"; w.document.body.append(f);
      location.replace(S().panicUrl || "https://classroom.google.com");
    };
    const keyBtn = el("button", { class: "btn ghost small", onclick: () => {
      keyBtn.textContent = "Press any key…";
      const h = (e) => { e.preventDefault(); GG.set({ panicKey: e.key }); document.removeEventListener("keydown", h, true); drawPrivacy(); };
      document.addEventListener("keydown", h, true);
    } }, S().panicKey ? `Key: ${S().panicKey}` : "Set panic key");

    $("#privacy").replaceChildren(
      panel("Tab cloak", "Changes the tab's title and icon.", grid, custom),
      panel("about:blank", "Opens the site inside an about:blank tab and sends this tab to the URL below.",
        el("button", { class: "btn small", onclick: openBlank }, "Open in about:blank")),
      panel("Panic key", "Press this key anywhere (outside text boxes) to jump to a safe page instantly.",
        el("div", { class: "row" }, keyBtn, S().panicKey ? el("button", { class: "btn ghost small", onclick: () => { GG.set({ panicKey: "" }); drawPrivacy(); } }, "Clear") : null),
        el("label", { class: "field" }, "Safe page URL"),
        el("input", { type: "text", value: S().panicUrl, oninput: (e) => GG.set({ panicUrl: e.target.value }) })),
      panel("Extras", "", toggle("Ask for confirmation before closing or leaving the page", S().confirmLeave, (v) => GG.set({ confirmLeave: v }))));
  }

  $("#resetAll").onclick = () => { if (confirm("Reset all settings?")) { GG.reset(); drawAppearance(); drawProxy(); drawPrivacy(); } };
  drawAppearance(); drawProxy(); drawPrivacy();
})();
