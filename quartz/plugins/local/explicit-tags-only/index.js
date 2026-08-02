// Transformer plugin. obsidian-flavored-markdown's `parseTags` option (order
// 30) merges every inline `#hashtag` found in the body directly into
// `file.data.frontmatter.tags` — useful for tag-index registration and
// in-body tag links, but it leaves no way to tell explicitly-declared
// frontmatter tags apart from body-derived ones afterward. This plugin runs
// before that merge (note-properties, order 5, is what actually parses
// frontmatter into `file.data.frontmatter` in the first place) and snapshots
// the tags array as declared, so components that should only show explicit
// tags (e.g. content-meta-en) have something clean to read.
const ExplicitTagsOnly = (_opts) => {
  return {
    name: "ExplicitTagsOnly",
    markdownPlugins(_ctx) {
      return [
        () => (_tree, file) => {
          const frontmatter = file.data.frontmatter
          file.data.explicitTags = frontmatter && Array.isArray(frontmatter.tags) ? [...frontmatter.tags] : []
        },
      ]
    },
  }
}

export default ExplicitTagsOnly
