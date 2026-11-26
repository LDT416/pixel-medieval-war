import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1' },
  build: { modulePreload: false },
  plugins: [{
    name: 'offline-game',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const page = bundle['index.html']
        if (page?.type !== 'asset') return
        let html = String(page.source)
        for (const [file, asset] of Object.entries(bundle)) {
          const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          if (asset.type === 'chunk' && asset.isEntry) {
            const tag = new RegExp('<script[^>]+src="(?:\\./)?' + escaped + '"[^>]*></script>')
            html = html.replace(tag, () => '<script type="module">' + asset.code.replace(/<\/script/gi, '<\\/script') + '</script>')
          } else if (asset.type === 'asset' && file.endsWith('.css')) {
            const tag = new RegExp('<link[^>]+href="(?:\\./)?' + escaped + '"[^>]*>')
            html = html.replace(tag, () => '<style>' + asset.source + '</style>')
          }
        }
        page.source = html
      },
    },
  }],
})
