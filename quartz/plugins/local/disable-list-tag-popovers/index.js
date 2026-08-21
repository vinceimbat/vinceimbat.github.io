// Transformer plugin. Same mechanism as disable-homepage-popovers (see that
// plugin's comment for the full explanation of `data-no-popover="true"`),
// but scoped by selector instead of by page slug: it targets only the tag
// pills rendered inside list-page rows (`li.section-li > .section > .tags
// a.tag-link`, from folder-page's list markup), leaving tag popovers intact
// everywhere else (content-meta-en's byline, tag pages, in-body hashtags).
const SCRIPT = `
(function () {
  function disableListTagPopovers() {
    var links = document.querySelectorAll("li.section-li > .section > .tags a.tag-link")
    for (var i = 0; i < links.length; i++) {
      links[i].dataset.noPopover = "true"
    }
  }
  document.addEventListener("nav", disableListTagPopovers)
  document.addEventListener("render", disableListTagPopovers)
  disableListTagPopovers()
})();
`

const DisableListTagPopovers = (_opts) => {
  return {
    name: "DisableListTagPopovers",
    // A no-op — this plugin's real work happens in externalResources below,
    // but the plugin loader only accepts a "transformer"-category plugin if
    // it implements at least one of textTransform/markdownPlugins/htmlPlugins.
    textTransform(_ctx, src) {
      return src
    },
    externalResources() {
      return {
        js: [{ script: SCRIPT, contentType: "inline", loadTime: "afterDOMReady" }],
      }
    },
  }
}

export default DisableListTagPopovers
