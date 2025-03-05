<script lang="ts">
	import { Sparkles } from 'lucide-svelte';
	import Badge from '../ui/badge/badge.svelte';
	import Button from '../ui/button/button.svelte';
	import { Card } from '../ui/card';
	import * as Dialog from '../ui/dialog';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import { GoogleGenerativeAI } from "@google/generative-ai";

	const apiKey = 'enter api key';
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

	let {
		cookie,
		deleteCookie,
		selectable,
		onSelect
	}: {
		cookie: CookieWithCategory;
		deleteCookie: (cookie: CookieWithCategory) => Promise<void>;
		onSelect: (cookie: CookieWithCategory) => void;
		selectable: boolean;
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
			console.error("Error generating cookie explanation:", error);
			error = "Could not generate explanation. Please check your Gemini API Key and try again.";
		} finally {
			isLoading = false;
		}
	}
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Card class="flex items-center gap-4 rounded-sm p-4 text-left shadow-none">
			{#if selectable}
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
							<Badge class="text-xs font-normal" variant="outline">🔒 Secure</Badge>
						{/if}
						{#if cookie.httpOnly}
							<Badge class="text-xs font-normal" variant="outline">🔐 HttpOnly</Badge>
						{/if}
						{#if cookie.category !== 'essential'}
							<Badge
								onclick={(e) => {
									e.stopPropagation();
									deleteCookie(cookie);
								}}
								class="text-xs font-normal"
								variant="destructive">Delete</Badge
							>
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
	<Dialog.Content>
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
				<Button 
					class="w-full" 
					onclick={generateCookieExplanation}
					disabled={isLoading}
				>
					<Sparkles class="h-4 w-4" />
					{#if isLoading}
						Generating Explanation...
					{:else}
						Explain Cookie Details
					{/if}
				</Button>

				{#if cookieExplanation}
					<div class="mt-4 p-3 bg-gray-100 rounded">
						<p class="text-sm">{cookieExplanation}</p>
					</div>
				{/if}

				{#if error}
					<div class="mt-4 p-3 bg-red-100 text-red-800 rounded">
						<p class="text-sm">{error}</p>
					</div>
				{/if}
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>