/** Token enforcement: raw colors and pixel values belong in src/design-system/tokens only. */
const config = {
  ignoreFiles: ['src/design-system/tokens/**', '.next/**', 'node_modules/**'],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla'],
    'unit-disallowed-list': ['px'],
  },
};

export default config;
