import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // GLM 4.7 Configuration - define as global constants
      '__ANTHROPIC_BASE_URL__': JSON.stringify(env.ANTHROPIC_BASE_URL),
      '__ANTHROPIC_AUTH_TOKEN__': JSON.stringify(env.ANTHROPIC_AUTH_TOKEN),
      '__ANTHROPIC_MODEL__': JSON.stringify(env.ANTHROPIC_MODEL),
      // Image API Keys (optional - for stock photos)
      '__PEXELS_API_KEY__': JSON.stringify(env.PEXELS_API_KEY),
      '__PIXABAY_API_KEY__': JSON.stringify(env.PIXABAY_API_KEY),
      // 高德地图 API
      'process.env.AMAP_API_KEY': JSON.stringify(env.AMAP_API_KEY),
      // 和风天气 API
      'process.env.WEATHER_API_KEY': JSON.stringify(env.WEATHER_API_KEY),
      // Amadeus API
      '__AMADEUS_API_KEY__': JSON.stringify(env.AMADEUS_API_KEY),
      '__AMADEUS_API_SECRET__': JSON.stringify(env.AMADEUS_API_SECRET),
    },
  }
})