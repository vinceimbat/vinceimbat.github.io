// Transformer plugin. No markdown/HTML transform needed — content images
// already render as plain <img> tags. This just injects PhotoSwipe (CSS +
// a lazily-imported ESM module, loaded from a CDN only once a user actually
// clicks an image) and binds every <img> inside <article> into a single
// gallery, so left/right arrows step through all images on the page —
// matching the lightbox behavior on craigmod.com/ridgeline.
const PSWP_VERSION = "5.4.4"
const CSS_URL = `https://cdn.jsdelivr.net/npm/photoswipe@${PSWP_VERSION}/dist/photoswipe.css`
const PSWP_MODULE_URL = `https://cdn.jsdelivr.net/npm/photoswipe@${PSWP_VERSION}/dist/photoswipe.esm.min.js`

const STYLE = `
article :not(a) > img,
article a[href$=".jpg"] > img,
article a[href$=".jpeg"] > img,
article a[href$=".png"] > img,
article a[href$=".webp"] > img,
article a[href$=".gif"] > img {
  cursor: zoom-in;
}
.pswp {
  --pswp-bg: #161615;
}
`

const SCRIPT = `
(function () {
  var loadPhotoSwipe = (function () {
    var modulePromise = null;
    return function () {
      if (!modulePromise) {
        modulePromise = import("${PSWP_MODULE_URL}").then(function (mod) {
          return mod.default;
        });
      }
      return modulePromise;
    };
  })();

  function naturalDims(img) {
    return {
      width: img.naturalWidth || img.width || 1600,
      height: img.naturalHeight || img.height || 1200,
    };
  }

  function collectImages(article) {
    return Array.prototype.slice
      .call(article.querySelectorAll("img"))
      .filter(function (img) {
        // Skip images already wrapped in a link to something other than
        // themselves (e.g. an image used as a hyperlink) — only bind
        // plain images or images linking directly to their own file.
        var link = img.closest("a");
        if (!link) return true;
        var href = link.getAttribute("href") || "";
        return /\\.(jpe?g|png|webp|gif)$/i.test(href);
      });
  }

  function openGallery(images, index) {
    loadPhotoSwipe().then(function (PhotoSwipe) {
      var dataSource = images.map(function (img) {
        var d = naturalDims(img);
        return {
          src: img.currentSrc || img.src,
          width: d.width,
          height: d.height,
          alt: img.getAttribute("alt") || "",
        };
      });
      var pswp = new PhotoSwipe({
        dataSource: dataSource,
        index: index,
        bgOpacity: 0.92,
        showHideAnimationType: "zoom",
        wheelToZoom: true,
        padding: { top: 24, bottom: 24, left: 24, right: 24 },
      });
      pswp.init();
    });
  }

  function bindImage(article, img, fallbackIndex) {
    if (img.dataset.lightboxBound) return;
    img.dataset.lightboxBound = "true";
    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    if (!img.hasAttribute("aria-label")) {
      img.setAttribute("aria-label", "Open image in lightbox");
    }

    function open() {
      var current = collectImages(article);
      var clickedIndex = current.indexOf(img);
      openGallery(current, clickedIndex < 0 ? fallbackIndex : clickedIndex);
    }

    img.addEventListener("click", function (e) {
      var link = img.closest("a");
      if (link) e.preventDefault();
      open();
    });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  }

  function initLightbox() {
    var article = document.querySelector("article");
    if (!article) return;
    collectImages(article).forEach(function (img, index) {
      bindImage(article, img, index);
    });
  }

  document.addEventListener("nav", initLightbox);
})();
`

const Lightbox = (_opts) => {
  return {
    name: "Lightbox",
    // No actual HTML transform — this plugin only needs externalResources
    // below — but the plugin loader's category validation for
    // "transformer" requires at least one of textTransform/markdownPlugins/
    // htmlPlugins to be present on the instance.
    htmlPlugins() {
      return []
    },
    externalResources() {
      return {
        css: [
          { content: CSS_URL, inline: false },
          { content: STYLE, inline: true },
        ],
        js: [{ script: SCRIPT, contentType: "inline", loadTime: "afterDOMReady" }],
      }
    },
  }
}

export default Lightbox
