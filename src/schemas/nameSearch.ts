import { z } from "zod"

export const nameSearchSchema = z.object({
  name: z
    .string()
    .min(1, "Please enter your name")
    .refine(
      (value) => value.trim().split(/\s+/).filter(Boolean).length >= 2,
      "Please enter your full name (first and last name)",
    ),
})

export type NameSearchValues = z.infer<typeof nameSearchSchema>
