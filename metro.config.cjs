// const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// /** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add `tslib` alias to fix "__extends" resolution issue
// const ALIASES = {
//   tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.es6.js')
// };

// // Wrap resolver to support aliasing
// const originalResolveRequest = config.resolver.resolveRequest;
// config.resolver.resolveRequest = (context, moduleName, platform) => {
//   return (originalResolveRequest ?? context.resolveRequest)(context, ALIASES[moduleName] ?? moduleName, platform);
// };

// Inject NativeWind config (preserves the resolver above)
module.exports = withNativeWind(config, { input: './global.css' });
