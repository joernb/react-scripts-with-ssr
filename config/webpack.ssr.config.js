'use strict';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
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
        libraryTarget: 'commonjs2',
        // use '' instead of '/' to make urls relative to base href
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
        // use '' instead of '/' to make urls relative to base href
        publicPath: ''
      },
      // filter out some plugins
      plugins: template.plugins.filter(plugin =>
        [
          InterpolateHtmlPlugin,
          // filter out original DefinePlugin
          webpack.DefinePlugin
        ].every(pluginClass => !(plugin instanceof pluginClass))
      ).concat([
        // redefine process.env values on the client
        new webpack.DefinePlugin({
          'process.env': {
            // use existing values
            ...env.stringified['process.env'],
            // override with base href
            PUBLIC_URL: 'document.getElementsByTagName("base")[0].href'
          }
        }),
      ])
    },
  ];
};
