<script lang="ts">
	import { Clock, Cookie, Route, Sparkles } from 'lucide-svelte';
	import Badge from '../ui/badge/badge.svelte';
	import Button from '../ui/button/button.svelte';
	import { Card } from '../ui/card';
	import * as Dialog from '../ui/dialog';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import { GoogleGenerativeAI } from '@google/generative-ai';
	import * as Tooltip from '../ui/tooltip';
	import Favicon from './favicon.svelte';
	import { extractRootDomain } from '$lib/categorize';
	import Separator from '../ui/separator/separator.svelte';
	import Skeleton from '../ui/skeleton/skeleton.svelte';
	import { onMount } from 'svelte';
	import GeminiToken from './geminiToken.svelte';

	let geminiToken: string = $state('');
	let genAI: any = $state(null);
	let model: any = $state(null);

	let {
		activeDomain = $bindable(),
		cookie,
		deleteCookie,
		onSelect
	}: {
		activeDomain: string;
		cookie: CookieWithCategory;
		deleteCookie: (cookie: CookieWithCategory) => Promise<void>;
		onSelect: (cookie: CookieWithCategory) => void;
	} = $props();

	let cookieExplanation: string | null = $state(null);
	let isLoading = $state(false);
	let error: string | null = $state(null);
	let cookieDomain = $derived(extractRootDomain(cookie.domain));
	let rootActiveDomain = $derived(extractRootDomain(activeDomain));
	let tokenAvailable = $derived(!!geminiToken);

	onMount(() => {
		getGeminiAPIToken();
	});

	function getGeminiAPIToken() {
		if (!chrome || !chrome.storage) return;

		chrome.storage.sync.get(['geminiToken'], (result) => {
			if (result.geminiToken) {
				geminiToken = result.geminiToken;
				initializeGeminiAPI(result.geminiToken);
			} else {
				geminiToken = '';
				genAI = null;
				model = null;
			}
		});
	}

	function initializeGeminiAPI(token: string) {
		if (!token) return;

		try {
			genAI = new GoogleGenerativeAI(token);
			model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
		} catch (err) {
			console.error('Failed to initialize Gemini API:', err);
			error = 'Failed to initialize Gemini API. Please check your token.';
		}
	}

	function formatExpiryDate(expiryTime?: number) {
		if (!expiryTime) return 'Session cookie (expires when browser closes)';

		const expiryDate = new Date(expiryTime * 1000);
		return expiryDate.toLocaleString();
	}

	async function generateCookieExplanation() {
		if (!geminiToken || !model) {
			error = 'No Gemini API token available. Please add your token.';
			return;
		}

		cookieExplanation = null;
		error = null;
		isLoading = true;

		const prompt = `In a few sentences, Explain what this cookie likely does in a short, non-technical user-friendly way. Here are the cookie details:
		
		Name: ${cookie.name}
		Domain: ${cookie.domain}
		Path: ${cookie.path}
		Value (truncated): ${cookie.value.substring(0, 100)}

		The cookie is being used on ${activeDomain}.
		`;

		try {
			const result = await model.generateContent(prompt);
			const response = result.response;
			cookieExplanation = response.text();
		} catch (err) {
			console.error('Error generating cookie explanation:', err);
			error = 'Could not generate explanation. Please check your Gemini API Key and try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Card class="cookie-card relative flex items-center gap-4 rounded-sm p-4 text-left shadow-none transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:brightness-[1.02]">
			{#if cookie.category !== 'essential'}
				<Checkbox 
					onclick={(e) => {
						e.stopPropagation();
						onSelect(cookie);
					}}
					class="h-4 w-4"
				/>
			{/if}
			<div class="w-full">
				<div class="flex flex-nowrap items-center justify-between">
					<div class="flex items-center gap-1">
						<Favicon url={cookie.domain} style="outline: 1px rgb(231, 229, 228) solid" />
						<h3 class="max-w-[8rem] truncate text-base font-semibold">
							{cookie.name}
						</h3>
					</div>
					<div>
						{#if rootActiveDomain !== cookieDomain}
							<Tooltip.Provider delayDuration={100}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Badge class="text-xs font-normal" variant="outline">
											<span class="relative mr-1 flex size-2">
												<span
													class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
												></span>
												<span class="relative inline-flex size-2 rounded-full bg-red-500"></span>
											</span>
											Third Party
										</Badge>
									</Tooltip.Trigger>
									<Tooltip.Content class="max-w-64 text-center">
										A third-party cookie is a small text file placed on a user's device by a website
										domain that's different from the one the user is currently visiting, often used
										for tracking and advertising purposes.
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/if}
						{#if cookie.secure}
							<Tooltip.Provider delayDuration={100}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Badge class="text-xs font-normal" variant="outline">🔒 Secure</Badge>
									</Tooltip.Trigger>
									<Tooltip.Content class="max-w-64 text-center">
										Secure cookies are only transmitted over HTTPS, protecting them from being
										intercepted on unsecured networks.
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/if}
						{#if cookie.httpOnly}
							<Tooltip.Provider delayDuration={100}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Badge class="text-xs font-normal" variant="outline">🔐 HttpOnly</Badge>
									</Tooltip.Trigger>
									<Tooltip.Content class="max-w-64 text-center">
										HTTP-only cookies cannot be accessed by client-side scripts, helping prevent
										cross-site scripting (XSS) attacks.
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/if}
						{#if cookie.category !== 'essential'}
							<Tooltip.Provider delayDuration={100}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Badge
											onclick={(e) => {
												e.stopPropagation();
												deleteCookie(cookie);
											}}
											class="text-xs font-normal"
											variant="destructive">Block</Badge
										>
									</Tooltip.Trigger>
									<Tooltip.Content class="max-w-64 text-center">
										Delete and block this cookie from being repopulated.
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/if}
					</div>
				</div>
				<div class="text-sm text-gray-500">{cookie.description}</div>
				<div class="text-xs text-gray-500">
					Expires: {formatExpiryDate(cookie.expirationDate)}
				</div>
			</div>
		</Card>
	</Dialog.Trigger>
	<Dialog.Content class="rounded-lg">
		<Dialog.Header>
			<Dialog.Title class="text-left">Raw Cookie Details</Dialog.Title>
			<Dialog.Description class="flex flex-col items-start gap-2 text-left">
				<div class="flex flex-wrap gap-1">
					<div
						class="flex h-8 items-center gap-1 rounded-full border-[1px] border-solid border-gray-300 p-1"
					>
						<Favicon url={cookie.domain} tooltip={false} />
						<span class="px-1 leading-none">{extractRootDomain(cookie.domain)}</span>
					</div>
					<div
						class="flex h-8 items-center gap-1 rounded-full border-[1px] border-solid border-gray-300 p-1"
					>
						<Cookie />
						Value <Separator orientation="vertical" />
						<span class="px-1 leading-none"
							>{cookie.value.substring(0, 35)}{cookie.value.length > 35 ? '...' : ''}</span
						>
					</div>
					<div
						class="flex h-8 items-center gap-1 rounded-full border-[1px] border-solid border-gray-300 p-1"
					>
						<Route />
						Path <Separator orientation="vertical" />
						<span class="px-1 leading-none">{cookie.path}</span>
					</div>
				</div>

				{#if isLoading}
					<Skeleton class="h-8 w-full rounded-lg" />
				{/if}

				{#if cookieExplanation}
					<div class="rounded bg-gray-100 p-3">
						<div class="mb-1 flex items-center gap-1 text-sm">
							<Sparkles class="size-4" /> AI Overview
						</div>
						<p class="text-sm">{cookieExplanation}</p>
					</div>
				{/if}

				<Button
					class="w-full"
					onclick={generateCookieExplanation}
					disabled={isLoading || !tokenAvailable}
				>
					<Sparkles class="h-4 w-4" />
					{#if isLoading}
						Generating Explanation...
					{:else if !tokenAvailable}
						Gemini Token Required
					{:else if cookieExplanation}
						Regenerate Response
					{:else}
						Explain Cookie Details
					{/if}
				</Button>

				{#if error}
					<div class="mt-4 rounded bg-red-100 p-3 text-red-800">
						<p class="text-sm">{error}</p>
					</div>
				{/if}

				{#if !tokenAvailable}
					<div class="mt-2 text-center text-sm text-gray-500">
						<GeminiToken />
					</div>
				{/if}
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>

<style>
  /* Additional styles for cookie card hover effect */
  .cookie-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
</style>