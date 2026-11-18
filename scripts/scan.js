// Auto-builds the game & movie lists from whatever you drop into public/assets/.
// Anything you also list by hand in public/data/*.json overrides the auto entry (matched by title).
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public");
const IMG = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
const VID = ["mp4", "webm", "m4v", "ogv", "mov"];
const pretty = (s) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const readJSON = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return {}; } };
const ext = (f) => path.extname(f).slice(1).toLowerCase();
fs.mkdirSync(path.join(root, "data"), { recursive: true });

// ---------- GAMES: one folder per game, containing index.html ----------
const games = [];
const gdir = path.join(root, "assets/games");
if (fs.existsSync(gdir)) {
  for (const d of fs.readdirSync(gdir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const dir = path.join(gdir, d.name);
    if (!fs.existsSync(path.join(dir, "index.html"))) continue;
    const meta = readJSON(path.join(dir, "meta.json"));
    const thumb = ["thumb", "icon", "cover", "logo", "image"]
      .flatMap((n) => IMG.map((e) => `${n}.${e}`))
      .find((f) => fs.existsSync(path.join(dir, f)));
    games.push({
      title: meta.title || pretty(d.name),
      url: encodeURI(`/assets/games/${d.name}/index.html`),
      image: meta.image || (thumb ? encodeURI(`/assets/games/${d.name}/${thumb}`) : ""),
      category: meta.category || "Games",
    });
  }
}
fs.writeFileSync(path.join(root, "data/games.generated.json"), JSON.stringify(games, null, 2));

// ---------- MOVIES: video files in assets/movies, optional same-name poster image and .json info ----------
const movies = [];
const mdir = path.join(root, "assets/movies");
if (fs.existsSync(mdir)) {
  for (const f of fs.readdirSync(mdir)) {
    if (!VID.includes(ext(f))) continue;
    const base = path.basename(f, path.extname(f));
    const poster = IMG.map((e) => `${base}.${e}`).find((p) => fs.existsSync(path.join(mdir, p)));
    const meta = readJSON(path.join(mdir, `${base}.json`));
    movies.push({
      title: meta.title || pretty(base),
      year: meta.year || "",
      category: meta.category || "Films",
      description: meta.description || "",
      poster: meta.poster || (poster ? encodeURI(`/assets/movies/${poster}`) : ""),
      src: encodeURI(`/assets/movies/${f}`),
    });
  }
}
fs.writeFileSync(path.join(root, "data/movies.generated.json"), JSON.stringify(movies, null, 2));

// ---------- TOOLS: a folder with index.html (+ optional meta.json), or a single .html file (+ optional same-name .json) ----------
// Anything starting with "_" or "." is ignored (e.g. a _template folder).
const tools = [];
const addTool = (name, url, meta, image) => tools.push({
  title: meta.title || pretty(name),
  url: encodeURI(url),
  icon: meta.icon || "🧩",
  description: meta.description || "",
  category: meta.category || "Tools",
  ...(meta.image || image ? { image: meta.image || image } : {}),
});
const tdir = path.join(root, "assets/tools");
if (fs.existsSync(tdir)) {
  for (const e of fs.readdirSync(tdir, { withFileTypes: true })) {
    if (/^[_.]/.test(e.name)) continue;
    if (e.isDirectory()) {
      const t = path.join(tdir, e.name);
      if (!fs.existsSync(path.join(t, "index.html"))) continue;
      const thumb = ["thumb", "icon", "cover", "logo"].flatMap((n) => IMG.map((x) => `${n}.${x}`)).find((f) => fs.existsSync(path.join(t, f)));
      addTool(e.name, `/assets/tools/${e.name}/index.html`, readJSON(path.join(t, "meta.json")), thumb ? encodeURI(`/assets/tools/${e.name}/${thumb}`) : "");
    } else if (e.name.toLowerCase().endsWith(".html")) {
      const base = path.basename(e.name, path.extname(e.name));
      addTool(base, `/assets/tools/${e.name}`, readJSON(path.join(tdir, `${base}.json`)), "");
    }
  }
}
fs.writeFileSync(path.join(root, "data/tools.generated.json"), JSON.stringify(tools, null, 2));

// ---------- CHECK the hand-written data files: changelog.json and tools.json ----------
// There is nothing to auto-detect for these, but a typo in either one makes the page quietly show
// nothing ("No updates yet", empty Tools list). So parse them here and fail the build with a clear message.
const problems = [];
const checkFile = (name, fn) => {
  const p = path.join(root, "data", name);
  if (!fs.existsSync(p)) return null;
  let data;
  try { data = JSON.parse(fs.readFileSync(p, "utf8")); }
  catch (err) { problems.push(`${name}: not valid JSON (${err.message})`); return null; }
  if (!Array.isArray(data)) { problems.push(`${name}: must be a list ( [ ... ] )`); return null; }
  data.forEach((x, i) => fn(x, i));
  return data;
};

const CHANGE_TYPES = ["new", "improved", "fixed", "removed"];
const changelog = checkFile("changelog.json", (e, i) => {
  const at = `changelog.json entry #${i + 1}${e && e.version ? ` (${e.version})` : ""}`;
  if (!e || !e.version) problems.push(`${at}: missing "version"`);
  if (!Array.isArray(e && e.changes) || !e.changes.length) problems.push(`${at}: needs a non-empty "changes" list`);
  else e.changes.forEach((c, j) => {
    if (!c || !c.text) problems.push(`${at}, change #${j + 1}: missing "text"`);
    else if (c.type && !CHANGE_TYPES.includes(c.type)) problems.push(`${at}, change #${j + 1}: unknown type "${c.type}" (use ${CHANGE_TYPES.join(", ")})`);
  });
});

const seenTitles = new Set();
const manualTools = checkFile("tools.json", (t, i) => {
  const at = `tools.json entry #${i + 1}${t && t.title ? ` (${t.title})` : ""}`;
  if (!t || !t.url) { problems.push(`${at}: missing "url"`); return; }
  if (t.url.startsWith("/") && !fs.existsSync(path.join(root, decodeURI(t.url.split(/[?#]/)[0])))) problems.push(`${at}: file not found for url ${t.url}`);
  const key = (t.title || "").toLowerCase();
  if (key && seenTitles.has(key)) problems.push(`${at}: duplicate title`);
  seenTitles.add(key);
});

if (problems.length) {
  console.error("✗ data file problems:\n  - " + problems.join("\n  - "));
  process.exit(1);
}

console.log(`✓ found ${games.length} game folder(s), ${movies.length} movie file(s), ${tools.length} tool folder(s)`);
console.log(`✓ checked changelog.json (${changelog ? changelog.length : 0} entries, latest: ${(changelog && changelog[0] && changelog[0].version) || "none"}) and tools.json (${manualTools ? manualTools.length : 0} entries)`);