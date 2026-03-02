import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'https://5dfe-105-71-5-197.ngrok-free.app ',
                changeOrigin: true,
            }
        }
    }
})
