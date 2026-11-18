// Copies Scramjet, BareMux and the transports into /public so Vercel serves them as static files.
import fs from "node:fs";
import path from "node:path";

const nm = (pkg) => path.resolve("node_modules", pkg);

// Try the package's exported path helper first; fall back to its dist folder.
async function find(pkg, importPath, exportName) {
  try {
    const mod = await import(importPath);
    if (mod[exportName] && fs.existsSync(mod[exportName])) return mod[exportName];
  } catch {}
  const dist = path.join(nm(pkg), "dist");
  return fs.existsSync(dist) ? dist : null;
}

const targets = [
  { name: "scram",   required: true,  src: await find("@mercuryworkshop/scramjet", "@mercuryworkshop/scramjet/path", "scramjetPath") },
  { name: "baremux", required: true,  src: await find("@mercuryworkshop/bare-mux", "@mercuryworkshop/bare-mux/node", "baremuxPath") },
  { name: "libcurl", required: true,  src: await find("@mercuryworkshop/libcurl-transport", "@mercuryworkshop/libcurl-transport", "libcurlPath") },
  { name: "epoxy",   required: false, src: await find("@mercuryworkshop/epoxy-transport", "@mercuryworkshop/epoxy-transport", "epoxyPath") },
];

let failed = false;
for (const { name, required, src } of targets) {
  if (!src) {
    console.log(`${required ? "✗ MISSING" : "! skipped"} ${name}`);
    if (required) failed = true;
    continue;
  }
  const dest = path.resolve("public", name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`✓ copied ${name}  (${src})`);
}
if (failed) process.exit(1);