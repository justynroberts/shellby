const path = require('path');

module.exports = {
  target: 'electron-preload',
  entry: './src/preload/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/preload'),
    filename: 'index.js',
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
