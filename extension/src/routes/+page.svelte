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

	// Function to get performance entries (resource URLs) from the current tab
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

	// Function to get all cookies from all resources
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

	// Using Svelte 5's onMount
	onMount(() => {
		refreshCookies();
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
		<Tooltip.Provider delayDuration={100}>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Button variant="outline" onclick={refreshCookies} disabled={isLoading}>
						{#if isLoading}
							Loading...
						{:else}
							<RotateCw class="size-2" /> Cookies
						{/if}
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>Reload cookies</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>

		<Button href="/block_list">Manage Blocked Cookies</Button>
	</div>
</header>

<ThirdPartyAlert {activeDomain} {groupedCookies} {deleteSelectedCookies} />

<Breakdown {cookies} {groupedCookies} />

{#if isLoading}
	<Separator />
	<div class="flex flex-col gap-4">
		{#each Array(3) as _}
			<Skeleton class="h-12 w-full rounded-lg" />
			<Separator />
		{/each}
	</div>
{:else}
	<BulkActionsBar {cookies} {groupedCookies} {deleteCookiesByCategory} />

	<CookieList {cookies} {groupedCookies} {deleteCookie} {deleteSelectedCookies} />
{/if}

{#each resource_list as resource}
	<div>
		{resource}
	</div>
{/each}
