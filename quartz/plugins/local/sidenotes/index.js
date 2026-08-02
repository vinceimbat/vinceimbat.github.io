// Transformer plugin. Parses `{{sidenotes[label]: content}}` (raw text, run
// before the markdown parser sees it) into three tags sitting side by side
// in the flow: the visible label as a link, a mobile-only toggle button,
// and the note body itself. Because this happens at the textTransform
// stage — before Commonmark parsing, before wikilinks are resolved — the
// note content is still literal markdown text by the time it reaches the
// parser, so wikilinks/emphasis/etc. inside a sidenote are parsed normally
// like anywhere else in the document. `<span>` (not a block tag like
// `<aside>`) is used for the wrapper so it's always treated as inline raw
// HTML regardless of where in a paragraph it lands.
const SIDENOTE_RE = /\{\{sidenotes\[([^\]]+)\]:\s*([\s\S]*?)\}\}/g

const STYLE = `
:root {
  --sidenoteColor: #b5651d;
  --sidenoteBg: rgba(181, 101, 29, 0.12);
}
:root[saved-theme="dark"] {
  --sidenoteColor: #e0a479;
  --sidenoteBg: rgba(224, 164, 121, 0.16);
}

a.sidenote-ref {
  color: var(--sidenoteColor);
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 3px;
  border-color: transparent;
  background-color: transparent;
}
a.sidenote-ref:hover {
  color: var(--sidenoteColor);
  background-color: transparent;
  border-color: transparent;
  text-decoration-style: solid;
}

button.sidenote-toggle {
  display: none;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0 0.15rem;
  margin: 0;
  color: var(--sidenoteColor);
  font-size: 0.7em;
  line-height: 1;
  vertical-align: middle;
}
button.sidenote-toggle::after {
  content: "\\25be";
  display: inline-block;
  transition: transform 0.15s ease;
}
button.sidenote-toggle[aria-expanded="true"]::after {
  transform: rotate(180deg);
}

span.sidenote-content {
  display: block;
  font-family: var(--bodyFont);
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--darkgray);
  border: 1px solid var(--lightgray);
  border-radius: 0;
  padding: 0.7rem 0.9rem;
  box-sizing: border-box;
  transition: border-style 0.1s ease, background-color 0.15s ease;
}
span.sidenote-content:hover {
  border-style: dashed;
  background-color: var(--sidenoteBg);
}
span.sidenote-content a {
  font-size: inherit;
}

/* Margin-note mode only once there's genuinely enough room beside the
   800px reading column to fit a note without crowding it — see the site's
   own $desktop breakpoint (1200px) in variables.scss, which this plugin's
   plain CSS (not run through the SCSS pipeline) can't reference directly,
   so the value is duplicated here.

   Left is the default/priority side. The companion script measures each
   note's natural vertical position and only adds the "--right" modifier
   class when stacking it on the left would land it within MIN_GAP of the
   previous left-side note — i.e. a note only ever moves to the right to
   avoid crowding, never as decoration.

   Positioned absolutely against article (not floated) so every note's
   horizontal offset is measured from the same fixed reference point
   regardless of how deep it's nested — a note inside a list item or
   blockquote sits in a narrower, further-indented box than one in a plain
   paragraph, and float+margin is measured from that immediate box, so
   otherwise notes at different nesting depths would land at different x
   positions instead of lining up. The companion script sets the top
   offset on each note (there's no way to know that from CSS alone) and
   handles vertical stacking/collision the way float+clear used to do
   automatically. */
@media (min-width: 1200px) {
  span.sidenote-content {
    position: absolute;
    width: 160px;
    left: -208px;
    margin: 0;
  }
  span.sidenote-content.sidenote-content--right {
    left: auto;
    right: -208px;
  }
}

.center > article {
  position: relative;
}

@media (max-width: 1199.98px) {
  button.sidenote-toggle {
    display: inline-block;
  }
  span.sidenote-content {
    display: none;
    width: 100%;
    margin: 0.5rem 0;
  }
  span.sidenote-content.is-expanded {
    display: block;
  }
}
`

const SCRIPT = `
(function () {
  if (window.__sidenoteToggleBound) return
  window.__sidenoteToggleBound = true
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".sidenote-toggle")
    if (!btn) return
    const id = btn.getAttribute("data-sidenote-toggle")
    const content = id ? document.getElementById(id) : null
    if (!content) return
    const expanded = btn.getAttribute("aria-expanded") === "true"
    btn.setAttribute("aria-expanded", String(!expanded))
    content.classList.toggle("is-expanded", !expanded)
  })

  var MARGIN_QUERY = "(min-width: 1200px)"
  // Minimum vertical gap two notes on the same side must keep between
  // them; anything closer counts as "would crowd" and the later note
  // moves to the right instead.
  var MIN_GAP = 16

  function layoutSidenotes() {
    var article = document.querySelector(".center > article")
    var notes = Array.prototype.slice.call(document.querySelectorAll(".sidenote-content"))
    // Reset before measuring, so every note's natural position is measured
    // against the same un-shuffled baseline — including on mobile, where
    // none of this applies and the note goes back into normal flow.
    notes.forEach(function (n) {
      n.classList.remove("sidenote-content--right")
      n.style.top = ""
    })
    if (article) article.style.paddingBottom = ""
    if (!notes.length || !article || !window.matchMedia(MARGIN_QUERY).matches) return

    var articleRect = article.getBoundingClientRect()
    var articleTop = articleRect.top + window.scrollY
    // Absolutely positioned notes don't contribute to article's own
    // height (unlike floats, which at least count within a block
    // formatting context) — so without this, a tall note near the end of
    // the body could hang past article's natural bottom edge into the hr
    // and Backlinks that follow as siblings. Track the deepest point any
    // note reaches and pad article out to match.
    var naturalArticleBottom = articleRect.bottom + window.scrollY

    var leftBottom = -Infinity
    var rightBottom = -Infinity
    var maxNoteBottom = -Infinity
    notes.forEach(function (note) {
      var ref = document.querySelector('[data-sidenote-ref="' + note.id + '"]')
      var refRect = (ref || note).getBoundingClientRect()
      var naturalTop = refRect.top + window.scrollY - articleTop
      var side, top
      if (naturalTop >= leftBottom + MIN_GAP) {
        side = "left"
        top = naturalTop
      } else {
        side = "right"
        top = Math.max(naturalTop, rightBottom + MIN_GAP)
      }
      if (side === "right") note.classList.add("sidenote-content--right")
      note.style.top = top + "px"
      var bottom = top + note.offsetHeight
      if (side === "left") leftBottom = bottom
      else rightBottom = bottom
      if (bottom > maxNoteBottom) maxNoteBottom = bottom
    })

    var maxNoteBottomPage = articleTop + maxNoteBottom
    if (maxNoteBottomPage > naturalArticleBottom) {
      article.style.paddingBottom = Math.ceil(maxNoteBottomPage - naturalArticleBottom + 16) + "px"
    }
  }

  var raf = null
  function scheduleLayout() {
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(layoutSidenotes)
  }

  document.addEventListener("nav", scheduleLayout)
  window.addEventListener("resize", scheduleLayout)
  scheduleLayout()
})();
`

const Sidenotes = (_opts) => {
  return {
    name: "Sidenotes",
    textTransform(_ctx, src) {
      let counter = 0
      return src.replace(SIDENOTE_RE, (_match, rawLabel, rawContent) => {
        counter += 1
        const id = `sidenote-${counter}`
        const label = rawLabel.trim()
        const content = rawContent.trim()
        return (
          `<a href="#${id}" class="sidenote-ref" data-sidenote-ref="${id}">${label}</a>` +
          `<button type="button" class="sidenote-toggle" data-sidenote-toggle="${id}" aria-expanded="false" aria-controls="${id}" aria-label="Toggle sidenote"></button>` +
          `<span class="sidenote-content" id="${id}" data-sidenote-content="${id}">${content}</span>`
        )
      })
    },
    externalResources() {
      return {
        css: [{ content: STYLE, inline: true }],
        js: [{ script: SCRIPT, contentType: "inline", loadTime: "afterDOMReady" }],
      }
    },
  }
}

export default Sidenotes
