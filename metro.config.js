// Metro config — extends the Expo defaults to register woff2 as an asset
// extension so the BravuraText music-notation font can be served on web
// (Bravura's OTF fails Chrome's font sanitizer; the WOFF2 build loads cleanly).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes("woff2")) {
  config.resolver.assetExts.push("woff2");
}

module.exports = config;
