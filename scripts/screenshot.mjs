#!/usr/bin/env node
// Puppeteer-based screenshot helper for visually verifying site changes
// against a running `npx quartz build --serve` instance.
//
// Usage:
//   node scripts/screenshot.mjs <url> <outputFile> [options]
//
// Options:
//   --width=<px>       viewport width (default 1280)
//   --height=<px>       viewport height (default 800)
//   --full-page         capture the entire scrollable page, not just the viewport
//   --dark               emulate prefers-color-scheme: dark
//   --selector=<css>    wait for this selector before capturing
//
// Examples:
//   node scripts/screenshot.mjs http://localhost:8080/tala shots/tala.png --full-page
//   node scripts/screenshot.mjs http://localhost:8080/tala/walking shots/walking-mobile.png --width=390 --height=844 --full-page

import puppeteer from "puppeteer"
import { mkdir } from "fs/promises"
import { dirname } from "path"

function parseArgs(argv) {
  const [url, outputFile, ...rest] = argv
  if (!url || !outputFile) {
    console.error("Usage: node scripts/screenshot.mjs <url> <outputFile> [options]")
    process.exit(1)
  }
  const opts = {
    width: 1280,
    height: 800,
    fullPage: false,
    dark: false,
    selector: null,
  }
  for (const arg of rest) {
    if (arg === "--full-page") opts.fullPage = true
    else if (arg === "--dark") opts.dark = true
    else if (arg.startsWith("--width=")) opts.width = Number(arg.split("=")[1])
    else if (arg.startsWith("--height=")) opts.height = Number(arg.split("=")[1])
    else if (arg.startsWith("--selector=")) opts.selector = arg.split("=")[1]
  }
  return { url, outputFile, opts }
}

async function main() {
  const { url, outputFile, opts } = parseArgs(process.argv.slice(2))

  await mkdir(dirname(outputFile), { recursive: true })

  // --no-sandbox: this sandboxed dev environment doesn't grant the
  // permissions Chrome's sandbox needs, and without this flag `goto()`
  // hangs until the navigation timeout instead of failing fast.
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: opts.width, height: opts.height })
    if (opts.dark) {
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }])
    }
    // Not "networkidle0": Quartz's dev server keeps a long-lived
    // connection open for hot-reload, which networkidle0 would wait on
    // forever.
    await page.goto(url, { waitUntil: "load" })
    if (opts.selector) {
      await page.waitForSelector(opts.selector, { timeout: 10000 })
    }
    await page.screenshot({ path: outputFile, fullPage: opts.fullPage })
    console.log(`Saved screenshot to ${outputFile}`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
