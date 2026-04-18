export default {
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}
