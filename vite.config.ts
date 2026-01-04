import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'MemoryCache',
            fileName: 'index',
            formats: ['es']
        },
        rollupOptions: {
            external: [],
            output: {
                globals: {}
            }
        },
        sourcemap: true,
        minify: false
    },
    plugins: [
        dts({
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts']
        })
    ],
    test: {
        include: ['src/**/*.test.ts'],
        globals: true,
        coverage: {
            reporter: ['text', 'lcov'],
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/index.ts']
        },
        reporters: ['verbose', ['junit', { outputFile: './junit-vitest.xml' }]]
    }
})
