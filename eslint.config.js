const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: [
      "dist/*",
      "server_dist/*",
      "static-build/*",
      "coverage/*",
      "patches/*",
      "docs/archive/**",
      "logs/**",
    ],
  },
]);
