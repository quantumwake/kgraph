import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/ism/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    // code-split so the ism addon shares the core chunk instead of duplicating it
    splitting: true,
    external: ['react', 'react-dom', 'lucide-react'],
    treeshake: true,
});
