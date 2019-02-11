# react-scripts-with-ssr [![Build Status](https://travis-ci.org/joernb/react-scripts-with-ssr.svg?branch=master)](https://travis-ci.org/joernb/react-scripts-with-ssr)

This is a fork of [react-scripts](https://github.com/facebook/create-react-app/tree/master/packages/react-scripts), which adds support for server-side rendering (SSR).

`react-scripts` is a part of [Create React App](https://github.com/facebook/create-react-app), which can be used with a customized version of `react-scripts`.

## Getting Started

Install create-react-app:
```sh
npm i -g create-react-app
```

Generate a new project (add `--typescript` for TypeScript support):
```sh
npx create-react-app my-app --scripts-version react-scripts-with-ssr
cd my-app
```

Start a local webpack dev server with integrated server-side rendering:
```sh
npm start
```

Build a production version and test server-side rendering locally:
```sh
npm run build
npm run serve
```

## How it works

### SSR entry point

The script will generate an additional entry point for server-side rendering in `src/index.ssr.js` (or `src/index.ssr.tsx`). It exports an express-style request handler, that looks like this:

```js
export default (request, response) => {
  // ...
  response.status(200).send("...");
};
```

Webpack will compile this entry point as a separate library `build/ssr.js`. In production, that library may be imported by an executable node script, which sets up an express server and plugs in the request handler. Such a script is provided as an example at `react-scripts-with-ssr/scripts/serve.js`, which you may start with `npm run serve` to test your production builds. That script however is not part of the compilation. It is up to you to integrate the request handler into your server-side runtime environment.

During development, the request handler will be integrated into the local webpack dev server. Start it with `npm start` and open `http://localhost:3000` to see the server-side rendered output.

If `src/index.ssr.js` exports a function called `devServerHandler`, it will be invoked and its return value will be used as a request handler during development instead. This gives your entry point the possibility to make environment-specific adjustments. For example, all assets are compiled in-memory during development and should not be served from the real file system.

### Relative Urls
`create-react-app` provides a variable called `PUBLIC_URL`, which is accessible via `process.env.PUBLIC_URL` in JavaScript or by using the placeholder `%PUBLIC_URL%` in Html.

For non-ssr projects, the public url has to be known at **compile time**. It is defined via Webpack's `publicPath` property and baked into the client-side js file with the `DefinePlugin` which hardcodes `process.env` into the compiled script.

For ssr projects however, it is possible to configure the PUBLIC_URL as environment variable on the server-side and render them into the client-side output during **runtime** instead. This makes the compiled code location-independent and you don't need to recompile the code if you deploy it to another location. To make this possible, `react-scripts-with-ssr` makes some significant changes:
* The `public/index.html` template is supposed to contain a `<base href="%PUBLIC_URL%/" />` tag
* Urls to other included files in `public/index.html` may be relative and will work in combination with the base tag
* The variable substitution of `%PUBLIC_URL%` must take place during runtime inside the ssr request handler.
* On the client-side, the base tag href value is provided as `process.env.PUBLIC_URL`
* Other environment variables (NODE_ENV and the ones with REACT_APP prefix) are still baked in at compile time

### Transferring ssr data to the client

If you need to "transfer" values from the ssr request handler to the client (e.g. for preloaded state), you can do this:
* Add a variable assignment script `<script>FOO='%FOO%'</script>` to `public/index.html`
* Replace the placeholder in the ssr request handler with `.replace(/%FOO%/g, foo)`


## Contribute

### Merge react-scripts updates

Clone create-react-app and create a subtree branch for react-scripts:

```sh
git clone git@github.com:facebook/create-react-app.git create-react-app
cd create-react-app
git checkout react-scripts@2.1.3
git subtree split -P packages/react-scripts -b react-scripts-v2.1.3
```

Merge the subtree branch into this project:

```sh
git remote add upstream ../create-react-app
git merge upstream react-scripts-v2.1.3
```

## Sponsors

<a href="http://newcubator.com" target="_blank"><img src="sponsor-logo.png"></a>
