'use strict';

const webpackDevServerConfigFactory = require('./webpackDevServer.config.js');
const requireFromString = require('require-from-string');
const path = require('path');
const paths = require('./paths');

// decorate original webpack dev server config
module.exports = function(proxy, allowedHost) {
  const template = webpackDevServerConfigFactory(proxy, allowedHost);

  return {
    ...template,
    serverSideRender: true,
    before(app, server) {
      const multiCompiler = server.middleware.context.compiler;
      const compiler = multiCompiler.compilers.filter(c => c.name === 'ssr')[0];
      if(!compiler) {
        throw new Error("Webpack compiler with name 'ssr' not found.");
      }

      // stores current request handler, changes after every compilation, initially handles pending handler change
      let ssrHandler = (request, response, next) => {
        installHandler = handler => {
          installHandler = handler => ssrHandler = handler;
          ssrHandler = handler;
          ssrHandler(request, response, next);
        };
      };
      let installHandler = handler => ssrHandler = handler;

      // fetch ssr handler after every compilation
      multiCompiler.hooks.done.tap('webpackDevServer.ssr', multiCompilerStats => {
        // make errors inside hook visible
        try {
          const compilerStats = multiCompilerStats.stats.filter(stats => stats.compilation.name === 'ssr')[0];

          if (compilerStats.compilation.errors.length === 0) {
            // fetch ssr entry point file name
            const filename = path.resolve(paths.appBuild, "..", "dist", "ssr.js");
            // read code from in memory fs
            const code = compiler.outputFileSystem.readFileSync(filename).toString();
            // compile code to node module
            const exports = requireFromString(code, filename);

            if (exports.devServerHandler) {
              // install dev server handler
              installHandler(exports.devServerHandler(compiler));
            } else if (exports.default) {
              // install production handler
              installHandler(exports.default);
            } else {
              // no handler found
              throw new Error("SSR entry point does not export a handler.");
            }
          }
        } catch (error) {
          console.error(error);
          // install error handler
          installHandler((request, response, next) => {
            // response.send("ERROR HANDLER: " + error.toString());
            next(error);
          });
        }
      });

      // install request handler in webpack dev server
      app.use((request, response, next) => ssrHandler(request, response, next));
    }
  };
};
