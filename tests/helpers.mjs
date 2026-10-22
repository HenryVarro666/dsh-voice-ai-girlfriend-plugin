import { createRequire } from 'node:module'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)

/** Bundle only the module under test; the DSH host is not needed. */
export async function load(file, globals = {}) {
  const entryPoint = fileURLToPath(new URL(`../src/client/${file}`, import.meta.url))
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    tsconfigRaw: {},
  })
  const module = { exports: {} }
  vm.runInNewContext(result.outputFiles[0].text, {
    module,
    exports: module.exports,
    require,
    console,
    ...globals,
  })
  return module.exports
}
