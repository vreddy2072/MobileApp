module.exports = function (api) {
  // Disable Babel cache to avoid caching conflicts
  // api.cache(true);
  
  // Detect if we're building for web
  const isWeb = api.caller(caller => 
    caller && (caller.name === 'metro' && caller.platform === 'web')
  );
  
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }], 
      'nativewind/babel'
    ],
    plugins: [
      // Transform import.meta for web builds
      ...(isWeb ? ['./babel-plugin-transform-import-meta.js'] : []),
      // Only use worklets plugin for native platforms, not web
      ...(isWeb ? [] : ['react-native-worklets/plugin']),
    ],
  };
};

