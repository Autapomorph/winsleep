/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config & import('prettier-plugin-tailwindcss').PluginOptions}}
 */
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  objectWrap: 'preserve',
  arrowParens: 'avoid',
  vueIndentScriptAndStyle: true,
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/app/styles/index.css',
};
