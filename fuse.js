const { FuseBox, WebIndexPlugin, QuantumPlugin } = require("fuse-box");
let isProduction = false
if (process.env.NODE_ENV === "production") {
  isProduction = true
}

const fuse = FuseBox.init({
  homeDir: "src",
  //  globals: { MeshSpin: "MeshSpin"},
  debug: true,
  target: "browser@es6",
  output: "dist/$name.js",
  useTypescriptCompiler: true,
  plugins: [
    WebIndexPlugin({
      template: "src/index.html"
    }),
    isProduction && QuantumPlugin({
      target: "npm-browser",
      treeshake: true,
      uglify: true,
      bakeApiIntoBundle: "meshspin.min.js",
      containedAPI: true,
    })
  ],
  cache: false,
});
fuse.dev(); // launch http server
fuse
  .bundle("meshspin.min.js")
  .instructions(" >index.ts ")
  .watch();
fuse.run();
