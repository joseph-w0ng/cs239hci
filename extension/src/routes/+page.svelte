<script lang="ts">
	import { onMount, tick } from 'svelte';
	import fake_cookie_data from '$lib/data/cookies.json';
	import categorizeCookie, { cookieCategories } from '$lib/categorize';
	import Breakdown from '$lib/components/custom/breakdown.svelte';
	import BulkActionsBar from '$lib/components/custom/bulkActionsBar.svelte';
	import CookieList from '$lib/components/custom/cookieList.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { page } from '$app/state';
	import * as Avatar from '$lib/components/ui/avatar';

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
	let activeDomainFavicon = '';

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
		await tick();
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
			activeDomain = 'www.example.com';
			groupedCookies = groupCookiesByCategory(cookies);
		}

		getFavicon();
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
</script>

<header class="mb-4 flex items-center justify-between">
	<div class="flex items-center gap-3">
		<img class="h-8 w-8" src="/favicon.png" alt="Logo" />
		<div>
			<h1 class="text-xl font-bold">Cookie Clear</h1>
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
					<strong>{activeDomain.replace(/^(https?:\/\/)?(www\.)/i, '$1')}</strong>
				</p>
			</div>
		</div>
	</div>

	<div class="flex gap-2">
		<Button variant="outline">↻ Reload</Button>

		{#if page.url.pathname !== '/block_list'}
			<Button href="/block_list">Manage Block List</Button>
		{:else}
			<Button href="/">See Breakdown</Button>
		{/if}
	</div>
</header>

<Breakdown {cookies} {groupedCookies} />

<BulkActionsBar {cookies} {groupedCookies} {deleteCookiesByCategory} />

<CookieList {deleteSelectedCookies} {cookies} {groupedCookies} {deleteCookie} />
