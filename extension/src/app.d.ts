// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	type cookieCategory = "essential" | "functional" | "analytics" | "marketing" | "unknown";

	// Cookie type with category
	interface CookieWithCategory extends chrome.cookies.Cookie {
		category: cookieCategory;
		description: string;
	}
}

export { };
