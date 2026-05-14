# CYC Knit & Crochet Chart Symbols

An SVG icon set of the [Craft Yarn Council standard knit chart symbols](https://www.craftyarncouncil.com/standards/knit-chart-symbols) and [crochet chart symbols](https://www.craftyarncouncil.com/standards/crochet-chart-symbols), with a reproducible build pipeline and a GitHub Pages customizer for browsing, theming, and downloading symbols.

Symbol categories shipped today:

- [basic/](basic/) — single-stitch knit symbols (knit, purl, yarn over, decreases, increases, slip stitches, etc.)
- [cable-v1/](cable-v1/) and [cable-v2/](cable-v2/) — two visual styles of cable-crossing symbols
- [crochet/](crochet/) — crochet chart symbols (chain, slip stitch, sc/hdc/dc/tr/dtr, clusters, popcorn, shell, picot, front/back post, front/back loop indicators, etc.)

- [Using the JSON bundle](#using-the-json-bundle)
- [Customizer (GitHub Pages)](#customizer-github-pages)
- [Build pipeline](#build-pipeline)
- [Contributing](#contributing)
- [Attribution](#attribution)

---

## Using the JSON Bundle

The build output is `dist/knitSymbols.json` — a flat map of every symbol, ready to embed in any web project without a bundler.

### Output schema

```jsonc
{
  "basicKnit": {
    "key": "basicKnit",
    "category": "basic",
    "name": "knit",
    "file": "basic/knit.svg",
    "displayName": "Knit",
    "label": "Knit",                 // from catalog.json
    "meaning": "K on RS, p on WS",   // from catalog.json
    "cellWidth": 100,
    "cellHeight": 100,
    "viewBox": "0 0 100 100",
    "innerHTML": "<path fill=\"#000\" d=\"M...\"/>"
  }
}
```

`innerHTML` contains the normalized inner markup of each source SVG, including groups, masks, gradients, and mixed fill/stroke paths.

### Rendering a symbol

```jsx
<svg viewBox={sym.viewBox} dangerouslySetInnerHTML={{ __html: sym.innerHTML }} />
```

Or in vanilla JS:

```js
svgEl.setAttribute('viewBox', sym.viewBox);
svgEl.innerHTML = sym.innerHTML;
```

### Theming

Apply `fill`, `stroke`, and `stroke-width` to the wrapper `<svg>`. SVG cascade means authored explicit values on children are preserved, while undecorated paths inherit from the wrapper — so a single color attribute on the parent is enough to theme most symbols.

### Grid convention

One knit chart cell is `100 × 100` viewBox units.

- Basic (single-stitch) knit symbols: `viewBox="0 0 100 100"`
- _N_-stitch cables: `viewBox="0 0 (N*100) 100"`
- Crochet symbols use their own intrinsic dimensions (see `cellWidth` / `cellHeight` in the JSON, sourced from [crochet/catalog.json](crochet/catalog.json)). Crochet chart cells are not a fixed size — stitches like `dc`, `tr`, and `dtr` are intentionally taller than `sc` to reflect their relative row height, and clusters / shells span multiple base stitches. Each crochet catalog entry also records an `anchor` point (the base of the stitch) for layout on a chart grid.

SVGs omit fixed `width` and `height` so consumers control sizing while aspect ratio is preserved automatically.

---

## Customizer (GitHub Pages)

[index.html](index.html) is a no-bundler single-page app that loads `dist/knitSymbols.json` and lets visitors:

- set a shared fill and stroke color (or switch to outline-only mode)
- adjust stroke width, line cap, and line join
- toggle a filled or transparent background
- set export size
- search and filter by category
- download a single SVG, copy SVG markup to clipboard, or download all / currently filtered symbols as a ZIP (via [JSZip](https://stuk.github.io/jszip/) from CDN)

To run locally:

```bash
npm install
npm run build
python3 -m http.server 8000
# open http://localhost:8000/
```

**To publish:** in GitHub repository settings, set Pages source to the `main` branch root. The app fetches `./dist/knitSymbols.json` at runtime, so `dist/` is intentionally committed. Re-run `npm run build` and commit before each push.

---

## Build Pipeline

```
.af  →  .svg  (Affinity export)
.svg →  .svg  (SVGO normalization, in place)
.svg →  dist/knitSymbols.json  (extraction + metadata merge)
```

### Steps

1. **Design** — Edit symbols in the `.af` (Affinity Designer) source files under [basic/](basic/), [cable-v1/](cable-v1/), [cable-v2/](cable-v2/), or [crochet/](crochet/).
2. **Export** — Export each `.af` as an SVG with the same base name into the same folder (e.g. `basic/knit.af` → `basic/knit.svg`).
3. **Optimize** — `npm run optimize` runs [SVGO](https://github.com/svg/svgo) over every `*.svg` in the knit folders (`basic/`, `cable-v1/`, `cable-v2/`) in place, converting shapes to `<path>` and stripping fixed dimensions while preserving `viewBox`, fills, and strokes. Crochet SVGs are stroke-only line art and are committed without SVGO optimization so their `<line>` / `<path>` structure stays predictable.
4. **Extract** — `npm run extract` parses every SVG with [Cheerio](https://github.com/cheeriojs/cheerio), merges metadata from the root [catalog.json](catalog.json) and [crochet/catalog.json](crochet/catalog.json), and writes `dist/knitSymbols.json`.

`npm run build` runs steps 3 and 4 together.

### Source of truth

- `*.af` files are the editable design sources. SVG files are derived exports — do not hand-edit them.
- [catalog.json](catalog.json) holds human-readable metadata (label, meaning, cell width, cell height) keyed by `{ category, name }` for knit symbols. Add an entry here for every new knit symbol.
- [crochet/catalog.json](crochet/catalog.json) is the auxiliary metadata file for crochet symbols. Entries are keyed by `name` only (the `crochet` category is applied automatically at build time) and additionally carry `anchor` coordinates marking the base of each stitch.

---

## Contributing

### Adding a new symbol

1. Create the symbol in Affinity Designer and save it as a `.af` file in the appropriate category folder.
2. Export to SVG (same base name, same folder).
3. Add metadata for the new symbol:
  - Knit symbols (`basic/`, `cable-v1/`, `cable-v2/`): add an entry to [catalog.json](catalog.json) keyed by `{ category, name }`.
  - Crochet symbols (`crochet/`): add an entry to [crochet/catalog.json](crochet/catalog.json) keyed by `name` and include `anchor` coordinates.
4. Run `npm run build` and verify the symbol appears correctly in the customizer.
5. Commit the `.af`, `.svg`, updated metadata file(s), and updated `dist/knitSymbols.json` together.

### Validation warnings

`npm run extract` prints warnings for:

- SVG files present on disk with no matching metadata entry (in either [catalog.json](catalog.json) or [crochet/catalog.json](crochet/catalog.json))
- Metadata entries (in either [catalog.json](catalog.json) or [crochet/catalog.json](crochet/catalog.json)) with no corresponding `.svg` export

Resolve both before opening a pull request.

---

## Attribution

The symbols in this repository are vector reproductions of the [Craft Yarn Council](https://www.craftyarncouncil.com) standard [knit chart symbols](https://www.craftyarncouncil.com/standards/knit-chart-symbols) and [crochet chart symbols](https://www.craftyarncouncil.com/standards/crochet-chart-symbols). The CYC permits free use with attribution. If you use these symbols in a publication or on a website, include the following credit:

> Source: Craft Yarn Council of America's [www.YarnStandards.com](http://www.YarnStandards.com)

For HTML:

```html
Source: Craft Yarn Council <a href="http://www.YarnStandards.com">www.YarnStandards.com</a>
```

The build pipeline and scripts are released under the [MIT License](LICENSE).
