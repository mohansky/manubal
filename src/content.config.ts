import { defineCollection, z } from "astro:content";
import { csvLoader } from "@ascorbic/csv-loader";
import { file, glob } from "astro/loaders";

const siteData = defineCollection({
  loader: file("src/content/site/index.yml"),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      title: z.string(),
      description: z.string(),
      basepath: z.string().url({ message: "Base path must be a valid URL" }),
      ogImageURL: image(),
      keywords: z.array(z.string()),
      author: z.object({
        name: z.string(),
        email: z.string().email({ message: "Must be a valid email address" }),
        url: z.string().url({ message: "URL must be valid" }),
      }),
      links: z.array(
        z.object({
          text: z.string(),
          link: z.string(),
        })
      ),
      footnote1: z.string(),
      footnote: z.string(),
      copyright: z.string(),
      email: z.string().email({ message: "Must be a valid email address" }),
      hero: z.array(
        z.object({
          bgImage: image(),
          title: z.string(),
          subtitle: z.string(),
          btnText: z.string(),
          btnLink: z.string(),
        })
      ),
      introTitle: z.string(),
      introText: z.string(),
      introImage: image(),
      peopleTitle: z.string(),
      peopleImage: image(),
      peopleSubtitle: z.string(),
      peopleText: z.string(),
      people: z.array(
        z.object({
          name: z.string(),
          title: z.string(),
          subtitle: z.string(),
          image: image(),
        })
      ),
      socialTitle: z.string(),
      socials: z.array(
        z.object({
          link: z.string(),
          icon: z.string(),
          text: z.string(),
        })
      ),
      contactTitle: z.string(),
      contactSubtitle: z.string(),
      contactdetails: z.array(
        z.object({
          link: z.string(),
          icon: z.string(),
          text: z.string(),
        })
      ),
    }),
});

const products = defineCollection({
  loader: csvLoader({ fileName: "src/content/products/manubal-product-listing.csv" }),
  schema: ({ image }) =>
    z.object({
      id: z.number(),
      slug: z.string(),
      slugasparams: z.string().optional().nullable(),
      published: z.boolean().optional().default(true),
      name: z.string(),
      quantity: z.number().optional(),
      dimensions: z.string(),
      weight: z.number(),
      artisan: z.string(),
      code: z.string(),
      description: z.string(),
      images: z.string().optional(),
      category: z.string(),
      material: z.string(),
      colour: z.union([z.string(), z.array(z.string())]),
      mrp: z.number(),
      gst: z.number().optional(),
      courier: z.string().optional().nullable(),
      total: z.number(),
      sku: z.string().optional().nullable(),
      barcode: z.string().optional().nullable(),
    }),
});

export const collections = { siteData, products };
