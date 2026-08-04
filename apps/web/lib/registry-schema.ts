import { z } from "zod";

export const registryFileSchema = z.object({
  content: z.string(),
  path: z.string(),
  target: z.string().optional(),
  type: z.string(),
});

export const registryItemSchema = z.object({
  cssVars: z
    .object({
      dark: z.record(z.string(), z.string()).optional(),
      light: z.record(z.string(), z.string()).optional(),
      theme: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  dependencies: z.array(z.string()).optional(),
  description: z.string().optional(),
  docs: z.string().optional(),
  files: z.array(registryFileSchema).default([]),
  name: z.string(),
  registryDependencies: z.array(z.string()).optional(),
  title: z.string().optional(),
  type: z.string(),
});

export type RegistryFile = z.infer<typeof registryFileSchema>;
export type RegistryItem = z.infer<typeof registryItemSchema>;
