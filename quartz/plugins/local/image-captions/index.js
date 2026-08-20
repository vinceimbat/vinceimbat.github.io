// Transformer plugin. Obsidian's own image-embed syntax already routes the
// `|text` part of `![[image.jpg|text]]` into the rendered <img>'s `alt`
// attribute (see @quartz-community/obsidian-flavored-markdown's
// wikilinkImageEmbedRegex) — that happens regardless of this plugin. What's
// missing is showing that text as a visible caption, the way Obsidian's own
// "Image Captions" plugin does.
//
// This only ever touches <img> elements, so `[[note|Display Text]]` links to
// other pages — which render as <a>, never <img> — can't be affected by this
// no matter how many of those exist elsewhere in a document.
//
// Runs as an htmlPlugins (hast-stage) step, after obsidian-flavored-markdown
// has already turned wikilink embeds into real <img> elements.
import { visit } from "unist-util-visit"

const IMAGE_SRC_RE = /\.(jpe?g|png|gif|webp|bmp|jxl)(\?.*)?$/i

const STYLE = `
figure.image-caption-figure {
  margin: 1rem 0;
}
figure.image-caption-figure > figcaption {
  margin-top: 0.5rem;
  text-align: center;
  color: var(--gray);
  font-size: 0.9rem;
}
`

const ImageCaptions = (_opts) => {
  return {
    name: "ImageCaptions",
    htmlPlugins(_ctx) {
      return [
        () => (tree) => {
          visit(tree, "element", (node) => {
            if (node.tagName !== "p") return

            // Only convert a <p> that contains nothing but the image —
            // an image mixed inline with other running text is left alone,
            // since there's no single paragraph boundary to safely turn
            // into a <figure> without splitting the surrounding text.
            const meaningful = (node.children || []).filter(
              (child) => !(child.type === "text" && child.value.trim() === ""),
            )
            if (meaningful.length !== 1) return

            const img = meaningful[0]
            if (img.type !== "element" || img.tagName !== "img") return

            const alt = img.properties?.alt
            if (typeof alt !== "string" || alt.trim() === "") return

            const src = img.properties?.src
            if (typeof src !== "string" || !IMAGE_SRC_RE.test(src)) return

            node.tagName = "figure"
            node.properties = { className: ["image-caption-figure"] }
            node.children = [
              img,
              {
                type: "element",
                tagName: "figcaption",
                properties: {},
                children: [{ type: "text", value: alt }],
              },
            ]
          })
        },
      ]
    },
    externalResources() {
      return {
        css: [{ content: STYLE, inline: true }],
      }
    },
  }
}

export default ImageCaptions
