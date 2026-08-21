#!/usr/bin/env bun
import { $ } from "bun"
import { fileURLToPath } from "url"
import path from "path"

const rootDir = fileURLToPath(new URL("../../..", import.meta.url))
const distDir = path.join(fileURLToPath(new URL("..", import.meta.url)), "dist")
const outDir = path.join(distDir, "downloads")

const webPublicDownloads = path.join(rootDir, "packages", "web", "public", "downloads")

await $`mkdir -p ${outDir}`
await $`mkdir -p ${webPublicDownloads}`

const entries = await Array.fromAsync(new Bun.Glob("*").scan({ cwd: distDir, onlyFiles: false }))

for (const name of entries) {
  if (name === "downloads" || !name.startsWith("ladizcode-")) continue
  const binDir = path.join(distDir, name, "bin")
  const zipFile = path.join(outDir, `${name}.zip`)
  
  console.log(`Packing ${name} -> ${name}.zip`)
  if (process.platform === "win32") {
    await $`powershell -Command "Compress-Archive -Path '${binDir}\\ladizcode*' -DestinationPath '${zipFile}' -Force"`
  } else {
    await $`zip -r ${zipFile} ladizcode*`.cwd(binDir)
  }

  // Copy to public/downloads for web package
  await Bun.write(path.join(webPublicDownloads, `${name}.zip`), Bun.file(zipFile))
}

console.log(`\n==================================================`)
console.log(` Berhasil! Semua file .zip rilis ada di:`)
console.log(` 1. ${outDir}`)
console.log(` 2. ${webPublicDownloads}`)
console.log(`==================================================`)
