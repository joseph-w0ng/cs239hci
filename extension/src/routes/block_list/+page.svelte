<script lang="ts">
	import { ArrowLeft, Cookie } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { extractDomain, getFavicon } from '$lib/utilities';
	import fake_block_list from '$lib/data/block_list.json';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Tooltip from '$lib/components/ui/tooltip/';
	import * as Table from '$lib/components/ui/table/';
	import { onMount } from 'svelte';
	import { cookieCategories, extractRootDomain } from '$lib/categorize';
	import { SvelteSet } from 'svelte/reactivity';
	import { Separator } from '$lib/components/ui/separator';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

	let isChrome = $state(typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id);
	let activeDomain = $state('');
	let activeDomainFavicon = $state('');
	let isLoading = $state(true);
	let block_list: BlockedCookieInfo[] = $state([]);

	let selected = $state(new SvelteSet<BlockedCookieInfo>());

	async function initialize() {
		isLoading = true;
		if (isChrome) {
			chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
				if (!tabs.length) return;
				const tab = tabs[0];
				const url = tab.url;
				if (!url) return;
				chrome.storage.local.get(['siteData'], function (result) {
					block_list = result.siteData[activeDomain] || [];
				});
				activeDomain = extractDomain(url);
			});
			isLoading = false;
		} else {
			// For development: Use fake data
			activeDomain = 'www.example.com';
			//@ts-expect-error
			block_list = fake_block_list[activeDomain];
			setTimeout(() => {
				isLoading = false;
			}, 1000);
		}

		activeDomainFavicon = getFavicon(isChrome);
	}

	async function handleUnblockSelected() {
		// Store selected cookies before clearing
		const selectedArray = Array.from(selected);

		// Clear selection first to update UI
		selected.clear();

		if (isChrome) {
			// Get current site data from storage
			chrome.storage.local.get(['siteData'], function (result) {
				const siteData = result.siteData || {};

				// Filter out the selected cookies
				siteData[activeDomain] = (siteData[activeDomain] || []).filter(
					(cookie: BlockedCookieInfo) =>
						!selectedArray.some(
							(selectedCookie) =>
								selectedCookie.domain === cookie.domain && selectedCookie.name === cookie.name
						)
				);

				// Update storage with the new data
				chrome.storage.local.set({ siteData }, function () {
					// Update the local block_list state to reflect changes
					block_list = siteData[activeDomain] || [];
				});
			});
		} else {
			// For development: Update fake data
			block_list = block_list.filter(
				(cookie) =>
					!selectedArray.some(
						(selectedCookie) =>
							selectedCookie.domain === cookie.domain && selectedCookie.name === cookie.name
					)
			);
		}
	}

	async function unblockAll() {
		if (isChrome) {
			// Get current site data from storage
			chrome.storage.local.get(['siteData'], function (result) {
				const siteData = result.siteData || {};

				// Remove all cookies for the active domain
				siteData[activeDomain] = [];

				// Update storage with the new data
				chrome.storage.local.set({ siteData }, function () {
					// Clear the local block_list state
					block_list = [];
					// Clear any selections
					selected.clear();
				});
			});
		} else {
			// For development: Clear all cookies
			block_list = [];
			// Clear any selections
			selected.clear();
		}
	}

	onMount(() => {
		initialize();
	});
</script>

<header class="mb-4 flex items-center justify-between">
	<div class="flex items-center gap-3">
		<Button variant="ghost" class="h-full px-2" href="/">
			<ArrowLeft />
		</Button>
		<div>
			<h1 class="text-xl font-bold">Manage Block List</h1>
			<div class="flex items-center gap-2">
				<Avatar.Root class="size-4 outline-1 outline-offset-1" style="outline: 1px #9ca3af solid">
					<Avatar.Image src={activeDomainFavicon} alt="favicon of current page" />
					<Avatar.Fallback></Avatar.Fallback>
				</Avatar.Root>
				<p class="text-sm leading-none">
					<strong>{extractRootDomain(activeDomain)}</strong>
				</p>
			</div>
		</div>
	</div>
	<Button onclick={unblockAll} disabled={block_list.length === 0}>Unblock All</Button>
</header>
<div class="flex w-full items-center justify-between self-end">
	<Button disabled={selected.size == 0} onclick={handleUnblockSelected}>Unblock Selected</Button>
	<div class="text-sm">
		<strong>{selected.size}</strong> selected
	</div>
</div>

<Separator />

{#if isLoading}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-[100px]"><Skeleton class="h-4 w-4" /></Table.Head>
				<Table.Head><Skeleton class="h-4 w-full" /></Table.Head>
				<Table.Head><Skeleton class="h-4 w-full" /></Table.Head>
				<Table.Head class="text-right"><Skeleton class="h-4 w-full" /></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each Array(3) as _}
				<Table.Row>
					<Table.Cell><Skeleton class="h-4 w-4" /></Table.Cell>
					<Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
					<Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
					<Table.Cell class="flex items-center justify-end gap-2"
						><Skeleton class="h-4 w-full" /></Table.Cell
					>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{:else if block_list.length === 0}
	<div class="text-center">No cookies blocked for this page</div>
{:else}
	<div>
		<strong>{block_list.length}</strong> cookie{block_list.length === 1 ? '' : 's'} blocked on this page
	</div>
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-[100px]">Select</Table.Head>
				<Table.Head>Domain</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head class="text-right">Category</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each block_list as cookie (cookie)}
				{@const category = 'category' in cookie ? cookie.category : 'unknown'}
				<Table.Row>
					<Table.Cell>
						<Checkbox
							onclick={(e) => {
								e.stopPropagation();
								if (selected.has(cookie)) {
									selected.delete(cookie);
								} else {
									selected.add(cookie);
								}
							}}
							class="h-4 w-4"
						/>
					</Table.Cell>
					<Table.Cell>{extractRootDomain(cookie.domain)}</Table.Cell>
					<Table.Cell class="max-w-16 truncate">{cookie.name}</Table.Cell>
					<Table.Cell class="flex items-center justify-end">
						<Tooltip.Provider delayDuration={100}>
							<Tooltip.Root>
								<Tooltip.Trigger class="flex items-center justify-end gap-2">
									<div
										class="size-2 rounded-full"
										style={`background: ${cookieCategories[category].color}`}
									></div>
									{cookieCategories[category].name}
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>
										{cookieCategories[category].description}
									</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/if}
