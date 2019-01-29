const express = require('express');
const path = require('path');
const paths = require('../config/paths');

// read environment variables
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
require('../config/env');

const PORT = parseInt(process.env.PORT) || 3000;
const PUBLIC_PATH = process.env.PUBLIC_PATH || '/';

// include compiled server-side request handler
const ssrModuleFile = path.resolve(paths.appBuild, "ssr.js");
const ssrModule = require(ssrModuleFile);

// start express server
console.log(`Serving from '${process.cwd()}' with public path '${PUBLIC_PATH}'`);
const app = express();
app.use(PUBLIC_PATH, ssrModule.default);
app.listen(PORT, () => console.log(`Open http://localhost:${PORT}${PUBLIC_PATH} for testing!`));
