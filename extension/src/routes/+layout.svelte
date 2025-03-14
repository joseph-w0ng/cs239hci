<script lang="ts">
	import GeminiToken from '$lib/components/custom/geminiToken.svelte';
	import '../app.css';
	let { children } = $props();
</script>

<main class="mx-auto flex w-[596px] flex-col gap-4 p-4 text-left">
	{@render children()}
	<GeminiToken />
</main>
