const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

// module.exports = {
//   entry: "./bootstrap.js",
//   output: {
//     path: path.resolve(__dirname, "dist"),
//     filename: "bootstrap.js",
//   },
//   mode: "development",
//   plugins: [
//     new CopyWebpackPlugin(['index.html'])
//   ],
// };

const {
  MODE = 'development',
  DEV_SERVER_PORT = 9002,
} = process.env;

const isDevMode = MODE === 'development';
const isBuildMode = MODE === 'build';

const mode = isBuildMode ? 'production' : 'development';
const entry = {
  bootstrap: './bootstrap.js',
};

const output = { path: path.resolve(__dirname, '../dist'), filename: '[name].js' };
const resolve = { extensions: [".ts", ".tsx", ".js", '.wasm'] };
const modules = {
  rules: [
    {
      test: /\.tsx?$/,
      use: [
        { loader: 'ts-loader' },
      ],
    },
    {
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [["@babel/preset-env", { targets: { ie: 11 } }]],
          plugins: [
            "@babel/plugin-syntax-dynamic-import",
            "@babel/plugin-proposal-class-properties",
            [
              "@babel/plugin-transform-runtime",
              {
                "corejs": false,
                "helpers": true,
                "regenerator": true,
                "useESModules": false,
              },
            ],
            ["@babel/plugin-transform-react-jsx", { "pragma": "h" }],
          ],
        },
      },
    },
    {
      test: /\.tsx?$/,
      loader: 'eslint-loader',
      options: {
        formatter: require('eslint-friendly-formatter'),
        emitWarning: true,
        // fix: true,
      },
    },
    {
      test: /\.sass$/,
      use: [
        'style-loader',
        'css-loader',
        'sass-loader',
      ],
    },
  ],
};

const devtool = isBuildMode ? 'source-map' : 'inline-source-map';
const plugins = [
  new CopyWebpackPlugin(['index.html']),
];

let addOns = {};

if (isDevMode) {
  Object.assign(addOns, {
    devServer: {
      contentBase: path.join(__dirname, '../dist'),
      compress: true,
      port: DEV_SERVER_PORT,
      historyApiFallback: {
        rewrites: [
          {
            from: /.*/,
            to: function () {
              return 'index.html';
            },
          },
        ],
      },
    },
  });
}

if (isBuildMode) {
  const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
  const CompressionPlugin = require('compression-webpack-plugin');

  Object.assign(addOns, {
    optimization: {
      minimizer: [new UglifyJsPlugin()],
    },
  });

  plugins.push(
    new CompressionPlugin({
      filename: '[path].gz[query]',
    }),
  );
}

module.exports = {
  mode,
  entry,
  output,
  resolve,
  plugins,
  module: modules,
  devtool,

  ...addOns,
};
