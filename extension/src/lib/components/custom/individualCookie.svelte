<script lang="ts">
	import { Sparkles } from 'lucide-svelte';
	import Badge from '../ui/badge/badge.svelte';
	import Button from '../ui/button/button.svelte';
	import { Card } from '../ui/card';
	import * as Dialog from '../ui/dialog';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import { GoogleGenerativeAI } from '@google/generative-ai';
	import * as Tooltip from '../ui/tooltip';

	const apiKey = 'AIzaSyDY-5W5WlZYx4N4en_xZiLNgzps_ejTEco';
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

	let {
		cookie,
		deleteCookie,
		onSelect
	}: {
		cookie: CookieWithCategory;
		deleteCookie: (cookie: CookieWithCategory) => Promise<void>;
		onSelect: (cookie: CookieWithCategory) => void;
	} = $props();

	let cookieExplanation: string | null = $state(null);
	let isLoading = $state(false);
	let error: string | null = $state(null);

	function formatExpiryDate(expiryTime?: number) {
		if (!expiryTime) return 'Session cookie (expires when browser closes)';

		const expiryDate = new Date(expiryTime * 1000);
		return expiryDate.toLocaleString();
	}

	async function generateCookieExplanation() {
		// Reset previous state
		cookieExplanation = null;
		error = null;
		isLoading = true;

		const prompt = `In a few sentences, Explain what this cookie likely does in a short, non-technical user-friendly way. Here are the cookie details:
		Name: ${cookie.name}
		Domain: ${cookie.domain}
		Path: ${cookie.path}
		Value (truncated): ${cookie.value.substring(0, 100)}
		`;

		try {
			const result = await model.generateContent(prompt);
			const response = result.response;
			cookieExplanation = response.text();
		} catch (error) {
			console.error('Error generating cookie explanation:', error);
			error = 'Could not generate explanation. Please check your Gemini API Key and try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Card class="flex items-center gap-4 rounded-sm p-4 text-left shadow-none">
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
				<div class="flex items-center justify-between">
					<h3 class="text-base font-semibold">{cookie.name}</h3>
					<div>
						{#if cookie.secure}
							<Tooltip.Provider delayDuration={0}>
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
							<Tooltip.Provider delayDuration={0}>
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
							<Tooltip.Provider delayDuration={0}>
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
			<Dialog.Title>Raw Cookie Details</Dialog.Title>
			<Dialog.Description class="flex flex-col gap-2">
				<div>
					<div>Domain: {cookie.domain}</div>
					<div>Path: {cookie.path}</div>
					<div>
						Value: {cookie.value.substring(0, 50)}{cookie.value.length > 50 ? '...' : ''}
					</div>
				</div>
				<Button class="w-full" onclick={generateCookieExplanation} disabled={isLoading}>
					<Sparkles class="h-4 w-4" />
					{#if isLoading}
						Generating Explanation...
					{:else}
						Explain Cookie Details
					{/if}
				</Button>

				{#if cookieExplanation}
					<div class="mt-4 rounded bg-gray-100 p-3">
						<p class="text-sm">{cookieExplanation}</p>
					</div>
				{/if}

				{#if error}
					<div class="mt-4 rounded bg-red-100 p-3 text-red-800">
						<p class="text-sm">{error}</p>
					</div>
				{/if}
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
