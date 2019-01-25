'use strict';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpackConfigFactory = require('./webpack.config.js');
const paths = require('./paths');

// decorate original webpack config
module.exports = function (webpackEnv) {
  const template = webpackConfigFactory(webpackEnv);
  return Object.assign(
    // multi compiler config (client + server)
    [
      // ssr compiler config
      {
        ...template,
        name: 'ssr',
        target: 'node',
        entry: [
          // ssr entry point, usually s.th. like `./src/index.ssr.tsx` with `export default (req,res) => {}`
          paths.appIndexSsrJs
        ],
        output: {
          ...template.output,
          filename: 'ssr.js',
          libraryTarget: 'commonjs2',
          // avoid using absolute path '/' defined by template
          publicPath: ''
        },
        optimization: {
          ...template.optimization,
          // disable chunk splitting
          splitChunks: {},
          runtimeChunk: false
        },
        // filter out some plugins
        plugins: template.plugins.filter(plugin =>
          [
            // do not generate an additional index.html for ssr
            HtmlWebpackPlugin,
            // Avoid shadowing of process.env for ssr handler
            webpack.DefinePlugin
          ].every(pluginClass => !(plugin instanceof pluginClass))
        )
      },
      // client compiler config
      {
        // use original config
        ...template,
        name: 'client'
      },
    ],
    // workarounds
    {
      // at least one script expects to find `config.output.publicPath` but `config` is now an array
      output: {
        publicPath: template.output.publicPath
      }
    }
  );
};
