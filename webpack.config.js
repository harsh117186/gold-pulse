const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/main.ts',
  target: 'node',
  externals: [nodeExternals()],
  mode: 'production',
  stats: 'verbose',
  optimization: {
    minimize: true,
    removeAvailableModules: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    flagIncludedChunks: true,
    moduleIds: 'deterministic',
    chunkIds: 'deterministic'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            happyPackMode: true,
            experimentalWatchApi: true
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    cacheWithContext: false,
    symlinks: false
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    },
    maxAge: 172800000 // 2 days
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
}; 