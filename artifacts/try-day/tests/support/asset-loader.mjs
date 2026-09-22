/**
 * A module loader hook for the node test runner: pictures and clips imported by
 * client content resolve to their file path as a string, the way Vite hands them
 * to the browser, so content modules that import their own assets can be loaded
 * in a test without a bundler. Registered from a test with
 * `register('./support/asset-loader.mjs', import.meta.url)` before the dynamic
 * import that needs it.
 */
const ASSET = /\.(png|jpe?g|webp|gif|svg|mp4|webm|mp3|wav)$/i;

export async function load(url, context, nextLoad) {
  if (ASSET.test(new URL(url).pathname)) {
    return { format: 'module', shortCircuit: true, source: `export default ${JSON.stringify(url)};` };
  }
  return nextLoad(url, context);
}
