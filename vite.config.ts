import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
    'global': 'window'
  },
  plugins: [
    monkey({
      entry: 'src/app.tsx',
      userscript: {
        name: 'ZenTao Monthly Consumed Report',
        namespace: 'zentao-userscript',
        version: '0.1.0',
        description: 'Floating report to sum consumed hours of finished tasks per user for selected month',
        author: 'FangHaoming',
        match: [
          '*://*/zentao/*'
        ],
        grant: 'none'
      },
      build: {
        fileName: 'zentao-userscript.user.js'
      }
    })
  ],
  server: {
    proxy: {
      // Proxy dev API to avoid CORS
      '/ztapi': {
        target: 'http://www.zentao.rayvision.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ztapi/, '/zentao/api.php/v1'),
        headers: {
          // Allow passing Token header from the browser; no special header needed here
        }
      }
    }
  },
  build: {
    sourcemap: false,
    target: 'es2019'
  }
})


