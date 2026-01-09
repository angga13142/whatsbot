module.exports = {
  '*.js': (files) =>
    files
      .filter((file) => !file.includes('node_modules'))
      .map((file) => `eslint --fix "${file}" && prettier --write "${file}"`),
  '*.{json,md}': (files) =>
    files
      .filter((file) => !file.includes('node_modules'))
      .map((file) => `prettier --write "${file}"`),
};
