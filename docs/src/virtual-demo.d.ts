declare module 'virtual:docs-kit/demo/*' {
    interface DemoManifestEntry {
        code: string
        lang: string
        html?: { light: string; dark: string }
    }

    const entry: DemoManifestEntry
    export default entry
}
