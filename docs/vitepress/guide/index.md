# Guide

This guide documents the current Nuxt-only workflow for `nuxt-openapi-hyperfetch`.

The module reads a local OpenAPI document during Nuxt builds, generates an SDK into `openapi/`, and optionally adds `useFetch`, `useAsyncData`, `nuxtServer`, and connector layers on top of that SDK.

## Start Here

- **[What is Nuxt OpenAPI Hyperfetch?](./what-is-nuxt-openapi-hyperfetch)** - Product overview and generated outputs
- **[Getting Started](./getting-started)** - Minimal setup in `nuxt.config.ts`
- **[Use as Nuxt Module](./use-as-nuxt-module)** - Full module configuration reference
- **[Core Concepts](./core-concepts)** - How generation, runtimes, and composables fit together
- **[Generating Composables](./generating-composables)** - What gets generated and when
- **[Choosing a Generator](./choosing-a-generator)** - Decide between `useFetch`, `useAsyncData`, `nuxtServer`, and `connectors`

## Quick Start

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	modules: ['nuxt-openapi-hyperfetch'],
	openapi: {
		input: './swagger.yaml',
		output: './openapi',
		generators: ['useFetch', 'useAsyncData'],
	},
})
```

Run `npx nuxt dev` or `npm run dev` and the module will generate the selected outputs before the build starts.

## What You Get

- Type-safe SDK files generated from your OpenAPI schema
- Nuxt-friendly composables built on top of the SDK
- Optional server route generation for BFF-style flows
- Optional headless connectors for `useAsyncData`
- Auto-import support for generated composables

## Suggested Reading Order

1. Read [What is Nuxt OpenAPI Hyperfetch?](./what-is-nuxt-openapi-hyperfetch)
2. Follow [Getting Started](./getting-started)
3. Keep [Use as Nuxt Module](./use-as-nuxt-module) open while configuring the module
4. Read [Core Concepts](./core-concepts) before customizing generated behavior
5. Use [Choosing a Generator](./choosing-a-generator) to trim your output to what you actually need

## Need Help?

- [Troubleshooting](/troubleshooting/)
- [Contributing](/contributing/)
