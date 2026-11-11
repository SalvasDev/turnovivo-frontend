/** Token enforcement: raw values belong in src/design-system/tokens only. */

// @media can't read custom properties, so breakpoints are restricted to the --breakpoint-* scale.
const breakpoints = ['28rem', '30rem', '32rem', '40rem', '48rem', '52rem', '64rem'];

const config = {
  ignoreFiles: ['src/design-system/tokens/**', '.next/**', 'node_modules/**'],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla'],
    'unit-disallowed-list': [
      ['px', 'rem', 'em', 'ms', 's', 'deg'],
      { ignoreMediaFeatureNames: { rem: ['max-width', 'min-width'] } },
    ],
    'media-feature-name-value-allowed-list': {
      'max-width': breakpoints,
      'min-width': breakpoints,
    },
    'declaration-property-value-disallowed-list': {
      '/^(z-index|opacity|font-weight|line-height)$/': ['/^-?\\.?\\d/'],
      '/^(color|background|background-color|border|border-color|caret-color|outline|outline-color|fill|stroke)$/': ['/(^|[\\s,(])transparent($|[\\s,)])/'],
    },
  },
};

export default config;
