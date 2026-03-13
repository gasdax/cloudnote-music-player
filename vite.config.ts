/** @type {import('vite').Plugin} */
function TauriPlugin() {
    return {
        name: 'vite-plugin-tauri',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.url === '/tauri') {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ tauri: { event: 'test' } }));
                    return;
                }
                next();
            });
        },
    };
}

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
