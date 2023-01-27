import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: [
    './src/content/index.js',
    './src/background/index.js',
  ],
  outdir: 'dist',
  bundle: true,
  allowOverwrite: true
})

await ctx.watch()
console.log('watching silently...')
