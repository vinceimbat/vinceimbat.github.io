// Transformer plugin. Popovers (hover preview of linked notes) are a single
// site-wide feature — `enablePopovers` in quartz.config.yaml only controls
// whether the popover script gets bundled at all, with no per-page-type
// option. The popover script itself (quartz/components/scripts/popover.inline.ts)
// already supports opting individual links out via a `data-no-popover="true"`
// attribute, checked at hover-time inside its mouseenter handler. This
// plugin injects a small script that sets that attribute on every internal
// link on the homepage only (`body.dataset.slug === "index"`), on the same
// `nav`/`render` events the popover script itself listens for, so freshly
// rendered/SPA-navigated-in links are covered too.
const SCRIPT = `
(function () {
  function disableHomepagePopovers() {
    if (document.body.dataset.slug !== "index") return
    var links = document.querySelectorAll("a.internal")
    for (var i = 0; i < links.length; i++) {
      links[i].dataset.noPopover = "true"
    }
  }
  document.addEventListener("nav", disableHomepagePopovers)
  document.addEventListener("render", disableHomepagePopovers)
  disableHomepagePopovers()
})();
`

const DisableHomepagePopovers = (_opts) => {
  return {
    name: "DisableHomepagePopovers",
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

export default DisableHomepagePopovers
