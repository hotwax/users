/// <reference types="vitest" />

import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { versionInfoUtil } from '../../common/utils/versionInfoUtil'
import manifest from './manifest.json'
import pkg from './package.json'

export default defineConfig({
  plugins: [
    vue(),
    legacy({
      targets: ['> 1%', 'last 2 versions', 'not dead']
    }),
    VitePWA({
      registerType: "autoUpdate",
      selfDestroying: true,
      manifest: manifest as any,
      devOptions: {
        enabled: true
      }
    })
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION_INFO': JSON.stringify(JSON.stringify(versionInfoUtil.getVersionInfo(pkg.version)))
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@common': path.resolve(__dirname, '../../common'),
      vue: 'vue/dist/vue.esm-bundler.js'
    }
  },
  server: {
    port: 8100
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
