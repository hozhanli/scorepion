module.exports = function (api) {
  api.cache.using(() => process.env.EXPO_PUBLIC_DOMAIN || "");
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
  };
};
