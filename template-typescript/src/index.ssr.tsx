/**
 * This file is supposed to export a request handler, which implements server-side rendering in a Node.js runtime
 * environment.
 * 
 * In production, the request handler may be imported by an executable node script, which sets up an express server.
 * A sample script is provided in `react-scripts-with-ssr/scripts/serve.js`, which you may start with `npm run serve`
 * to test your production builds of the request handler. That script however is not part of the compilation. It is up
 * to you to implement, how the request handler is integrated in your server-side infrastructure.
 * 
 * This file may also export a function called `devServerHandler`, which is supposed to return a request handler for
 * the development environment. That request handler is plugged into the local webpack dev server started by `npm start`.
 */
import React from 'react';
import { renderToNodeStream } from 'react-dom/server';
import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import App from './App';

// provide a way to emulate fs access in development mode when builds are served from in-memory
let readFileSync: (filename: string) => Buffer = fs.readFileSync;

const router = express.Router();

// define ssr path pattern, exclude file and hmr requests
const ssrRegex = /^\/(?!static|favicon\.ico|.*hot-update\.js).*/;

// do server-side rendering
router.use(ssrRegex, (request: express.Request, response: express.Response, next: express.NextFunction) => {
  const template = readFileSync('build/index.html')
    .toString()
    .replace(/%BASE_HREF%/g, process.env.BASE_HREF || '')
    .replace(/%CLIENT_ENV%/g, JSON.stringify({
      FOO: 'bar'
    }));

  const [head, tail] = template.split('%ROOT%');
  const stream = renderToNodeStream(<App />);
  response.type('html');
  response.write(head);
  stream.pipe(response, { end: false });
  stream.on("end", () => {
    response.write(tail);
    response.end();
  });
});

// serve static files from build/ dir
router.use(express.static(
  'build',
  {
    // do not send index.html for '/'
    index: false
  }
));

/**
 * Export a request handler. This can be plugged into an express instance or deployed as a serverless function.
 * An express router itself implements the request handler interface (composite design pattern).
 */
export default router;

/**
 * Supposed to return a request handler which can be plugged into a webpack dev server during development.
 * This function should return a somehow altered or decorated version of the 'export default' request handler,
 * which handles differences between development and production environment.
 * @param compiler webpack compiler which compiles the ssr entry point
 */
export const devServerHandler = (compiler: any) => {
  // redirect file access to use in-memory fs of the compiler
  readFileSync = fileName =>
    compiler.outputFileSystem.readFileSync(
      path.resolve(
        // handlers should expect files in build/ but the dev server writes them to dist/
        fileName.replace('build', 'dist')
      )
    );

  // ignore in-memory file requests, will be handled by the webpack dev middleware
  const devServerRouter = express.Router();
  devServerRouter.use(ssrRegex, router);
  return devServerRouter;
};
