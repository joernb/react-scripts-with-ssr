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
          // avoid overriding process.env on the server, we will provide a customized DefinePlugin
          webpack.DefinePlugin
        ].every(pluginClass => !(plugin instanceof pluginClass))
      ).concat([
        // modified version of the DefinePlugin that does not override but extend process.env
        // this will preserve embedded env vars but also allow reading real env vars on the server
        new webpack.DefinePlugin(
          Object.keys(env.raw).reduce(
            (newEnv, key) => ({
              ...newEnv,
              // this will result in s.th. like: process.env.FOO = process.env.FOO || "embedded default value" 
              ['process.env.' + key]: 'process.env.' + key + '||' + JSON.stringify(env.raw[key])
            }),
            {}
          )
        )
      ]),
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
