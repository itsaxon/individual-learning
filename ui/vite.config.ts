import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  // 部署在子路径时，base 会自动应用到所有资源引用路径
  // 部署在 http://8.156.64.154/moyu/ 下，base 为 '/moyu/'
  base: '/moyu/',
  build: {
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js 生态独立 chunk（可单独缓存）
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
          // 动效库独立 chunk
          motion: ['framer-motion'],
          tilt: ['react-parallax-tilt'],
        },
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths()
  ],
})
