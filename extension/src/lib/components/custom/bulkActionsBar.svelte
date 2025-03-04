<script lang="ts">
	import { cookieCategories } from '$lib/categorize';
	import * as Tooltip from '$lib/components/ui/tooltip/';
	import { X } from 'lucide-svelte';

	let {
		cookies = $bindable(),
		groupedCookies = $bindable(),
		deleteCookiesByCategory
	}: {
		cookies: CookieWithCategory[];
		groupedCookies: Record<string, CookieWithCategory[]>;
		deleteCookiesByCategory: (category: string) => Promise<void>;
	} = $props();
</script>

{#if cookies.length !== 0}
	<div class="flex flex-wrap gap-2">
		{#each Object.entries(groupedCookies) as [category, categoryCookies]}
			{#if categoryCookies.length > 0}
				{@const cookieCategory = cookieCategories[category as cookieCategory]}
				<div
					class="flex h-full items-center gap-1 rounded-full border-2 px-2 py-1 text-sm"
					style="border-color: {cookieCategory.color}; color: {cookieCategory.color}; background-color: {cookieCategory.secondaryColor}"
				>
					<p>{cookieCategory.name} ({categoryCookies.length})</p>
					{#if cookieCategory.name !== 'Essential'}
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger class="h-4 w-4">
									<button onclick={() => deleteCookiesByCategory(category)}>
										<X class="h-4 w-4" />
									</button>
								</Tooltip.Trigger>
								<Tooltip.Content>Remove and Block</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
{/if}
