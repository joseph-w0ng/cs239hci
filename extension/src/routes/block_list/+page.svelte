<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	let siteData = $state({});

	$effect(() => {
		chrome.storage.local.get(['siteData'], function (result) {
			siteData = result.siteData || {};
		});
	});
</script>

<Button variant="ghost" href="/">
	<ArrowLeft />
</Button>

{JSON.stringify(siteData)}
