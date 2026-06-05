const esbuild = require('esbuild');
const path = require('path');

const buildOptions = {
  entryPoints: ['src/index.ts', 'src/lambda/processresults/index.ts'],
  bundle: true, // don't bundle, just transpile
  outdir: 'dist',
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  minify: true,
  external: ['playwright', 'playwright-core'], // exclude playwright modules from bundle to avoid resolution issues
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
};

async function build() {
  try {
    await esbuild.build(buildOptions);
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// When run via `node esbuild.config.js`
if (require.main === module) {
  build();
}

module.exports = { buildOptions, build };