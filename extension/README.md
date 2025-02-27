## Developing

To start the development server:

```bash
pnpm i

pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm run build
```

## Testing and Publishing on Chrome

1. Create a production build
2. Go to chrome://extensions/
3. Turn on developer mode 
4. Pres `Load unpacked` and select the `build` directory


## Stack
We are using Svelte 5 (You can use svelte 4 syntax if you like still), Tailwind 3 (not 4) and Shadcn-svelte@next (components). 


If you want to add components add them from here: https://next.shadcn-svelte.com/

When installing components make sure the command has the `@next` identifier: 

```bash
pnpm dlx shadcn-svelte@next add <name-of-component>
```

We are using `pnpm` (not `npm`) so install packages with `pnpm i`. 
