import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const entries = ["index.html", "styles.css", "auth.css", "app.js", "auth.js"];
const assets = {};
for (const name of entries) {
  assets[name] = Buffer.from(await readFile(new URL(`web/${name}`, root))).toString("base64");
}
const runtime = await readFile(new URL("worker/runtime.js", root), "utf8");
if (!runtime.includes("__ASSETS__")) throw new Error("Worker runtime asset marker is missing.");
await writeFile(new URL("worker/index.js", root), runtime.replace("__ASSETS__", JSON.stringify(assets)));
console.log("Embedded the TomLy browser app in the Site Worker.");
