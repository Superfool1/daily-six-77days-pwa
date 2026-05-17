import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectDir = process.cwd();
const distDir = path.join(projectDir, "dist");
const assetsDir = path.join(distDir, "assets");
const swPath = path.join(distDir, "service-worker.js");

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(fullPath);
      }
      return fullPath;
    }),
  );
  return files.flat();
}

async function main() {
  const assetFiles = await listFiles(assetsDir);
  const assetUrls = assetFiles
    .map((file) => `./${path.relative(distDir, file).replaceAll(path.sep, "/")}`)
    .sort();

  const source = await readFile(swPath, "utf8");
  const updated = source.replace("const BUILD_ASSETS = [];", `const BUILD_ASSETS = ${JSON.stringify(assetUrls, null, 2)};`);
  await writeFile(swPath, updated, "utf8");

  console.log(`Injected ${assetUrls.length} build assets into dist/service-worker.js`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
