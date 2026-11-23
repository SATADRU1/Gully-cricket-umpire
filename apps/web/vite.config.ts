import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // host: true lets your phone open the dev server over Wi-Fi (http://<laptop-ip>:5173)
  server: { host: true },
});