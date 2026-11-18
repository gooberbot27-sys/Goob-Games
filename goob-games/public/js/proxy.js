(async () => {
  const $ = (s) => document.querySelector(s);
  const status = $("#status"), sub = $("#sub"), input = $("#url");
  let scramjet, connection, frame, ready = false;

  function fail(msg, err) { console.error(err || msg); status.textContent = "Couldn't start the proxy"; sub.textContent = msg; }

  async function setTransport() {
    const path = GG.settings.transport === "epoxy" ? "/epoxy/index.mjs" : "/libcurl/index.mjs";
    await connection.setTransport(path, [{ wisp: GG.wispUrl() }]);
  }

  async function init() {
    if (!("serviceWorker" in navigator)) throw new Error("Service workers need HTTPS (or localhost).");
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    const { ScramjetController } = $scramjetLoadController();
    scramjet = new ScramjetController({
      files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" },
    });
    await scramjet.init();
    connection = new BareMux.BareMuxConnection("/baremux/worker.js");
    await setTransport();
    ready = true;
  }

  function go(raw) {
    const url = GG.resolveInput(raw);
    if (!url || !ready) return;
    if (!frame) {
      const el = document.createElement("iframe");
      el.setAttribute("allow", "fullscreen; autoplay; clipboard-write");
      $("#view").append(el);
      frame = scramjet.createFrame(el);
      frame.addEventListener?.("urlchange", (e) => { if (e.url) input.value = e.url; });
      $("#splash").hidden = true;
    }
    input.value = url;
    frame.go(url);
  }

  $("#form").addEventListener("submit", (e) => { e.preventDefault(); go(input.value); });
  $("#back").onclick = () => frame?.back?.();
  $("#fwd").onclick = () => frame?.forward?.();
  $("#reload").onclick = () => frame?.reload?.();
  $("#fs").onclick = () => frame?.frame?.requestFullscreen?.();

  try {
    sub.textContent = "Relay: " + GG.wispUrl();
    await init();
    status.textContent = "Ready";
    sub.textContent = "Type a URL or search above. Relay: " + GG.wispUrl();
    const q = new URLSearchParams(location.search).get("q");
    if (q) go(q); else input.focus();
  } catch (err) {
    fail(String(err.message || err), err);
  }
})();
