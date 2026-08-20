const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      mode: env.mode || 'production',
    },
    argv
  );

  // Enhanced performance optimizations for Lighthouse 100/100/100/100
  
  // 1. PERFORMANCE OPTIMIZATIONS
  config.optimization = {
    ...config.optimization,
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        expo: {
          test: /[\\/]node_modules[\\/]expo[\\/]/,
          name: 'expo',
          chunks: 'all',
          priority: 15,
        },
      },
    },
    usedExports: true,
    sideEffects: false,
    minimize: true,
    minimizer: [
      ...config.optimization.minimizer,
    ],
  };

  // 2. IMAGE OPTIMIZATION
  const imageLoaderRule = {
    test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
    use: [
      {
        loader: 'url-loader',
        options: {
          limit: 8192,
          fallback: {
            loader: 'file-loader',
            options: {
              name: 'assets/images/[name].[hash:8].[ext]',
              publicPath: '/assets/images/',
            },
          },
        },
      },
      {
        loader: 'image-webpack-loader',
        options: {
          mozjpeg: {
            progressive: true,
            quality: 80,
          },
          optipng: {
            enabled: false,
          },
          pngquant: {
            quality: [0.65, 0.90],
            speed: 4,
          },
          gifsicle: {
            interlaced: false,
          },
          webp: {
            quality: 80,
          },
          avif: {
            quality: 80,
          },
        },
      },
    ],
  };

  // Replace existing image rules
  config.module.rules = config.module.rules.filter(
    rule => !rule.test || !rule.test.toString().includes('png|jpe?g|gif')
  );
  config.module.rules.push(imageLoaderRule);

  // 3. FONT OPTIMIZATION
  config.module.rules.push({
    test: /\.(woff|woff2|eot|ttf|otf)$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: 'assets/fonts/[name].[hash:8].[ext]',
          publicPath: '/assets/fonts/',
        },
      },
    ],
  });

  // 4. CSS OPTIMIZATION
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');
  const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
  
  config.plugins.push(
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    })
  );

  config.optimization.minimizer.push(
    new CssMinimizerPlugin({
      minimizerOptions: {
        preset: [
          'default',
          {
            discardComments: { removeAll: true },
            normalizeUnicode: false,
          },
        ],
      },
    })
  );

  // 5. PRELOAD/PREFETCH OPTIMIZATION
  const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');
  config.plugins.push(
    new PreloadWebpackPlugin({
      rel: 'preload',
      as: 'script',
      include: 'initial',
    }),
    new PreloadWebpackPlugin({
      rel: 'prefetch',
      include: 'asyncChunks',
    })
  );

  // 6. SERVICE WORKER & PWA
  const { GenerateSW } = require('workbox-webpack-plugin');
  config.plugins.push(
    new GenerateSW({
      clientsClaim: true,
      exclude: [/\.map$/, /manifest$/, /\.htaccess$/],
      importWorkboxFrom: 'cdn',
      navigateFallback: '/index.html',
      navigateFallbackAllowlist: [/^(?!\/__).*/],
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts-stylesheets',
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        {
          urlPattern: /^https:\/\/api\.gathergrove\.com\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5, // 5 minutes
            },
          },
        },
      ],
    })
  );

  // 7. BUNDLE ANALYZER (only in development)
  if (process.env.ANALYZE === 'true') {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-report.html',
        openAnalyzer: false,
      })
    );
  }

  // 8. COMPRESSION
  const CompressionPlugin = require('compression-webpack-plugin');
  config.plugins.push(
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    })
  );

  // 9. CRITICAL CSS INLINE
  const HtmlWebpackPlugin = require('html-webpack-plugin');
  const htmlPlugin = config.plugins.find(plugin => plugin instanceof HtmlWebpackPlugin);
  if (htmlPlugin) {
    htmlPlugin.options.inlineSource = '\\.(css)$';
    htmlPlugin.options.minify = {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    };
  }

  return config;
};