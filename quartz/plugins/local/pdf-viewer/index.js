// Transformer plugin. Replaces `![[file.pdf]]` with a custom PDF.js-based
// viewer instead of a bare `<iframe src="file.pdf">`.
//
// The iframe approach (Quartz's default, and this plugin's own earlier
// version) works fine on desktop, where the browser's native PDF plugin
// supplies its own toolbar, zoom, and page navigation inside the iframe.
// Mobile Safari and Chrome don't do that: embedded in an iframe, their PDF
// handling shows only a static render of page one, with no toolbar, no
// pinch, no way to reach page two. There's no CSS fix for that — it's a
// missing browser capability, not a sizing bug — so this renders every
// page itself onto a <canvas> (via PDF.js, loaded from a CDN only when a
// PDF embed is actually on the page) with the same prev/next/page-count
// controls on every screen size, plus swipe-to-turn on touch.
//
// Runs before obsidian-flavored-markdown (order 28 < 30) and fully replaces
// its `.pdf` wikilink handling, same as this plugin's previous iframe-only
// version did.
import fs from "fs"
import path from "path"
import { slugifyFilePath, resolveRelative } from "@quartz-community/utils/path"

const PDFJS_VERSION = "6.2.108"
const PDFJS_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`

const MEDIABOX_RE = /\/MediaBox\s*\[\s*([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s*\]/
// Only used to reserve layout space before PDF.js has loaded and measured
// the real page — a plain US Letter portrait shape is a reasonable guess
// for the rare PDF whose MediaBox can't be read from the raw bytes (e.g. a
// compressed object stream).
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
    // latin1 keeps each byte as one char (unlike utf-8, which would corrupt
    // sequences on non-ASCII bytes elsewhere in the file) so the regex
    // still finds the plain-ASCII /MediaBox operator.
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

const STYLE = `
.pdf-viewer {
  position: relative;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 5px;
  overflow: hidden;
}
.pdf-viewer-canvas-wrap {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  background: var(--lightgray);
  touch-action: pan-y;
}
.pdf-viewer-canvas-wrap canvas {
  display: block;
  max-width: 100%;
  height: auto;
}
.pdf-viewer-status {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray);
  font-family: var(--codeFont);
  font-size: 0.8rem;
  text-align: center;
  padding: 1rem;
}
.pdf-viewer-status[hidden] {
  display: none;
}
.pdf-viewer-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.6rem;
  border-top: 1px solid var(--lightgray);
}
.pdf-viewer-controls button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.75rem;
  min-height: 2.75rem;
  border: 1px solid var(--lightgray);
  background: var(--light);
  color: var(--dark);
  border-radius: 5px;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
}
.pdf-viewer-controls button:hover:not(:disabled) {
  border-color: var(--secondary);
  color: var(--secondary);
}
.pdf-viewer-controls button:active:not(:disabled) {
  transform: scale(0.94);
}
.pdf-viewer-controls button:disabled {
  opacity: 0.35;
  cursor: default;
}
.pdf-viewer-page-count {
  flex: 1;
  text-align: center;
  font-family: var(--codeFont);
  font-size: 0.78rem;
  color: var(--gray);
  letter-spacing: 0.02em;
}
.pdf-viewer-download {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.75rem;
  min-height: 2.75rem;
  border-radius: 5px;
  color: var(--gray);
  text-decoration: none;
  font-family: var(--codeFont);
  font-size: 0.75rem;
  border: 1px solid transparent;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.pdf-viewer-download:hover {
  color: var(--secondary);
  border-color: var(--lightgray);
  background-color: transparent;
}
.pdf-viewer-error {
  padding: 1.5rem;
  text-align: center;
  color: var(--gray);
  font-size: 0.85rem;
}
.pdf-viewer-error a {
  color: var(--secondary);
}
@media (prefers-reduced-motion: reduce) {
  .pdf-viewer-controls button {
    transition: none;
  }
}
`

const SCRIPT = `
(function () {
  var PDFJS_URL = ${JSON.stringify(PDFJS_URL)};
  var PDFJS_WORKER_URL = ${JSON.stringify(PDFJS_WORKER_URL)};

  var pdfjsPromise = null;
  function loadPdfjs() {
    if (!pdfjsPromise) {
      pdfjsPromise = import(PDFJS_URL).then(function (mod) {
        mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        return mod;
      });
    }
    return pdfjsPromise;
  }

  function initViewer(container) {
    if (container.dataset.pdfViewerBound) return;
    container.dataset.pdfViewerBound = "true";

    var src = container.getAttribute("data-pdf-src");
    if (!src) return;

    var canvasWrap = container.querySelector(".pdf-viewer-canvas-wrap");
    var canvas = container.querySelector("canvas");
    var status = container.querySelector(".pdf-viewer-status");
    var prevBtn = container.querySelector(".pdf-viewer-prev");
    var nextBtn = container.querySelector(".pdf-viewer-next");
    var pageCount = container.querySelector(".pdf-viewer-page-count");

    var pdfDoc = null;
    var currentPage = 1;
    var totalPages = 0;
    var renderToken = 0;

    function setStatus(text) {
      if (!text) {
        status.hidden = true;
      } else {
        status.hidden = false;
        status.textContent = text;
      }
    }

    function updateControls() {
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
      pageCount.textContent = currentPage + " / " + totalPages;
    }

    function renderPage(num) {
      var token = ++renderToken;
      return pdfDoc.getPage(num).then(function (page) {
        if (token !== renderToken) return;
        var dpr = window.devicePixelRatio || 1;
        var unscaled = page.getViewport({ scale: 1 });
        var fitScale = canvasWrap.clientWidth / unscaled.width;
        var viewport = page.getViewport({ scale: fitScale * dpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = (viewport.width / dpr) + "px";
        canvas.style.height = (viewport.height / dpr) + "px";
        var ctx = canvas.getContext("2d");
        return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
          if (token !== renderToken) return;
          setStatus(null);
        });
      });
    }

    function goToPage(num) {
      if (!pdfDoc) return;
      num = Math.max(1, Math.min(totalPages, num));
      currentPage = num;
      updateControls();
      renderPage(currentPage);
    }

    prevBtn.addEventListener("click", function () {
      goToPage(currentPage - 1);
    });
    nextBtn.addEventListener("click", function () {
      goToPage(currentPage + 1);
    });

    container.setAttribute("tabindex", "0");
    container.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") goToPage(currentPage - 1);
      if (e.key === "ArrowRight") goToPage(currentPage + 1);
    });

    var touchStartX = null;
    canvasWrap.addEventListener("touchstart", function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    canvasWrap.addEventListener("touchend", function (e) {
      if (touchStartX === null) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) goToPage(currentPage + 1);
      else goToPage(currentPage - 1);
    }, { passive: true });

    var resizeRaf = null;
    window.addEventListener("resize", function () {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(function () {
        if (pdfDoc) renderPage(currentPage);
      });
    });

    setStatus("Loading PDF…");
    loadPdfjs()
      .then(function (pdfjsLib) {
        return pdfjsLib.getDocument({ url: src }).promise;
      })
      .then(function (doc) {
        pdfDoc = doc;
        totalPages = doc.numPages;
        updateControls();
        return renderPage(currentPage);
      })
      .catch(function (err) {
        console.error("pdf-viewer: failed to load", src, err);
        container.innerHTML =
          '<div class="pdf-viewer-error">Couldn\\'t load this PDF here. <a href="' +
          src +
          '" target="_blank" rel="noopener">Open it directly</a> instead.</div>';
      });
  }

  function initAll() {
    var containers = document.querySelectorAll(".pdf-viewer[data-pdf-src]");
    containers.forEach(initViewer);
  }

  document.addEventListener("nav", initAll);
})();
`

const PdfViewer = (_opts) => {
  return {
    name: "PdfViewer",
    markdownPlugins(ctx) {
      return [
        () => (tree, file) => {
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
              // Resolved here directly (not left for the later internal-link
              // pass, which only rewrites src/href on img/video/audio/iframe
              // tags — this plugin's URL lives in a data-* attribute its own
              // client script reads, which that pass never touches). Since
              // `fp` is whatever the user typed in the wikilink — often just
              // a bare filename, relying on Obsidian's shortest-path lookup
              // to find it wherever it actually lives — slugifying it alone
              // only gives the bare filename back with no folder. Matching
              // against ctx.allSlugs (every file in the vault, not just
              // markdown pages) reproduces that same shortest-path lookup.
              const targetSlug = slugifyFilePath(fp)
              const fullSlug =
                ctx.allSlugs.find(
                  (slug) => slug === targetSlug || slug.endsWith(`/${targetSlug}`),
                ) ?? targetSlug
              const url = resolveRelative(file.data.slug, fullSlug)

              if (!pdfIndexCache) {
                pdfIndexCache = buildPdfIndex(ctx.argv.directory)
              }
              const absPath = pdfIndexCache.get(path.basename(fp).toLowerCase())
              const ratio = (absPath && readPdfAspectRatio(absPath)) || FALLBACK_ASPECT_RATIO

              parent.children[index] = {
                type: "html",
                value: `<div class="pdf-viewer" data-pdf-src="${url}">
  <div class="pdf-viewer-canvas-wrap" style="aspect-ratio: ${ratio};">
    <canvas></canvas>
    <div class="pdf-viewer-status">Loading PDF…</div>
  </div>
  <div class="pdf-viewer-controls">
    <button type="button" class="pdf-viewer-prev" aria-label="Previous page" disabled>‹</button>
    <span class="pdf-viewer-page-count"></span>
    <button type="button" class="pdf-viewer-next" aria-label="Next page" disabled>›</button>
    <a class="pdf-viewer-download" href="${fullSlug}" download data-router-ignore>Download</a>
  </div>
  <noscript><div class="pdf-viewer-error">Enable JavaScript to read this PDF here, or <a href="${fullSlug}">open it directly</a>.</div></noscript>
</div>`,
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
    externalResources() {
      return {
        css: [{ content: STYLE, inline: true }],
        js: [{ script: SCRIPT, contentType: "inline", loadTime: "afterDOMReady" }],
      }
    },
  }
}

export default PdfViewer
