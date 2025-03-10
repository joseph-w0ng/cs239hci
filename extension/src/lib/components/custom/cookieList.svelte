<script lang="ts">
	import { cookieCategories } from '$lib/categorize';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Label } from '$lib/components/ui/label/';
	import { Switch } from '$lib/components/ui/switch';
	import { Separator } from '$lib/components/ui/separator';
	import IndividualCookie from './individualCookie.svelte';
	import { Button } from '../ui/button';
	import { SvelteSet } from 'svelte/reactivity';

	let {
		cookies = $bindable(),
		groupedCookies = $bindable(),
		deleteCookie,
		deleteSelectedCookies
	}: {
		cookies: CookieWithCategory[];
		groupedCookies: Record<string, CookieWithCategory[]>;
		deleteCookie: (cookie: CookieWithCategory) => Promise<void>;
		deleteSelectedCookies: (cookies: CookieWithCategory[]) => Promise<void>;
	} = $props();

	// let selectMode = $state(false);
	let selected = $state(new SvelteSet<CookieWithCategory>());

	function onSelect(cookie: CookieWithCategory) {
		if (selected.has(cookie)) {
			selected.delete(cookie);
		} else {
			selected.add(cookie);
		}
	}
</script>

<Separator />

<div class="flex w-full items-center justify-between self-end">
	<Button
		variant="destructive"
		disabled={selected.size == 0}
		onclick={() => {
			deleteSelectedCookies(Array.from(selected));
			selected.clear();
		}}
	>
		Block Selected
	</Button>
	<div class="text-sm">
		<strong>{selected.size}</strong> selected
	</div>
	<!-- <div class="flex items-center gap-2">
		<Switch
			id="select-mode"
			bind:checked={selectMode}
			onclick={() => {
				if (selectMode) {
					selected.clear();
				}
			}}
		/>
		<Label for="select-mode">Selectable</Label>
	</div> -->
</div>

<Accordion.Root type="single" class="w-full">
	{#each Object.entries(groupedCookies) as [category, categoryCookies], i (category)}
		{#if categoryCookies.length > 0}
			{@const cookieCategory = cookieCategories[category as cookieCategory]}
			<Accordion.Item value={category}>
				<Accordion.Trigger>
					<div class="flex items-center justify-center gap-2">
						<div
							class="h-3 w-3 rounded-full"
							style="background-color: {cookieCategory.color}"
						></div>
						<div class="flex flex-col items-start justify-center">
							<div class="text-base font-semibold">
								{cookieCategory.name} ({categoryCookies.length})
							</div>
							<div class="text-muted-foreground text-xs font-normal italic">
								({cookieCategory.description})
							</div>
						</div>
					</div>
				</Accordion.Trigger>
				<Accordion.Content>
					<div class="flex flex-col gap-2">
						{#each categoryCookies as cookie}
							<IndividualCookie {cookie} {deleteCookie} {onSelect} />
						{/each}
					</div>
				</Accordion.Content>
			</Accordion.Item>
		{/if}
	{/each}
</Accordion.Root>
