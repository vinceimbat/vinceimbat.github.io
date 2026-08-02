import { h } from "preact"

const STYLE = `
.list-search-container {
  margin: 1rem 0 1.5rem 0;
}
.list-search-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--lightgray);
  border-radius: 6px;
  padding: 0.55rem 0.85rem;
  background: var(--light);
}
.list-search-input {
  flex: 1 1 auto;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--bodyFont);
  font-size: 0.95rem;
  color: var(--dark);
}
.list-search-input::placeholder {
  color: var(--gray);
  font-style: italic;
}
.list-search-status {
  display: block;
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: var(--gray);
  min-height: 1em;
}
`

// Plain JS (no TS/JSX) — passed through esbuild.transform with the default
// "js" loader and executed directly in the browser as a component script.
const SCRIPT = `
function quartzListSearchSetup() {
  const inputs = document.querySelectorAll("[data-list-search-input]")
  for (const input of inputs) {
    const container = input.closest(".list-search-container")
    const status = container ? container.querySelector("[data-list-search-status]") : null
    const items = Array.from(document.querySelectorAll(".section-li"))

    const filter = () => {
      const query = input.value.trim().toLowerCase()
      let shown = 0
      for (const item of items) {
        const text = (item.textContent || "").toLowerCase()
        const match = query.length === 0 || text.indexOf(query) !== -1
        item.style.display = match ? "" : "none"
        if (match) shown++
      }
      if (status) {
        status.textContent = query.length === 0 ? "" : shown + (shown === 1 ? " match" : " matches")
      }
    }

    input.addEventListener("input", filter)
    window.addCleanup(() => input.removeEventListener("input", filter))
    filter()
  }
}
document.addEventListener("nav", quartzListSearchSetup)
document.addEventListener("render", quartzListSearchSetup)
`

const ListSearchBarComponent = () => {
  return h("div", { class: "list-search-container" }, [
    h("div", { class: "list-search-input-wrapper" }, [
      h("input", {
        type: "text",
        class: "list-search-input",
        placeholder: "filtering...",
        autocomplete: "off",
        "aria-label": "Filter list entries",
        "data-list-search-input": true,
      }),
    ]),
    h("output", {
      class: "list-search-status",
      "aria-live": "polite",
      "data-list-search-status": true,
    }),
  ])
}

ListSearchBarComponent.css = STYLE
ListSearchBarComponent.afterDOMLoaded = SCRIPT

export const ListSearchBar = () => ListSearchBarComponent
