<script lang="ts">
	import { onMount } from 'svelte';
	import fake_cookie_data from '$lib/data/cookies.json';
	import categorizeCookie, { cookieCategories, extractRootDomain } from '$lib/categorize';
	import Breakdown from '$lib/components/custom/breakdown.svelte';
	import BulkActionsBar from '$lib/components/custom/bulkActionsBar.svelte';
	import CookieList from '$lib/components/custom/cookieList.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Tooltip from '$lib/components/ui/tooltip/';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import ThirdPartyAlert from '$lib/components/custom/thirdPartyAlert.svelte';
	import TutorialOverlay from '$lib/components/custom/tutorialOverlay.svelte';
	import { RotateCw } from 'lucide-svelte';
	import { extractDomain } from '$lib/utilities';

	let cookies = $state<CookieWithCategory[]>([]);
	let isChrome = $state(typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id);
	let activeDomain = $state('');
	let deleteStatus = $state<{ [key: string]: string }>({});
	let cookiesDeleted = $state(0);
	let isDeleting = $state(false);
	let activeDomainFavicon = $state('');
	let isLoading = $state(true);
	let resource_list = $state([]);
	let showTutorial = $state(false); // State for tutorial visibility

	let groupedCookies: Record<string, CookieWithCategory[]> = $derived(
		groupCookiesByCategory(cookies)
	);

	function groupCookiesByCategory(cookieList: CookieWithCategory[]) {
		const grouped: Record<string, CookieWithCategory[]> = {};

		for (const category of Object.keys(cookieCategories)) {
			grouped[category] = cookieList.filter((cookie) => cookie.category === category);
		}

		return grouped;
	}

	function updateBadgeCount(count: number) {
		if (isChrome) {
			chrome.action.setBadgeText({ text: count.toString() });
		}
	}

	async function getResourceUrls(tabId: number) {
		function getPerformanceEntries() {
			return performance.getEntriesByType('resource').map((r) => r.name);
		}

		try {
			const results = await chrome.scripting.executeScript({
				target: { tabId },
				func: getPerformanceEntries
			});

			return results[0].result;
		} catch (error) {
			console.error('Error getting performance entries:', error);
			return [];
		}
	}

	async function getAllResourceCookies(tabId: number) {
		if (!isChrome) {
			cookies = (fake_cookie_data as chrome.cookies.Cookie[]).map((cookie) =>
				categorizeCookie(cookie, activeDomain)
			);
			activeDomain = 'www.example.com';
			isLoading = false;
			return;
		}

		try {
			const resourceUrls = await getResourceUrls(tabId);

			const origins = resourceUrls
				?.map((url: string) => {
					try {
						return new URL(url).origin;
					} catch (e) {
						return null;
					}
				})
				.filter((url: string | null) => Boolean(url) && url !== 'null');

			const uniqueOrigins = new Set(origins);

			if (activeDomain) {
				uniqueOrigins.add(`http://${activeDomain}`);
				uniqueOrigins.add(`https://${activeDomain}`);
			}

			const getCookiesPromises = [];

			for (const url of uniqueOrigins) {
				if (url) {
					const promise = chrome.cookies.getAll({ url }).then((cookies) => ({
						url,
						cookies
					}));

					getCookiesPromises.push(promise);
				}
			}

			const urlCookies = await Promise.all(getCookiesPromises);

			const filtered = urlCookies.filter((c) => c.cookies.length);

			const allCookies = [];
			const cookieNames = new Set();

			for (const { cookies: originCookies } of filtered) {
				for (const cookie of originCookies) {
					const cookieKey = `${cookie.domain}|${cookie.name}|${cookie.path}`;
					if (!cookieNames.has(cookieKey)) {
						cookieNames.add(cookieKey);
						allCookies.push(cookie);
					}
				}
			}

			updateBadgeCount(allCookies.length);

			cookies = allCookies.map((cookie) => categorizeCookie(cookie, activeDomain));

			console.log('Found cookies from all resources:', allCookies.length);

			isLoading = false;
		} catch (error) {
			console.error('Error getting all resource cookies:', error);
			isLoading = false;
		}
	}

	async function deleteCookie(cookie: CookieWithCategory) {
		if (!isChrome) {
			// For development environment, simulate deletion
			cookies = cookies.filter(
				(c) => c.name !== cookie.name || c.domain !== cookie.domain || c.path !== cookie.path
			);
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
			let cookieToBlock = { name: cookie.name, domain: cookie.domain, category: cookie.category };
			await chrome.cookies.remove({
				url,
				name: cookie.name,
				storeId: cookie.storeId
			});

			deleteStatus[cookie.name] = 'Deleted';

			// Create a new array to ensure reactivity
			cookies = cookies.filter(
				(c) => c.name !== cookie.name || c.domain !== cookie.domain || c.path !== cookie.path
			);

			cookiesDeleted++;

			setTimeout(() => {
				delete deleteStatus[cookie.name];
			}, 3000);

			chrome.storage.local.get(['siteData'], function (result) {
				let siteData = result.siteData || {};

				if (!siteData[activeDomain]) {
					siteData[activeDomain] = [];
				}

				siteData[activeDomain].push(cookieToBlock);
				console.log('Updated siteData:', siteData);

				chrome.storage.local.set({ siteData: siteData });
			});

			chrome.runtime.sendMessage({ action: 'blockCookies', activeDomain });
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

	async function deleteSelectedCookies(selectedCookies: CookieWithCategory[]) {
		isDeleting = true;
		for (const cookie of selectedCookies) {
			await deleteCookie(cookie);
		}
		isDeleting = false;
	}

	async function refreshCookies() {
		isLoading = true;
		if (isChrome) {
			chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
				if (!tabs.length) return;
				const tab = tabs[0];
				const url = tab.url;
				if (!url) return;

				activeDomain = extractDomain(url);
				await getAllResourceCookies(tab.id || 0);
			});
		} else {
			// For development: Use fake data
			cookies = (fake_cookie_data as chrome.cookies.Cookie[]).map((cookie) =>
				categorizeCookie(cookie, activeDomain)
			);
			activeDomain = 'www.example.com';
			isLoading = false;
		}
		getFavicon();
	}

	function getFavicon() {
		if (isChrome) {
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				const activeTab = tabs[0];

				if (activeTab.favIconUrl) {
					activeDomainFavicon = activeTab.favIconUrl;
				}
			});
		} else {
			const linkElements = document.querySelectorAll(
				'link[rel="icon"], link[rel="shortcut icon"]'
			) as NodeListOf<HTMLLinkElement>;

			if (linkElements.length > 0) {
				activeDomainFavicon = linkElements[0].href;
			}
		}
	}

	// Function to toggle tutorial visibility
	function toggleTutorial() {
		showTutorial = !showTutorial;
	}
	
	// Handler for when tutorial is closed from the TutorialOverlay component
	function handleTutorialClose() {
		showTutorial = false;
	}

	// Using Svelte 5's onMount
	onMount(() => {
		refreshCookies();
		
		// Check if first time user
		if (isChrome) {
			chrome.storage.local.get(['firstTimeUser'], (result) => {
				if (result.firstTimeUser === undefined) {
					showTutorial = true;
					chrome.storage.local.set({ firstTimeUser: false });
				}
			});
		} else {
			// For development
			const firstTimeUser = localStorage.getItem('firstTimeUser');
			if (!firstTimeUser) {
				showTutorial = true;
				localStorage.setItem('firstTimeUser', 'false');
			}
		}
	});
</script>

<header class="mb-4 flex items-center justify-between">
	<div class="flex items-center gap-3">
		<img class="h-8 w-8" src="/favicon.png" alt="Logo" />
		<div>
			<h1 class="text-xl font-bold">Cookie Monster</h1>
			<div class="flex items-center gap-2">
				<span class="relative flex size-4 pt-[1px]">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
					></span>
					<span class="relative inline-flex size-4 rounded-full bg-white">
						<Avatar.Root
							class="size-4 outline-1 outline-offset-1"
							style="outline: 1px #9ca3af solid"
						>
							<Avatar.Image src={activeDomainFavicon} alt="favicon of current page" />
							<Avatar.Fallback></Avatar.Fallback>
						</Avatar.Root>
					</span>
				</span>
				<p class="text-sm leading-none">
					<strong>{extractRootDomain(activeDomain)}</strong>
				</p>
			</div>
		</div>
	</div>

	<div class="flex gap-2">
		<!-- Tutorial button using plain HTML button -->
		<button 
		class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2"
		on:click={toggleTutorial}
	  >
		<span class="text-xs">?</span>
	  </button>
		
		<!-- Refresh button -->
		<button
		class="refresh-button inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
		on:click={refreshCookies}
		disabled={isLoading}
	  >
		{#if isLoading}
		  Loading...
		{:else}
		  <RotateCw class="size-2" /> Cookies
		{/if}
	  </button>

		<!-- Manage blocked cookies button -->
		<a 
			href="/block_list"
			class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
		>
			Manage Blocked Cookies
		</a>
	</div>
</header>

<ThirdPartyAlert {activeDomain} {groupedCookies} {deleteSelectedCookies} />

<!-- Add div wrappers with specific class names for tutorial targeting -->
<div class="breakdown-chart">
	<Breakdown {cookies} {groupedCookies} />
</div>

{#if isLoading}
	<Separator />
	<div class="flex flex-col gap-4">
		{#each Array(3) as _}
			<Skeleton class="h-12 w-full rounded-lg" />
			<Separator />
		{/each}
	</div>
{:else}
	<div class="bulk-actions-bar">
		<BulkActionsBar {cookies} {groupedCookies} {deleteCookiesByCategory} />
	</div>

	<div class="cookie-list">
		<CookieList bind:activeDomain {cookies} {groupedCookies} {deleteCookie} {deleteSelectedCookies} />
	</div>
{/if}

{#each resource_list as resource}
	<div>
		{resource}
	</div>
{/each}

<!-- Add the tutorial overlay component -->
<TutorialOverlay isOpen={showTutorial} on:close={handleTutorialClose} />