// voice-ai-girlfriend build: esbuild browser bundle shaped like the DSH
// client plugin artifact (lib/client.js, __ModuleLoader__ closure). All
// @deepseek-ai / react imports stay external — the DSH host provides them.
import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'

const PKG_ID = '@beiyege-01/dsh-voice-ai-girlfriend'

const EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-invariants',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-web-react',
]

mkdirSync('lib', { recursive: true })

// Server/node half: the loader imports the profile entry from lib/index.js on
// the node side. It is a deliberate no-op (everything lives in the browser
// half); but the module must EXIST so `dsh` (any version >= rc.8 / 0.1.3)
// can import the entry when it composes the profile plugin tree.
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: false,
  format: 'esm',
  platform: 'node',
  logLevel: 'info',
})

console.log('[voice-ai-girlfriend] build done: lib/index.js (node entry)')

await build({
  entryPoints: ['src/client/index.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  jsx: 'automatic',
  external: EXTERNALS,
  banner: {
    js:
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(PKG_ID)}, factory: (require) => {\n` +
      'var module = { exports: {} }; var exports = module.exports;',
  },
  footer: {
    js: 'return module.exports; } });',
  },
  logLevel: 'info',
})

console.log('[voice-ai-girlfriend] build done: lib/client.js (browser)')
