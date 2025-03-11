<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<main class="mx-auto flex w-[596px] flex-col gap-4 p-4">
	{@render children()}
</main>
