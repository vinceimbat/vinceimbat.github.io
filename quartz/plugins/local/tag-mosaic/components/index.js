import { h } from "preact"
import { getAllSegmentPrefixes, resolveRelative, slugTag } from "@quartz-community/utils/path"

const STYLE = `
.tag-mosaic {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(84px, auto);
  grid-auto-flow: dense;
  gap: 1px;
  background: var(--dark);
  border: 1px solid var(--dark);
  margin-bottom: 1rem;
}
.tag-mosaic .tag-tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.75rem 0.85rem;
  background: var(--light);
  text-decoration: none;
  color: var(--dark);
  transition: background 0.15s ease;
}
.tag-mosaic .tag-tile:hover {
  background: var(--highlight);
}
.tag-mosaic .tag-tile--large {
  grid-column: span 2;
}
.tag-mosaic .tag-tile .tag-tile-name {
  font-family: var(--headerFont);
  font-size: 0.95rem;
  line-height: 1.25;
  word-break: break-word;
}
.tag-mosaic .tag-tile .tag-tile-count {
  font-family: var(--codeFont);
  font-size: 0.7rem;
  letter-spacing: 0.03em;
  color: var(--gray);
  text-transform: uppercase;
  margin-top: 0.5rem;
}
`

// CSS Grid's row-sizing algorithm, for an item spanning multiple rows
// (the list, which needs to be very tall) alongside other single-row
// items in the same column (the mosaic, description, item count), does
// not keep those shorter rows compact — it distributes the spanning
// item's height need across all the rows it touches, inflating rows
// that would otherwise be short by tens of thousands of pixels (tested:
// grid-template-rows: min-content and align-self: start both fail to
// prevent this). Rather than fight the grid algorithm, this script moves
// the description/item-count DOM nodes to be actual children of the
// sidebar (after the mosaic), so from the grid's perspective there's only
// one item in that column and its height is simply its own content.
const RELOCATE_SCRIPT = `
function quartzTagMosaicRelocate() {
  const mosaic = document.querySelector(".sidebar.right .tag-mosaic")
  if (!mosaic) return
  const sidebar = mosaic.parentElement
  sidebar.classList.add("popover-hint")
  const description = document.querySelector(".center > .popover-hint > article")
  const count = document.querySelector(".center > .popover-hint > .page-listing > p")
  if (description && description.parentElement !== sidebar) sidebar.appendChild(description)
  if (count && count.parentElement !== sidebar) sidebar.appendChild(count)
}
document.addEventListener("nav", quartzTagMosaicRelocate)
document.addEventListener("render", quartzTagMosaicRelocate)
`

function isDescendant(candidateSlug, folderSlug) {
  return candidateSlug === folderSlug || candidateSlug.startsWith(`${folderSlug}/`)
}

const TagMosaicComponent = (props) => {
  const fileData = props.fileData
  const allFiles = props.allFiles || []
  const folderSlug = fileData.slug ? fileData.slug.replace(/\/index$/, "") : ""

  let scoped = allFiles
  if (folderSlug && folderSlug !== "tags") {
    const inFolder = allFiles.filter((f) => f.slug && isDescendant(f.slug, folderSlug))
    if (inFolder.length > 0) scoped = inFolder
  }

  const counts = new Map()
  for (const file of scoped) {
    const tags = Array.isArray(file.frontmatter && file.frontmatter.tags) ? file.frontmatter.tags : []
    const expanded = new Set()
    for (const tag of tags) {
      for (const prefix of getAllSegmentPrefixes(tag)) expanded.add(prefix)
    }
    for (const tag of expanded) {
      counts.set(tag, (counts.get(tag) || 0) + 1)
    }
  }

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])

  if (entries.length === 0) {
    return null
  }

  const tiles = entries.map(([tag, count], index) => {
    const slug = slugTag(tag)
    const large = index < 2
    return h(
      "a",
      {
        class: `tag-tile${large ? " tag-tile--large" : ""}`,
        href: resolveRelative(fileData.slug, `tags/${slug}`),
        "data-slug": `tags/${slug}`,
      },
      [
        h("span", { class: "tag-tile-name" }, tag),
        h("span", { class: "tag-tile-count" }, count === 1 ? "1 item" : `${count} items`),
      ],
    )
  })

  return h("div", { class: "tag-mosaic" }, tiles)
}

TagMosaicComponent.css = STYLE
TagMosaicComponent.afterDOMLoaded = RELOCATE_SCRIPT

export const TagMosaic = () => TagMosaicComponent
