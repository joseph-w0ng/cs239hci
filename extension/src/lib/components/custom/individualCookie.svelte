<script lang="ts">
	import { Sparkles } from 'lucide-svelte';
	import Badge from '../ui/badge/badge.svelte';
	import Button from '../ui/button/button.svelte';
	import { Card } from '../ui/card';
	import * as Dialog from '../ui/dialog';
	import Checkbox from '../ui/checkbox/checkbox.svelte';

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

	function formatExpiryDate(expiryTime?: number) {
		if (!expiryTime) return 'Session cookie (expires when browser closes)';

		const expiryDate = new Date(expiryTime * 1000);
		return expiryDate.toLocaleString();
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
				<Button class="w-full">
					<Sparkles class="h-4 w-4" />
					Explain Cookie Details
				</Button>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
