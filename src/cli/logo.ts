import gradient from 'gradient-string';

const NUXT_LOGO = `███╗   ██╗██╗   ██╗██╗  ██╗████████╗
████╗  ██║██║   ██║╚██╗██╔╝╚══██╔══╝
██╔██╗ ██║██║   ██║ ╚███╔╝    ██║
██║╚██╗██║██║   ██║ ██╔██╗    ██║
██║ ╚████║╚██████╔╝██╔╝ ██╗   ██║
╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝`;

const SUBTITLE = 'Nuxt OpenAPI Generator - useFetch, useAsyncData & Nuxt server';

/**
 * Display the Nuxt logo with gradient colors
 * - Green gradient for Nuxt logo (official Nuxt color #00DC82)
 * - Blue gradient for Swagger subtitle
 */
export function displayLogo(): void {
  const nuxtGradient = gradient('#00DC82', '#00E090');
  const swaggerGradient = gradient('#3B82F6', '#0EA5E9');

  console.log('\n');
  console.log(nuxtGradient(NUXT_LOGO));
  console.log(swaggerGradient(SUBTITLE));
  console.log('\n');
}
