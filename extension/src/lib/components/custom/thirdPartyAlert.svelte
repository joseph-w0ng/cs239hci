<script lang="ts">
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { CircleAlert } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { extractRootDomain } from '$lib/categorize';
	import { SvelteSet } from 'svelte/reactivity';
	import Separator from '../ui/separator/separator.svelte';
	import Favicon from './favicon.svelte';

	let {
		activeDomain,
		groupedCookies,
		deleteSelectedCookies
	}: {
		activeDomain: string;
		groupedCookies: Record<string, CookieWithCategory[]>;
		deleteSelectedCookies: (selectedCookies: CookieWithCategory[]) => Promise<void>;
	} = $props();

	let concerningCookies: CookieWithCategory[] = $state([]);
	let uniqueDomains = $state(new SvelteSet<string>());
	let deleting: boolean = $state(false);

	$effect(() => {
		const [domains, cookies] = getConcerningCookies(groupedCookies);
		uniqueDomains = domains;
		concerningCookies = cookies;
	});

	function getConcerningCookies(
		groupedCookies: Record<string, CookieWithCategory[]>
	): [SvelteSet<string>, CookieWithCategory[]] {
		const domains = new SvelteSet<string>();
		const cookies: CookieWithCategory[] = [];
		for (let [category, categoryCookies] of Object.entries(groupedCookies)) {
			category as cookieCategory;
			if (['analytics', 'marketing'].includes(category)) {
				for (const cookie of categoryCookies) {
					const otherDomain = extractRootDomain(cookie.domain);
					const thisDomain = extractRootDomain(activeDomain);
					if (otherDomain !== thisDomain) {
						domains.add(otherDomain);
						cookies.push(cookie);
					}
				}
			}
		}
		return [domains, cookies];
	}

	async function blockThirdPartyCookies() {
		deleting = true;
		await deleteSelectedCookies(concerningCookies);
		deleting = false;
	}
</script>

{#if concerningCookies.length > 0}
	<Alert.Root variant="destructive">
		<div class="flex items-center gap-2">
			<span class="relative top-[-2px] size-5">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
				></span>
				<CircleAlert class="relative size-5" />
			</span>
			<Alert.Title class="text-lg font-bold ">Third Party Cookie Alert</Alert.Title>
		</div>
		<Alert.Description class="flex flex-col gap-2">
			<div>
				<strong>{activeDomain}</strong> is sharing your data with
				<strong>{uniqueDomains.size}</strong>
				third part{uniqueDomains.size == 1 ? 'y' : 'ies'}. Block these cookies now to protect your
				privacy.
			</div>
			<Separator />
			<div class="flex items-center justify-between">
				<div class="flex -space-x-1">
					{#each uniqueDomains as domain (domain)}
						<Favicon url={domain} style="outline: 2px white solid" />
					{/each}
				</div>
				<Button
					class="self-end"
					variant="destructive"
					disabled={deleting}
					onclick={blockThirdPartyCookies}
				>
					Block {concerningCookies.length} Cookie{concerningCookies.length == 1 ? '' : 's'}
				</Button>
			</div>
		</Alert.Description>
	</Alert.Root>
{/if}
