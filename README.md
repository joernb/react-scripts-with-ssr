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

### Relative Urls, PUBLIC_URL and BASE_HREF
`create-react-app` provides a variable called `PUBLIC_URL`, which is accessible via `process.env.PUBLIC_URL` in JavaScript or by using the placeholder `%PUBLIC_URL%` in HTML to reference assets. This variable is determined at **compile time** and must be specified before compilation, which makes your compiled web app dependant on the specified location.

For projects with server-side rendering however, there is another, possibly better way to deal with this. Instead of hardcoding the public url, HTML assets can be referenced with a relative url and the server-side renderer can read a specified base url at **runtime** and render it into a base tag. `react-scripts-with-ssr` supports using `PUBLIC_URL` but recommends the described approach using the `BASE_HREF` environment variable:
* Define a `BASE_HREF` environment variable in your server runtime environment containing your base url (e.g. `https://example.com/folder`).
* Add `<base href="%BASE_HREF%/" />` to your index.html template. Notice the trailing slash.
* Replace `%BASE_HREF%` with the value of `process.env.BASE_HREF` in your server-side request handler.
* Make all asset references in HTML relative. Do not use `%PUBLIC_URL%` in URLs or server-relative URLs (e.g. `/some/url`).
* Make the build scripts emit relative paths by providing `PUBLIC_URL` as environment variable with the value `.` during compile time or setting the `homepage` field in `package.json` to `.`.
* If you need access to BASE_HREF in JavaScript, read it from `document.getElementsByTagName("base")[0].href;`.

### Using runtime environment variables on the client

`create-react-app` provides `process.env` on the client-side to access environment variables prefixed with REACT_APP and defined at **compile time**.

However, if you want to make your server's **runtime** environment variables available on the client-side, you can do this with a `clientEnv` variable:
* Add a variable assignment script `<script>clientEnv=%CLIENT_ENV%</script>` to the head section in `public/index.html`.
* Replace the placeholder in the ssr request handler with `.replace(/%CLIENT_ENV%/g, JSON.stringify({ FOO: 'bar' }))`.
* Access the value on the client-side with `clientEnv.FOO`.
* For TypeScript: Declare the global variable `declare const clientEnv: NodeJS.ProcessEnv;`.

You might also use this mechanism to transfer preloaded state to the client.


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
