import { defineConfig, loadEnv } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  define: {
    'import.meta.env': loadEnv('', process.cwd(), '')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
