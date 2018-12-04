const { Sparky, FuseBox, WebIndexPlugin, QuantumPlugin } = require("fuse-box");
const fs = require("fs")

let isProduction = false
if (process.env.NODE_ENV === "production") {
  isProduction = true
}

Sparky.context(class {
  getConfig() {
    return FuseBox.init({
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
  }
});

Sparky.task("default", async (context) => {
  const fuse = context.getConfig();
  fuse.dev(); // launch http server

  fs.watch("./src", {
    recursive: true,
  }, (eventType, filename) => {
    console.log(eventType)
    if (filename) {
      console.log(`filename provided: ${filename}`)
      fuse.sendPageReload()
    } else {
      console.log('filename not provided')
    }
  })
  fuse
    .bundle("meshspin.min.js")
    .instructions(" >index.ts ")
    .watch();

  await fuse.run();
});
