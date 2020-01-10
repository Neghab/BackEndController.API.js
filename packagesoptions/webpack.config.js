const pathUtil = require('path')
const webpack = require('webpack')
const dotenv = require('dotenv');

module.exports = () => {
  
  const envVars = dotenv.config({path: pathUtil.resolve(process.cwd(),`.env.${process.env.NODE_ENV}`)});

  return {
    devtool: '',
    entry: {
      server: './server/index.js',
    },
    resolve: {
      modules: ['node_modules']
    },
    output: {
      path: pathUtil.resolve(__dirname, 'build'),
      filename: 'server.js'
    },
    optimization: {
      minimize: false
    },
    target: 'node',
    node: {
      __dirname: false,   // if you don't put this is, __dirname
      __filename: false,  // and __filename return blank or /
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.CVNA_APP_SPLUNK_URL': JSON.stringify(envVars.CVNA_APP_SPLUNK_URL),
        'process.env.CVNA_APP_SPLUNK_TOKEN': JSON.stringify(envVars.CVNA_APP_SPLUNK_TOKEN),
        'process.env.CVNA_APP_APP_INSIGHTS_KEY': JSON.stringify(envVars.CVNA_APP_APP_INSIGHTS_KEY),
        'process.env.CVNA_APP_KEYVAULT_URL': JSON.stringify(envVars.CVNA_APP_KEYVAULT_URL),
        'process.env.CVNA_APP_AZURE_CLIENT_ID': JSON.stringify(envVars.CVNA_APP_AZURE_CLIENT_ID),
        'process.env.CVNA_APP_AZURE_CLIENT_SECRET': JSON.stringify(envVars.CVNA_APP_AZURE_CLIENT_SECRET),
        'process.env.CVNA_APP_COSMOSDB_RO_SECRET_NAME': JSON.stringify(envVars.CVNA_APP_COSMOSDB_RO_SECRET_NAME),
        'process.env.CVNA_APP_COSMOSDB_RO_SECRET_VERSION': JSON.stringify(envVars.CVNA_APP_COSMOSDB_RO_SECRET_VERSION),
        'process.env.CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT': JSON.stringify(envVars.CVNA_APP_COSMOSDB_ACCOUNT_ALGO_CONTENT),
        'process.env.CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT': JSON.stringify(envVars.CVNA_APP_COSMOSDB_DATABASE_ALGO_CONTENT),
        'process.env.CVNA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE': JSON.stringify(envVars.CVNA_APP_COSMOSDB_COLLECTION_ALGO_CONTENT_VEHICLE)
      }),
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
              plugins: [
                "@babel/plugin-transform-runtime",
                "@babel/plugin-proposal-optional-chaining",
                "transform-inline-environment-variables"
              ]
            }
          }
        }
      ]
    }
  }
}