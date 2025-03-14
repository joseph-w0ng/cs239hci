<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Shield, Sparkles } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { Input } from '../ui/input';
	import Label from '../ui/label/label.svelte';
	import { onMount } from 'svelte';

	let token: string = $state('');
	let isSaving: boolean = $state(false);
	let success: boolean = $state(false);
	let error: string = $state('');

	// Load the token from Chrome storage when the component mounts
	onMount(() => {
		getToken();
	});

	// Retrieve the token from Chrome storage
	function getToken() {
		if (!chrome || !chrome.storage) return;

		chrome.storage.sync.get(['geminiToken'], (result) => {
			if (result.geminiToken) {
				token = result.geminiToken;
			}
		});
	}

	// Save the token to Chrome storage
	function saveToken() {
		if (!chrome || !chrome.storage) {
			error = 'Chrome storage API not available';
			return;
		}

		isSaving = true;
		error = '';

		try {
			chrome.storage.sync.set({ geminiToken: token }, () => {
				if (chrome.runtime.lastError) {
					error = chrome.runtime.lastError.message || 'Failed to save token';
				} else {
					success = true;

					// Reset success message after 3 seconds
					setTimeout(() => {
						success = false;
					}, 3000);
				}
				isSaving = false;
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unknown error occurred';
			isSaving = false;
		}
	}

	// Clear the token
	function clearToken() {
		token = '';
		if (chrome && chrome.storage) {
			chrome.storage.sync.remove(['geminiToken']);
		}
	}
</script>

<Dialog.Root>
	<Dialog.Trigger
		class="text-muted-foreground flex items-center gap-[1ch] text-left text-sm hover:underline"
	>
		Manage your Gemini Token <Sparkles size="16px" />
	</Dialog.Trigger>
	<Dialog.Content class="rounded-lg text-left">
		<Dialog.Header>
			<Dialog.Title class="text-left">Gemini Token Manager</Dialog.Title>
			<Dialog.Description class="text-left">
				We use Gemini to provide AI features. Provide your <a
					class="text-blue-600"
					href="https://ai.google.dev/gemini-api/docs/api-key">own</a
				> free Gemini token to get access to AI features.
			</Dialog.Description>
			<div class="py-1 text-left">
				<Label class="text-left" for="gemini">Gemini API Token</Label>
				<Input placeholder="Gemini API Token" id="gemini" bind:value={token} />
				{#if error}
					<div class="mt-1 text-xs text-red-500">Failed to save API key: {error}</div>
				{/if}
				{#if success}
					<div class="mt-1 text-xs text-green-500">
						Token saved successfully! Reload cookies to use your token.
					</div>
				{/if}
				<div class="text-muted-foreground flex items-center gap-1 pt-2 text-xs">
					<Shield class="size-4" />
					<div>Your token is saved to your browser and never leaves your device.</div>
				</div>
			</div>
		</Dialog.Header>
		<div class="flex justify-end gap-1">
			{#if token}
				<Button variant="outline" onclick={clearToken}>Clear</Button>
			{:else}
				<div></div>
			{/if}
			<Button onclick={saveToken} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
