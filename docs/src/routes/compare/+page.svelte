<script lang="ts">
    import { CompareIndexV2 } from '@humanspeak/docs-kit'
    import { competitors, ours } from '$lib/compare-data'
</script>

<CompareIndexV2
    {competitors}
    {ours}
    introHtml="Honest, side-by-side comparisons of <b>@humanspeak/memory-cache</b> against the caching libraries you’d consider instead — <b>node-cache</b>, <b>lru-cache</b>, and <b>Keyv</b>. Feature matrices, pros / cons, verdicts. No spin."
/>
