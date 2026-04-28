// SVGO config — normalizes raw SVG exports (e.g. from Affinity Designer)
// into clean, predictable, path-only files suitable for JSON extraction.
//
// Key choices:
//   - convertShapeToPath: collapses <rect>/<circle>/<line>/<polygon>/etc.
//     into <path d="…"> so the extractor sees a single shape type.
//   - removeViewBox: kept off so icons stay scalable.
//   - removeDimensions: strips fixed width/height in favor of viewBox.
//   - keep IDs/attrs that downstream consumers may rely on (currentColor).

export default {
  multipass: true,
  js2svg: { indent: 2, pretty: false },
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          convertShapeToPath: { convertArcs: true },
          // Preserve fill/stroke attributes as authored so the customizer
          // and downstream consumers see explicit values rather than the
          // SVG defaults (which would otherwise be stripped silently).
          removeUnknownsAndDefaults: {
            keepDataAttrs: false,
            defaultAttrs: false,
          },
          removeUselessStrokeAndFill: false,
          inlineStyles: { onlyMatchedOnce: false },
        },
      },
    },
    'removeDimensions',
    'convertStyleToAttrs',
  ],
};
