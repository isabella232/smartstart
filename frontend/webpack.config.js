const autoprefixer = require('autoprefixer')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
require('babel-polyfill') // for Object.assign and Promise on IE11
require('whatwg-fetch') // fetch polyfill for IE11
const merge = require('webpack-merge')
const path = require('path')
const webpack = require('webpack')
const yargs = require('yargs').argv

let localConfig = {}
try {
  localConfig = require('./local-config')
} catch(error) {
  // continue with localConfig defined as {}
}

const postCSSLoader = {
  loader: 'postcss-loader',
  options: {
    plugins: () => [
      autoprefixer({
        browsers: ['last 2 versions']
      })
    ]
  }
}

const PATHS = {
  src: path.join(__dirname, './src'),
  dist: path.join(__dirname, './dist')
}

let API_PATH, PIWIK_INSTANCE, PIWIK_SITE, GOOGLE_API_KEY, ENTITLEMENTS_API, MYIR_ENABLED, MYIR_ENDPOINT
// determine which api endpoint to use
if (yargs.endpoint) {
  API_PATH = yargs.endpoint
} else if (localConfig.endpoint) {
  API_PATH = localConfig.endpoint
} else {
  throw new Error('API endpoint not specified')
}

// determine piwik endpoint
if (yargs.piwik_instance) {
  PIWIK_INSTANCE = yargs.piwik_instance
} else if (localConfig.piwik) {
  PIWIK_INSTANCE = localConfig.piwik_instance
} else {
  // we want the site to be able to run locally without Piwik integration
  PIWIK_INSTANCE = ''
}

// determine which piwik site ID to use
if (yargs.piwik) {
  PIWIK_SITE = yargs.piwik
} else if (localConfig.piwik) {
  PIWIK_SITE = localConfig.piwik
} else {
  PIWIK_SITE = null
}

// API for loading Google Maps JavaScript API
if (yargs.google_api_key) {
  GOOGLE_API_KEY = yargs.google_api_key
} else if (localConfig.google_api_key) {
  GOOGLE_API_KEY = localConfig.google_api_key
} else {
  GOOGLE_API_KEY = ''
}

// where myir is enabled or not on BRO tab
if (yargs.myir_enabled === 'True') {
  MYIR_ENABLED = yargs.myir_enabled
} else if (localConfig.myir_enabled) {
  MYIR_ENABLED = localConfig.myir_enabled
} else {
  MYIR_ENABLED = ''
}

// specify if you need to query different server
if (yargs.myir_server_url) {
  MYIR_ENDPOINT = yargs.myir_server_url
} else if (localConfig.myir_server_url) {
  MYIR_ENDPOINT = localConfig.myir_server_url
} else {
  MYIR_ENDPOINT = ''
}

// Openfisca (entitlements) project URL
if (yargs.entitlements_api) {
  ENTITLEMENTS_API = yargs.entitlements_api
} else if (localConfig.entitlements_api) {
  ENTITLEMENTS_API = localConfig.entitlements_api
} else {
  ENTITLEMENTS_API = ''
}

// config that is shared between all types of build
const common = {
  context: PATHS.src,

  entry: {
    app: ['whatwg-fetch', 'babel-polyfill', './index.js']
  },

  devServer: {
    historyApiFallback: true
  },

  output: {
    filename: 'app.[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    publicPath: '/'
    // don't need a path for default config
  },

  stats: {
    errors: true,
    errorDetails: true
  },
  module: {
    rules: [
      {
        test: /\.js[x]?$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['@babel/react']
          }
        }]
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          postCSSLoader,
          'sass-loader?includePaths[]=' + path.resolve(__dirname, './src')
        ]
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new CopyWebpackPlugin(
      [
        { from: PATHS.src + '/assets', to: 'assets' },
        { from: PATHS.src + '/assets/favicons/browserconfig.xml', to: 'browserconfig.xml' },
        { from: PATHS.src + '/static-pages/static-page.css', to: 'static-pages/static-page.css' },
        { from: PATHS.src + '/sitemap.xml', to: 'sitemap.xml' },
        { from: PATHS.src + '/robots.txt', to: 'robots.txt' }
      ],
      { ignore: ['.gitkeep'] }
    ),
    new MiniCssExtractPlugin({ filename: 'app.[contenthash].css' }),
    new HtmlWebpackPlugin({
      template: 'index.html',
      stats: {
        children: false
      }
    }),
    new HtmlWebpackPlugin({
      filename: 'static-pages/error.html',
      template: 'static-pages/error.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'static-pages/maintenance.html',
      template: 'static-pages/maintenance.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'static-pages/signup-confirmed.html',
      template: 'static-pages/signup-confirmed.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'static-pages/unsubscribed.html',
      template: 'static-pages/unsubscribed.html',
      inject: false
    }),
  ],

  // set up resolve so don't have to qualify paths with ./ within src
  resolve: {
    extensions: ['.js', '.jsx', '.scss'],
    modules: [ PATHS.src, "node_modules" ]
  }
}

// build config from common plus custom config according to event trigger
var config
var runCommand = process.env.npm_lifecycle_event
var frontendHost = process.env.frontend_host || 'http://localhost:8080';

// only use the run script invocation command up to the colon delimiter
if (runCommand && runCommand.indexOf(':') > -1) {
  runCommand = runCommand.substr(0, runCommand.indexOf(':'))
}

switch (runCommand) {
  case 'build':
    config = merge(common, {
      mode: 'production',
      devtool: 'cheap-module-source-map',
      output: {
        path: PATHS.dist
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {NODE_ENV: JSON.stringify('production')},
          API_ENDPOINT: JSON.stringify(API_PATH),
          PIWIK_SITE: JSON.stringify(PIWIK_SITE),
          PIWIK_INSTANCE: JSON.stringify(PIWIK_INSTANCE),
          GOOGLE_API_KEY: JSON.stringify(GOOGLE_API_KEY),
          MYIR_ENABLED: JSON.stringify(MYIR_ENABLED),
          MYIR_ENDPOINT: JSON.stringify(MYIR_ENDPOINT),
          ENTITLEMENTS_API: JSON.stringify(ENTITLEMENTS_API)
        })
      ],
      optimization: {
        namedModules: true,
        minimizer: [
          new UglifyJSPlugin({
            cache: true,
            parallel: false,
            uglifyOptions: {
              warnings: false,
              ie8: false
            }
          })
        ],
        splitChunks: {
          chunks: 'initial'
        }
      }
    })
    break
  default:
    config = merge.strategy({
      entry: 'replace',
      devServer: 'replace',
      plugins: 'preprend',
      'module.rules': 'replace'
    })(common, {
      mode: 'development',
      devtool: 'cheap-module-eval-source-map',
      output: {
        filename: 'app.[hash].js',
        chunkFilename: '[name].[hash].js',
      },

      entry: [
          'babel-polyfill',
          `webpack-dev-server/client?${frontendHost}`,
          'webpack/hot/dev-server',
          'react-hot-loader/patch',
          'whatwg-fetch',
          './index.js'
        ],

      devServer: {
        historyApiFallback: true,
        host: 'fe-dev.smartstart',
        hot: true,
        proxy: [
          {
            context: [
              '/login',
              '/logout',
              '/realme',
              '/accounts',
              '/account',
              '/api',
              '/admin',
              '/static'
            ],
            target: 'http://fe-dev.smartstart:8000',
            logLevel: 'debug',
            secure: false,
            bypass: function (req, res, proxyOptions) {
              req.headers['X-Forwarded-Port'] = '8080';
            }
          },
          {
            context: ['/birth-registration-api'],
            target: 'http://fe-dev.smartstart:15302',
            logLevel: 'debug',
            secure: false
          }
        ]
      },

      plugins: [
        new webpack.HotModuleReplacementPlugin(),
        // enable HMR globally
        new webpack.DefinePlugin({
          'process.env': {NODE_ENV: JSON.stringify('development')},
          API_ENDPOINT: JSON.stringify(API_PATH),
          PIWIK_SITE: JSON.stringify(PIWIK_SITE),
          PIWIK_INSTANCE: JSON.stringify(PIWIK_INSTANCE),
          GOOGLE_API_KEY: JSON.stringify(GOOGLE_API_KEY),
          MYIR_ENABLED: JSON.stringify(MYIR_ENABLED),
          MYIR_ENDPOINT: JSON.stringify(MYIR_ENDPOINT),
          ENTITLEMENTS_API: JSON.stringify(ENTITLEMENTS_API)
        })
      ],

      module: {
        rules: [
          {
            test: /\.js[x]?$/,
            exclude: /node_modules/,
            use: ['react-hot-loader/webpack', 'babel-loader']
          },
          {
            test: /\.scss$/,
            use: [
              'style-loader',
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  plugins: () => [
                    autoprefixer({
                      browsers: ['last 2 versions']
                    })
                  ]
                }
              },
              'sass-loader?includePaths[]=' + path.resolve(__dirname, './src')
            ]
          }
        ]
      }
    })
}

module.exports = config
