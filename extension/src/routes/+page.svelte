<script lang="ts">
	import { onMount } from 'svelte';
	import fake_cookie_data from '$lib/data/cookies.json';
	import categorizeCookie, { cookieCategories } from '$lib/categorize';
	import Breakdown from '$lib/components/custom/breakdown.svelte';
	import BulkActionsBar from '$lib/components/custom/bulkActionsBar.svelte';
	import CookieList from '$lib/components/custom/cookieList.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let cookies: CookieWithCategory[] = [];
	let groupedCookies: Record<string, CookieWithCategory[]> = {};
	let isChrome = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
	let activeDomain = '';
	let selectedCategory: string | null = null;
	let showRawData = false;
	let deleteStatus: { [key: string]: string } = {};
	let bulkActionMode = false;
	let selectedCookies: Set<string> = new Set();
	let cookiesDeleted = 0;
	let isDeleting = false;

	function groupCookiesByCategory(cookieList: CookieWithCategory[]) {
		const grouped: Record<string, CookieWithCategory[]> = {};

		for (const category of Object.keys(cookieCategories)) {
			grouped[category] = cookieList.filter((cookie) => cookie.category === category);
		}

		return grouped;
	}

	function updateBadgeCount(count: number) {
		chrome.action.setBadgeText({ text: count.toString() });
	}

	function extractDomain(url: string) {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname;
		} catch (e) {
			return 'unknown domain';
		}
	}

	function getCookieStats() {
		const total = cookies.length;
		const stats = {
			total,
			categories: Object.keys(groupedCookies).map((category) => ({
				name: cookieCategories[category as cookieCategory].name,
				count: groupedCookies[category].length,
				percentage: Math.round((groupedCookies[category].length / total) * 100) || 0
			}))
		};
		return stats;
	}

	async function deleteCookie(cookie: CookieWithCategory) {
		if (!isChrome) {
			// For development environment, simulate deletion
			cookies = cookies.filter((c) => c.name !== cookie.name);
			groupedCookies = groupCookiesByCategory(cookies);
			deleteStatus[cookie.name] = 'Deleted (simulated)';
			setTimeout(() => {
				delete deleteStatus[cookie.name];
			}, 3000);
			return;
		}

		deleteStatus[cookie.name] = 'Deleting...';

		// In Chrome extension, use the cookies API to remove the cookie
		const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;

		try {
			let cookieToBlock = { name: cookie.name, domain: cookie.domain };
			console.log(cookieToBlock);
			await chrome.cookies.remove({
				url,
				name: cookie.name,
				storeId: cookie.storeId
			});

			deleteStatus[cookie.name] = 'Deleted';
			cookies = cookies.filter((c) => c.name !== cookie.name);
			groupedCookies = groupCookiesByCategory(cookies);
			cookiesDeleted++;

			setTimeout(() => {
				delete deleteStatus[cookie.name];
			}, 3000);

			chrome.runtime.sendMessage({ action: 'blockCookies', cookieToBlock });
		} catch (e) {
			deleteStatus[cookie.name] = 'Error: Could not delete';
			console.error('Error deleting cookie:', e);

			setTimeout(() => {
				delete deleteStatus[cookie.name];
			}, 3000);
		}
	}

	async function deleteCookiesByCategory(category: string) {
		if (!cookieCategories[category as cookieCategory].canDelete) {
			return;
		}

		isDeleting = true;
		const cookiesToDelete = groupedCookies[category];

		for (const cookie of cookiesToDelete) {
			await deleteCookie(cookie);
		}
		isDeleting = false;
	}

	async function deleteSelectedCookies() {
		isDeleting = true;
		for (const cookieName of selectedCookies) {
			const cookie = cookies.find((c) => c.name === cookieName);
			if (cookie) {
				await deleteCookie(cookie);
			}
		}
		cookies = cookies;
		selectedCookies.clear();
		bulkActionMode = false;
		isDeleting = false;
	}

	function toggleCookieSelection(cookieName: string) {
		if (selectedCookies.has(cookieName)) {
			selectedCookies.delete(cookieName);
		} else {
			selectedCookies.add(cookieName);
		}
		selectedCookies = selectedCookies; // Trigger reactivity
	}

	function reloadCookies() {
		if (!isChrome) return;

		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (!tabs.length) return;
			const url = tabs[0].url;
			if (!url) return;

			activeDomain = extractDomain(url);

			chrome.cookies.getAll({ url }, (cookieArray) => {
				updateBadgeCount(cookieArray.length);
				cookies = cookieArray.map(categorizeCookie);
				groupedCookies = groupCookiesByCategory(cookies);
				cookiesDeleted = 0;
			});
		});
	}

	onMount(() => {
		if (isChrome) {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				if (!tabs.length) return;
				const url = tabs[0].url;
				if (!url) return;

				activeDomain = extractDomain(url);

				chrome.cookies.getAll({ url }, (cookieArray) => {
					updateBadgeCount(cookieArray.length);
					cookies = cookieArray.map(categorizeCookie);
					groupedCookies = groupCookiesByCategory(cookies);
				});
			});
		} else {
			// For development: Use fake data
			cookies = (fake_cookie_data as chrome.cookies.Cookie[]).map(categorizeCookie);
			activeDomain = 'example.com';
			groupedCookies = groupCookiesByCategory(cookies);
		}
	});

	function selectCategory(category: string) {
		selectedCategory = selectedCategory === category ? null : category;
	}

	// Get cookies that can be deleted (non-essential)
	function getDeletableCookies() {
		return cookies.filter(
			(cookie) => cookieCategories[cookie.category as cookieCategory].canDelete
		);
	}
</script>

<main class="mx-auto flex w-[576px] flex-col gap-4 p-4">
	<header class="mb-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<img class="h-8 w-8" src="/favicon.png" alt="Logo" />
			<div>
				<h1 class="text-xl font-bold">Cookie Clear</h1>
				<p class="text-sm">Domain: <strong>{activeDomain}</strong></p>
			</div>
		</div>

		<div class="flex gap-2">
			<Button variant="outline" onclick={reloadCookies}>↻ Reload</Button>

			<Button>Manage Block List</Button>

			<!-- {#if getDeletableCookies().length > 0}
				<button
					class="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
					on:click={() => (bulkActionMode = !bulkActionMode)}
					class:bg-blue-100={bulkActionMode}
				>
					{bulkActionMode ? '✓ Select mode' : '☐ Select cookies'}
				</button>
			{/if} -->
		</div>
	</header>

	<Breakdown {cookies} {groupedCookies} />

	<BulkActionsBar {cookies} {groupedCookies} {deleteCookiesByCategory} />

	<CookieList {deleteSelectedCookies} {cookies} {groupedCookies} {deleteCookie} />

	{#if cookies.length === 0}
		<!-- <div class="rounded bg-gray-100 p-4 text-center">
			{cookiesDeleted > 0
				? 'All cookies have been deleted!'
				: 'Loading cookies or no cookies found for this page.'}
		</div> -->
	{:else}
		<!-- Cookie Summary -->
		<!-- <div class="mb-4 rounded bg-gray-100 p-3">
			<div class="flex items-center justify-between">
				<h2 class="font-semibold">Summary</h2>
				<span class="text-sm">{cookies.length} cookies found</span>
			</div>

			<div class="mt-2 flex h-6 overflow-hidden rounded">
				{#each Object.entries(groupedCookies) as [category, categoryCookies]}
					{#if categoryCookies.length > 0}
						<div
							class="tooltip h-full"
							style="background-color: {cookieCategories[category as keyof typeof cookieCategories]
								.color}; width: {(categoryCookies.length / cookies.length) * 100}%;"
						>
							<span class="tooltiptext">
								{cookieCategories[category as keyof typeof cookieCategories].name}:
								{categoryCookies.length} ({Math.round(
									(categoryCookies.length / cookies.length) * 100
								)}%)
							</span>
						</div>
					{/if}
				{/each}
			</div>
		</div> -->

		<!-- Bulk actions bar -->
		<!-- {#if bulkActionMode && selectedCookies.size > 0}
			<div class="mb-4 flex items-center justify-between rounded bg-blue-50 p-2">
				<span>{selectedCookies.size} cookie{selectedCookies.size !== 1 ? 's' : ''} selected</span>
				<div class="flex gap-2">
					<button
						class="rounded bg-red-100 px-2 py-1 text-xs hover:bg-red-200"
						on:click={deleteSelectedCookies}
						disabled={isDeleting}
					>
						{isDeleting ? 'Deleting...' : 'Delete selected'}
					</button>
					<button
						class="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
						on:click={() => selectedCookies.clear()}
					>
						Clear selection
					</button>
				</div>
			</div>
		{/if} -->

		<!-- Category Buttons -->
		<!-- <div class="mb-4 flex flex-wrap gap-2">
			{#each Object.entries(cookieCategories) as [category, info]}
				{#if groupedCookies[category]?.length}
					<div class="flex items-center">
						<button
							class="flex items-center gap-1 rounded-l px-3 py-1 text-sm text-white"
							style="background-color: {info.color}; opacity: {selectedCategory === category ||
							!selectedCategory
								? 1
								: 0.5}"
							on:click={() => selectCategory(category)}
						>
							{info.name} ({groupedCookies[category].length})
						</button>

						{#if info.canDelete && groupedCookies[category].length > 0}
							<button
								class="flex h-full items-center rounded-r bg-gray-700 px-2 py-1 text-sm text-white opacity-90 hover:opacity-100"
								on:click={() => deleteCookiesByCategory(category)}
								disabled={isDeleting}
								title={`Delete all ${info.name.toLowerCase()} cookies`}
							>
								{isDeleting ? '...' : '✕'}
							</button>
						{/if}
					</div>
				{/if}
			{/each}
		</div> -->

		<!-- Cookie List by Category -->
		<!-- {#each Object.entries(groupedCookies) as [category, categoryCookies]}
			{#if (selectedCategory === category || !selectedCategory) && categoryCookies.length > 0}
				<div class="mb-4">
					<div class="mb-2 flex items-center gap-2">
						<div
							class="h-4 w-4 rounded-full"
							style="background-color: {cookieCategories[category as keyof typeof cookieCategories]
								.color}"
						></div>
						<div class="flex w-full items-center justify-between">
							<h2 class="font-semibold">
								{cookieCategories[category as keyof typeof cookieCategories].name} Cookies
								<span class="ml-1 text-xs font-normal text-gray-500">
									{cookieCategories[category as keyof typeof cookieCategories].canDelete
										? '(can be deleted)'
										: '(required for site functionality)'}
								</span>
							</h2>
						</div>
					</div>
					<p class="mb-2 text-sm italic">
						{cookieCategories[category as keyof typeof cookieCategories].description}
					</p>
					{#each categoryCookies as cookie}
						<div
							role="button"
							tabindex="0"
							on:click={() => selectCookie(cookie)}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') selectedCookie = cookie;
							}}
							class="relative mb-2 rounded border p-3 hover:bg-gray-50"
						>
							{#if bulkActionMode && cookieCategories[cookie.category as keyof typeof cookieCategories].canDelete}
								<div class="absolute left-1 top-1">
									<input
										type="checkbox"
										checked={selectedCookies.has(cookie.name)}
										on:change={() => toggleCookieSelection(cookie.name)}
										on:click|stopPropagation
									/>
								</div>
							{/if}

							<div class="flex justify-between" style={bulkActionMode ? 'padding-left: 20px;' : ''}>
								<div class="font-medium">{cookie.name}</div>
								<div class="flex items-center gap-2">
									<div class="text-xs text-gray-500">
										{cookie.secure ? '🔒 Secure' : ''}
										{cookie.httpOnly ? '🔐 HttpOnly' : ''}
									</div>

									{#if cookieCategories[cookie.category as keyof typeof cookieCategories].canDelete && !bulkActionMode}
										{#if deleteStatus[cookie.name]}
											<span class="text-xs italic">{deleteStatus[cookie.name]}</span>
										{:else}
											<button
												class="ml-2 rounded bg-red-50 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100"
												on:click|stopPropagation={() => deleteCookie(cookie)}
											>
												Delete
											</button>
										{/if}
									{/if}
								</div>
							</div>
							<div class="text-sm text-gray-700">{cookie.description}</div>
							<div class="mt-1 text-xs text-gray-500">
								Expires: {formatExpiryDate(cookie.expirationDate)}
							</div>
							{#if showRawData}
								<div class="mt-2 break-all rounded bg-gray-100 p-2 text-xs">
									<div>Domain: {cookie.domain}</div>
									<div>Path: {cookie.path}</div>
									<div>
										Value: {cookie.value.substring(0, 50)}{cookie.value.length > 50 ? '...' : ''}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/each}
		{#if selectedCookie}
			<div class="overlay">
				<div class="overlay-content">
					<button class="close-button" on:click={closeOverlay}>Close</button>
					<h2>{selectedCookie.name}</h2>
					<p><strong>Description:</strong> {selectedCookie.description}</p>
					<p><strong>Domain:</strong> {selectedCookie.domain}</p>
					<p><strong>Path:</strong> {selectedCookie.path}</p>
					<p><strong>Expires:</strong> {formatExpiryDate(selectedCookie.expirationDate)}</p>
					{#if selectedCookie.secure}
						<p><strong>Secure:</strong> Yes</p>
					{/if}
					{#if selectedCookie.httpOnly}
						<p><strong>HttpOnly:</strong> Yes</p>
					{/if}
				</div>
			</div>
		{/if} -->

		<!-- <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
			<button class="underline" on:click={() => (showRawData = !showRawData)}>
				{showRawData ? 'Hide raw cookie data' : 'Show raw cookie data'}
			</button>

			{#if cookiesDeleted > 0}
				<div>
					<span class="text-green-600"
						>{cookiesDeleted} cookie{cookiesDeleted !== 1 ? 's' : ''} deleted</span
					>
				</div>
			{/if}
		</div> -->
	{/if}
</main>
