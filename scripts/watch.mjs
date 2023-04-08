import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: [
    './src/content/index.js',
    './src/background/index.js',
    './src/settings/script.js',
  ],
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  allowOverwrite: true
})

await ctx.watch()
console.log('watching silently...')
