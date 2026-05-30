import { z } from "zod"

export const nameSearchSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
})

export type NameSearchValues = z.infer<typeof nameSearchSchema>
