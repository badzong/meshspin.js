const { FuseBox, WebIndexPlugin, QuantumPlugin } = require("fuse-box");
let isProduction = false
if (process.env.NODE_ENV === "production") {
  isProduction = true
}

const fuse = FuseBox.init({
  homeDir: "src",
  globals: {
    "mesh-spin": {
      'MeshSpin': 'MeshSpin'
    }
  },
  package: "mesh-spin",
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
    })
  ],
  cache: false,
});
fuse.dev(); // launch http server
fuse
  .bundle("app")
  .instructions(" >meshspin.js ")
  .watch();
fuse.run();
