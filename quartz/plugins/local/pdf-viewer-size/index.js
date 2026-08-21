// Transformer plugin. obsidian-flavored-markdown (order 30) renders
// `![[file.pdf]]` as `<iframe src="..." class="pdf"></iframe>`, and base.scss
// sizes that iframe with a flat `aspect-ratio: 16/9` — the same rule used for
// YouTube embeds. That's fine for video, but wrong for a PDF page, which is
// usually portrait: a Legal-size page (612×1008pt) forced into 16:9 shows as
// a short, cropped strip.
//
// This plugin runs BEFORE obsidian-flavored-markdown (order 28 < 30) and
// fully handles `.pdf` wikilink embeds itself: it finds the actual file on
// disk, reads its first page's `/MediaBox` (the plain, uncompressed way a
// PDF records its own page size — no dependency needed), and emits the same
// kind of `<iframe class="pdf">` but with an inline `aspect-ratio` matching
// that PDF's real page shape. Once a node is replaced with a plain "html"
// node here, obsidian-flavored-markdown's own wikilink visitor no longer
// matches it (it only matches nodes still typed "wikilink"), so there's no
// double handling.
//
// The generated src is left as the same slug-form path
// obsidian-flavored-markdown itself would produce; the later internal-link
// resolution pass (crawl-links) rewrites `iframe[src]` generically by
// tagName, regardless of which plugin produced the element, so it resolves
// correctly either way.
import fs from "fs"
import path from "path"
import { slugifyFilePath } from "@quartz-community/utils/path"

const MEDIABOX_RE = /\/MediaBox\s*\[\s*([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s*\]/
// Used only when a PDF's MediaBox can't be found in the raw bytes (e.g. it
// lives inside a compressed object stream) — a plain US Letter portrait
// shape reads as "a document," unlike the 16:9 video default it replaces.
const FALLBACK_ASPECT_RATIO = 8.5 / 11

let pdfIndexCache = null

function buildPdfIndex(rootDir) {
  const index = new Map()
  function walk(dir) {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        index.set(entry.name.toLowerCase(), full)
      }
    }
  }
  walk(rootDir)
  return index
}

function readPdfAspectRatio(absPath) {
  try {
    const buf = fs.readFileSync(absPath)
    // PDFs are byte-oriented, not text-encoded, but /MediaBox is always
    // written as plain ASCII operators — latin1 keeps each byte as one
    // char (unlike utf-8, which would corrupt sequences on non-ASCII
    // bytes elsewhere in the file) so the regex still finds it.
    const text = buf.toString("latin1")
    const match = MEDIABOX_RE.exec(text)
    if (!match) return null
    const [x1, y1, x2, y2] = match.slice(1, 5).map(Number)
    const width = Math.abs(x2 - x1)
    const height = Math.abs(y2 - y1)
    if (!width || !height) return null
    return width / height
  } catch {
    return null
  }
}

const PdfViewerSize = (_opts) => {
  return {
    name: "PdfViewerSize",
    markdownPlugins(ctx) {
      return [
        () => (tree, _file) => {
          function walk(node, parent, index) {
            if (
              node.type === "wikilink" &&
              node.embedded &&
              typeof node.path === "string" &&
              path.extname(node.path.trim()).toLowerCase() === ".pdf" &&
              parent &&
              typeof index === "number"
            ) {
              const fp = node.path.trim()
              const url = slugifyFilePath(fp)

              if (!pdfIndexCache) {
                pdfIndexCache = buildPdfIndex(ctx.argv.directory)
              }
              const absPath = pdfIndexCache.get(path.basename(fp).toLowerCase())
              const ratio = (absPath && readPdfAspectRatio(absPath)) || FALLBACK_ASPECT_RATIO

              parent.children[index] = {
                type: "html",
                value: `<iframe src="${url}" class="pdf" style="aspect-ratio: ${ratio};"></iframe>`,
              }
              return
            }
            const children = node.children
            if (children) {
              for (let i = 0; i < children.length; i++) {
                walk(children[i], node, i)
              }
            }
          }
          walk(tree, null, null)
        },
      ]
    },
  }
}

export default PdfViewerSize
