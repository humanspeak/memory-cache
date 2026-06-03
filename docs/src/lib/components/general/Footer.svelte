<script lang="ts">
    import { FooterV2 } from '@humanspeak/docs-kit'
    import rootPkg from '../../../../../package.json'

    const PKG_VERSION = rootPkg.version
</script>

<FooterV2 version={PKG_VERSION} />
