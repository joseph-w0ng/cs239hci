<script lang="ts">
	import { cookieCategories } from '$lib/categorize';
	import * as Tooltip from '$lib/components/ui/tooltip/';
	import { Card } from '../ui/card';
	import { Skeleton } from '../ui/skeleton';

	let {
		cookies = $bindable(),
		groupedCookies = $bindable()
	}: { cookies: CookieWithCategory[]; groupedCookies: Record<string, CookieWithCategory[]> } =
		$props();
</script>

<Card class="p-4">
	<div class="flex flex-col gap-2">
		{#if cookies.length === 0}
			<div class="flex justify-between">
				<Skeleton class="h-6 w-32" />
				<Skeleton class="h-6 w-16" />
			</div>
			<Skeleton class="h-6 w-full" />
		{:else}
			<div class="flex items-center justify-between">
				<h2 class="text-base font-semibold">Quick Summary</h2>
				<span class="text-sm"
					><span class="font-semibold">{cookies.length}</span> cookies found</span
				>
			</div>
			<div class="flex h-6 w-full overflow-clip rounded-md">
				{#each Object.entries(groupedCookies) as [category, categoryCookies]}
					{@const cookieCategory = cookieCategories[category as keyof typeof cookieCategories]}
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger
								class="h-full"
								style="width: {(categoryCookies.length / cookies.length) *
									100}%; background-color: {cookieCategory.color}"
							/>
							<Tooltip.Content>
								<p>
									{cookieCategory.name}
									(<span class="font-semibold">{categoryCookies.length}</span>)
								</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				{/each}
			</div>
		{/if}
	</div>
</Card>
