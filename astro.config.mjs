// @ts-check
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

import mdx from "@astrojs/mdx";

import node from "@astrojs/node";

import react from "@astrojs/react";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["slick-carousel", "jquery"],
    },
  },
  env: {
    schema: {
      RESEND_API_KEY: envField.string({
        context: "server",
        access: "secret",
        startsWith: "re_",
        optional: false,
      }),
      TURSO_DATABASE_URL: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      TURSO_AUTH_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      BETTER_AUTH_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      BETTER_AUTH_URL: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      PUBLIC_BETTER_AUTH_URL: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
    },
  },
  integrations: [icon(), mdx(), react()],
});