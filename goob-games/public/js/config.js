// ===== The ONE file you edit for site-wide settings =====
window.GOOB_CONFIG = {
  siteName: "Goob Games",
  wispServers: {
    // After you host /wisp-server somewhere, put its address here, e.g. "wss://goob-wisp.onrender.com/wisp/"
    // Leave "" until then: the option shows as "not set up" and falls back to Anura.
    anura: { label: "Anura",      url: "wss://anura.pro/wisp/" }
  },
  searchEngines: {
    "DuckDuckGo": "https://duckduckgo.com/?q=%s",
    "Google":     "https://www.google.com/search?q=%s",
    "Bing":       "https://www.bing.com/search?q=%s",
    "Brave":      "https://search.brave.com/search?q=%s"
  }
};
