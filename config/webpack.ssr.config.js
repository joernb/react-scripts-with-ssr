'use strict';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin-alt');
const nodeExternals = require('webpack-node-externals');
const webpackConfigFactory = require('./webpack.config.js');
const paths = require('./paths');
const getClientEnvironment = require('./env');
const env = getClientEnvironment('');

// decorate original webpack config
module.exports = function (webpackEnv) {
  const template = webpackConfigFactory(webpackEnv);
  // multi compiler config (client + server)
  return [
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
        libraryTarget: 'commonjs2'
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
          // avoid shadowing of process.env for ssr handler
          webpack.DefinePlugin
        ].every(pluginClass => !(plugin instanceof pluginClass))
      ),
      externals: [nodeExternals()]
    },
    // client compiler config
    {
      // use original config
      ...template,
      name: 'client',
      output: {
        ...template.output,
      },
      // filter out some plugins
      plugins: template.plugins.filter(plugin =>
        [
          // seems to break multicompiler dev server watch mode
          ForkTsCheckerWebpackPlugin,
        ].every(pluginClass => !(plugin instanceof pluginClass))
      )
    },
  ];
};
