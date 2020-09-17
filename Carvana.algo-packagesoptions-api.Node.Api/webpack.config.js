/* eslint-disable indent */
const path = require('path');
const webpack = require('webpack');
const WebpackBar = require('webpackbar');
const nodeExternals = require('webpack-node-externals');

const isProduction = process.env.NODE_ENV === 'production';
const plugins = [
    new WebpackBar({
        name: "Node Template",
        profile: !isProduction,
        reporters: ['fancy'],
    }),
    new webpack.NamedModulesPlugin(),
];

module.exports = {
    mode: 'development',
    devtool: false,
    externals: [nodeExternals()],
    name: 'server',
    plugins,
    target: 'node',
    entry: [path.resolve(path.join(__dirname, '/src/index.js'))],
    output: {
        publicPath: './',
        path: path.resolve(__dirname, './dist'),
        filename: 'node.server.js',
        libraryTarget: 'commonjs-module',
    },
    resolve: {
        extensions: [
            '.webpack-loader.js',
            '.web-loader.js',
            '.loader.js',
            '.js',
            '.jsx',
        ],
        modules: [path.resolve(__dirname, 'node_modules')],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                loader: 'babel-loader',
                options: {
                    babelrc: true,
                },
            },
        ],
    },
    node: {
        console: false,
        global: false,
        process: false,
        Buffer: false,
        __filename: false,
        __dirname: true,
    },
};
