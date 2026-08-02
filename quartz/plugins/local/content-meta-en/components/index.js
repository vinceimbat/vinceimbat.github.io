import { h } from "preact"
import { resolveRelative, slugTag } from "@quartz-community/utils/path"
import { classNames } from "@quartz-community/utils/lang"
import { formatDate } from "@quartz-community/utils/date"

// Plain CSS (not SCSS) — this file is imported dynamically at runtime by the
// Quartz plugin loader, outside the esbuild/sass pipeline that handles the
// core component tree, so no .scss import here.
const STYLE = `
.content-meta-en {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  column-gap: 2.5rem;
  row-gap: 0.75rem;
  list-style: none;
  margin: 1.5rem 0 2rem 0;
  padding: 1.1rem 0;
  position: relative;
}
/* Full-bleed top/bottom rules (edge to edge of the viewport, not just this
   box) instead of a plain border: the tags/dates grid itself stays within
   the normal reading column, but the lines above and below it — separating
   title from front matter, and front matter from the article body —
   stretch the full screen width. Centering on the viewport (not this
   element, which may itself be off-center within a wider ancestor) via the
   same left: 50%; transform: translateX(-50%) trick used by the top bar. */
.content-meta-en::before,
.content-meta-en::after {
  content: "";
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100vw;
  height: 1px;
  background-color: var(--lightgray);
}
.content-meta-en::before {
  top: 0;
}
.content-meta-en::after {
  bottom: 0;
}
.content-meta-en > li {
  margin: 0;
  padding: 0;
}
.content-meta-en .meta-label {
  font-family: var(--codeFont);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gray);
  margin: 0 0 0.4rem 0;
}
.content-meta-en .meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.content-meta-en .tag-link {
  display: inline-block;
  border: 1px solid var(--lightgray);
  border-radius: 4px;
  padding: 0.1rem 0.55rem;
  font-size: 0.85rem;
  color: var(--darkgray);
  background-color: transparent;
  text-decoration: none;
  transition: border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
/* Deliberately override background-color/text-decoration too, not just
   border-color/color: the global a.internal:hover rule in base.scss sets
   all four properties (dark background, light text) for the site-wide
   reverse-hover effect, and would otherwise still win on whichever
   properties this rule leaves undeclared, even though this selector is
   more specific overall. Left undeclared before, that meant the dark
   hover background leaked through here, landing --secondary text on a
   near-black box — unreadable. Tags get a plain grow effect instead:
   no color inversion, so the text always stays legible. */
.content-meta-en .tag-link:hover {
  border-color: var(--secondary);
  color: var(--secondary);
  background-color: transparent;
  text-decoration: none;
  transform: scale(1.08);
}
.content-meta-en .meta-info {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.content-meta-en .meta-row time,
.content-meta-en .meta-row span {
  font-style: italic;
  color: var(--dark);
}
/* Vertical divider centered in the 2.5rem column-gap: a negative margin
   pulls this column's edge halfway back into the gap (1.25rem, i.e. half
   of the 2.5rem gap) while an equal padding-left keeps the column's actual
   content sitting where it was. The line itself is an absolutely
   positioned pseudo-element rather than a border, so its height can reach
   past this grid item's own (row-height-stretched) box all the way to
   content-meta-en's padding edges — top: -1.1rem/bottom: -1.1rem exactly
   cancels out content-meta-en's own 1.1rem vertical padding, landing the
   line flush against the full-bleed rules above and below. */
.content-meta-en .meta-col--info {
  position: relative;
  margin-left: -1.25rem;
  padding-left: 1.25rem;
}
.content-meta-en .meta-col--info::before {
  content: "";
  position: absolute;
  top: -1.1rem;
  bottom: -1.1rem;
  left: 0;
  width: 1px;
  background-color: var(--lightgray);
}
@media (max-width: 600px) {
  .content-meta-en {
    grid-template-columns: 1fr;
    row-gap: 1rem;
  }
  .content-meta-en .meta-col--info {
    margin-left: 0;
    padding-left: 0;
  }
  .content-meta-en .meta-col--info::before {
    content: none;
  }
}
`

function countWords(text) {
  if (!text) return 0
  const matches = text.trim().match(/\S+/g)
  return matches ? matches.length : 0
}

const ContentMetaEnComponent = (props) => {
  const cfg = props.cfg
  const fileData = props.fileData
  const displayClass = props.displayClass
  const locale = (cfg && cfg.locale) || "en-US"
  const frontmatter = fileData.frontmatter || {}
  // explicitTags (set by the explicit-tags-only transformer, before
  // obsidian-flavored-markdown's parseTags merges in body #hashtags) holds
  // only what was actually declared in frontmatter — frontmatter.tags
  // itself is body-contaminated by this point in the pipeline.
  const tags = Array.isArray(fileData.explicitTags)
    ? fileData.explicitTags
    : Array.isArray(frontmatter.tags)
      ? frontmatter.tags
      : []
  const dates = fileData.dates || {}
  const created = dates.created
  const modified = dates.modified
  const words = countWords(fileData.text)
  const minutes = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0

  const columns = []

  if (tags.length > 0) {
    columns.push(
      h("li", { class: "meta-col meta-col--tags" }, [
        h("div", { class: "meta-label" }, "tags"),
        h(
          "div",
          { class: "meta-tags" },
          tags.map((tag) => {
            const slug = slugTag(tag)
            return h(
              "a",
              {
                class: "internal tag-link",
                href: resolveRelative(fileData.slug, `tags/${slug}`),
                "data-slug": `tags/${slug}`,
              },
              tag,
            )
          }),
        ),
      ]),
    )
  }

  const infoRows = []
  if (created) {
    infoRows.push(
      h("div", { class: "meta-row" }, [
        h("div", { class: "meta-label" }, "published"),
        h("time", { dateTime: created.toISOString() }, formatDate(created, locale)),
      ]),
    )
  }
  if (modified) {
    infoRows.push(
      h("div", { class: "meta-row" }, [
        h("div", { class: "meta-label" }, "modified"),
        h("time", { dateTime: modified.toISOString() }, formatDate(modified, locale)),
      ]),
    )
  }
  if (words > 0) {
    infoRows.push(
      h("div", { class: "meta-row" }, [
        h("div", { class: "meta-label" }, "duration"),
        h("span", null, `${minutes} min read (${words} words)`),
      ]),
    )
  }

  if (infoRows.length > 0) {
    columns.push(h("li", { class: "meta-col meta-col--info" }, h("div", { class: "meta-info" }, infoRows)))
  }

  if (columns.length === 0) {
    return null
  }

  return h("ul", { class: classNames(displayClass, "content-meta-en") }, columns)
}

ContentMetaEnComponent.css = STYLE

export const ContentMetaEn = () => ContentMetaEnComponent
