import * as esbuild from "esbuild";
import * as fs from "fs/promises";
import * as path from "path";
import * as fse from "fs-extra";

let ctx = await esbuild.context({
  entryPoints: [
    "./src/content/index.js",
    "./src/background/index.js",
    "./src/settings/script.js",
  ],
  outdir: "dist",
  bundle: true,
  format: "esm",
  allowOverwrite: true,
  plugins: [
    {
      name: "rebuild-notify",
      setup(build) {
        build.onEnd(async (result) => {
          // Copy all files from dist directory to firefox directory except manifest.json
          const files = await fs.readdir("dist");
          await Promise.all(
            files.map(async (file) => {
              if (file !== "manifest.json" || file !== "logo") {
                const srcPath = path.join("dist", file);
                const destPath = path.join("firefox", file);

                // Use fse.copy with the recursive option
                await fse.copy(srcPath, destPath, {
                  overwrite: true,
                });
              }
            })
          );
          // Replace "chrome." with "browser." in the firefox directory
          await replaceChromeWithBrowser("firefox");
        });
      },
    },
  ],
});

await ctx.watch();

async function replaceChromeWithBrowser(directory) {
  const firefoxFiles = await getAllFiles(directory);
  await Promise.all(
    firefoxFiles.map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf8");
      const replacedContent = content.replace(/chrome\./g, "browser.");
      await fs.writeFile(filePath, replacedContent, "utf8");
    })
  );
}

async function getAllFiles(directory) {
  const files = await fs.readdir(directory, { withFileTypes: true });
  const fileArray = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(directory, file.name);
      if (file.isDirectory()) {
        return getAllFiles(filePath);
      } else {
        return filePath;
      }
    })
  );
  return fileArray.flat();
}
console.log("Watching silently...");
