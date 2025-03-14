<script lang="ts">
	import { extractRootDomain } from '$lib/categorize';
	import * as Avatar from '$lib/components/ui/avatar/';
	import * as Tooltip from '$lib/components/ui/tooltip/';
	import { cn } from '$lib/utils';

	let {
		url,
		tooltip = true,
		class: className = '',
		style = ''
	}: {
		url: string;
		tooltip?: boolean;
		outline?: boolean;
		class?: string;
		style?: string;
	} = $props();
	let domain = $derived(extractRootDomain(url));
</script>

{#snippet avatar()}
	<Avatar.Root class={cn('size-5 bg-white', className)} {style}>
		<Avatar.Image src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} />
		<Avatar.Fallback></Avatar.Fallback>
	</Avatar.Root>
{/snippet}

{#if tooltip}
	<Tooltip.Provider delayDuration={100}>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{@render avatar()}
			</Tooltip.Trigger>
			<Tooltip.Content>
				{domain}
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{:else}
	{@render avatar()}
{/if}
