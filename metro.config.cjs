const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Fix web-specific module resolution issues:
// 1. tslib: Metro misresolves tslib/modules/index.js (CJS/ESM interop failure)
// 2. zustand/middleware: ESM build uses import.meta.env which is invalid
//    in Metro's non-module <script> tag on web
const ALIASES = {
  tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.es6.js')
};

const WEB_ALIASES = {
  'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js')
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const alias = ALIASES[moduleName] ?? (platform === 'web' ? WEB_ALIASES[moduleName] : undefined) ?? moduleName;
  return (originalResolveRequest ?? context.resolveRequest)(context, alias, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
