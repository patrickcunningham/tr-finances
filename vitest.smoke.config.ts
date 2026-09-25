import { defineConfig } from 'vitest/config'

export default defineConfig({ test: { include: ['scripts/**/*.smoke.ts'], testTimeout: 30_000 } })
