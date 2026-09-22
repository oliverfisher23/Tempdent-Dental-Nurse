import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shell': path.resolve(__dirname, './src/shell'),
      '@kit': path.resolve(__dirname, './src/kit'),
      '@client': path.resolve(__dirname, './src/client'),
      '@assets': path.resolve(__dirname, './src/client/assets')
    }
  }
});