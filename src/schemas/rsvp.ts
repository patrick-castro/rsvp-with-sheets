import { z } from "zod"

export const rsvpSchema = z.object({
  name: z.string().min(1, "Please select your name"),
})

export type RsvpFormValues = z.infer<typeof rsvpSchema>
