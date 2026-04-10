module.exports = {
  extends: ['stylelint-config-standard'],

  ignoreFiles: ['dist/**/*', 'node_modules/**/*'],

  rules: {
    'declaration-block-no-duplicate-properties': true,
    'no-invalid-double-slash-comments': true,
    'block-no-empty': true,
    'color-no-invalid-hex': true,
    'declaration-block-trailing-semicolon': 'always'
  }
};
