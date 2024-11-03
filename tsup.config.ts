import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'], // Entry point
  format: ['cjs'], // Output formats
  outDir: 'dist', // Output directory
  sourcemap: true, // Generate sourcemaps
  clean: true, // Clean the output directory before each build
}); 