/**
 * `plotly.js` ships prebuilt bundles that `@types/plotly.js` does not declare.
 *
 * `react-plotly.js` requires exactly this specifier, so anything reaching for
 * Plotly's imperative API (`downloadImage`) must import the same one — importing
 * `plotly.js` instead resolves to the source build and pulls a second, multi-MB
 * copy of Plotly into the bundle rather than reusing the module the plot is
 * already running on.
 */
declare module "plotly.js/dist/plotly" {
  export * from "plotly.js";
}
