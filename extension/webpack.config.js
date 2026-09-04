/**
 * Webpack 5 config for the FormPilot Chrome extension.
 *
 * Produces separate bundles for:
 *   - background.js  (service worker — no DOM access)
 *   - content.js     (injected into every page)
 *   - sidebar.js     (the slide-out panel)
 *   - popup.js       (the action popup)
 *
 * HTML files and the manifest are copied as-is to dist/.
 * Icons in public/ are copied to dist/public/icons/.
 */

const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env, argv) => ({
  mode: argv.mode || "development",
  devtool: argv.mode === "production" ? false : "inline-source-map",

  entry: {
    background:        "./src/background/service-worker.ts",
    content:           "./src/content/index.ts",
    "dashboard-bridge":"./src/content/dashboard-bridge.ts",
    sidebar:           "./src/sidebar/index.ts",
    popup:             "./src/popup/index.ts",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: { loader: "ts-loader", options: { transpileOnly: true } },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },

  resolve: {
    extensions: [".ts", ".js"],
    alias: { "@lib": path.resolve(__dirname, "src/lib") },
  },

  plugins: [
    new MiniCssExtractPlugin({ filename: "[name].css" }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "src/sidebar/index.html", to: "sidebar.html" },
        { from: "src/popup/index.html",   to: "popup.html" },
        { from: "public/icons",           to: "public/icons" },
      ],
    }),
  ],
});
