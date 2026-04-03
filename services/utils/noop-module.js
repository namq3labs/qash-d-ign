// No-op stub module for removed packages.
// Webpack aliases missing packages to this file so dynamic imports compile
// without "Module not found" errors. Any runtime call will get a Proxy that
// returns safe defaults (empty strings, no-op functions, empty objects).

const handler = {
  get(_target, prop) {
    if (prop === "__esModule") return true;
    if (prop === "default") return new Proxy({}, handler);
    // Return a function that itself returns a proxy, so chained calls work
    return new Proxy(function () {}, handler);
  },
  apply() {
    return new Proxy({}, handler);
  },
  construct() {
    return new Proxy({}, handler);
  },
};

module.exports = new Proxy({}, handler);
module.exports.default = module.exports;
