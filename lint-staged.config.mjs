export default {
  '*.{ts,tsx,astro}': ['eslint --fix', 'prettier --write'],
  '*.css': ['stylelint --fix', 'prettier --write'],
  '*.{json,yaml,yml,md,mjs}': 'prettier --write',
};
