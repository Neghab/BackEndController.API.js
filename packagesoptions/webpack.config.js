const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const DotenvPlugin = require('webpack-dotenv-plugin');
// var dotenv = require('dotenv').config({path: __dirname + '/.env'});

module.exports = {
  devtool: '',
  entry: {
    server: './server/index.js',
  },
  resolve: {
    modules: ['node_modules']
  },
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: '/',
    filename: '[name].js'
  },
  target: 'node',
  node: {
    __dirname: false,   // if you don't put this is, __dirname
    __filename: false,  // and __filename return blank or /
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    })
  ],
  externals: [
    nodeExternals({
      importType: 'commonjs',
      modulesFromFile: false
    })
  ],
  module: {
    rules: [
      {
        // Transpiles ES6-8 into ES5
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env'],
            plugins: ["@babel/plugin-transform-runtime", "@babel/plugin-proposal-optional-chaining"]
          }
        }
      }
    ]
  }
}