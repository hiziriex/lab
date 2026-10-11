import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://hiziriex.github.io',
  base: '/lab',
  output: 'static',
  trailingSlash: 'always',
  integrations: [react(), mdx(), sitemap()],
  markdown: { syntaxHighlight: 'prism' },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      styleDirective: {
        resources: [
          { resource: "'self'", kind: 'element' },
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
      },
    },
  },
  vite: { build: { sourcemap: true, assetsInlineLimit: 0 } },
});
