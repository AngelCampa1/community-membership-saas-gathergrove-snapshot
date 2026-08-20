module.exports = function(api) {
  // CRITICAL FIX: Prevent Babel cache conflicts in Jest
  api.cache.forever();
  
  const isTest = process.env.NODE_ENV === 'test';
  // const isWeb = process.env.PLATFORM === 'web'; // Reserved for web-specific config
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    presets: [
      ['babel-preset-expo', { 
        unstable_transformImportMeta: true,
        jsxRuntime: 'automatic',
        web: { 
          disableImportExportTransform: true,
        }
      }]
    ],
    plugins: [
      // Enhanced module resolver with performance optimizations
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.native.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.native.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/navigation': './src/navigation',
            '@/services': './src/services',
            '@/hooks': './src/hooks',
            '@/types': './src/types',
            '@/utils': './src/utils',
            '@/constants': './src/constants',
            '@/config': './src/config',
            '@/contexts': './src/contexts',
          },
        },
      ],
      
      // React optimizations - only for non-test environments
      ...(isTest ? [] : [
        ['@babel/plugin-transform-react-jsx', {
          runtime: 'automatic',
          development: isDev,
          importSource: 'react',
        }],
      ]),
    ].filter(Boolean),
  };
}; 