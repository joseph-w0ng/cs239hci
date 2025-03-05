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
					<div class="flex items-center gap-2 relative">
						{#if cookie.secure}
							<div class="security-badge-container">
								<Badge class="text-xs font-normal" variant="outline">🔒 Secure</Badge>
								<div class="security-explanation">
									Secure cookies are only transmitted over HTTPS, protecting them from being intercepted on unsecured networks.
								</div>
							</div>
						{/if}
						{#if cookie.httpOnly}
							<div class="security-badge-container">
								<Badge class="text-xs font-normal" variant="outline">🔐 HttpOnly</Badge>
								<div class="security-explanation">
									HTTP-only cookies cannot be accessed by client-side scripts, helping prevent cross-site scripting (XSS) attacks.
								</div>
							</div>
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
	<!-- Rest of your existing Dialog content -->
</Dialog.Root>

<style>
	.security-badge-container {
		position: relative;
		display: inline-block;
	}

	.security-explanation {
		visibility: hidden;
		position: absolute;
		z-index: 10;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		background-color: #333;
		color: white;
		text-align: center;
		border-radius: 6px;
		padding: 5px 10px;
		margin-bottom: 5px;
		width: 200px;
		opacity: 0;
		transition: opacity 0.3s;
	}

	.security-badge-container:hover .security-explanation {
		visibility: visible;
		opacity: 1;
	}
</style>