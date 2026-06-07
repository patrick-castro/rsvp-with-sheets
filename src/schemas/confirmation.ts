import { z } from "zod"

export const confirmationSchema = z.object({
  status: z.enum(["confirmed", "declined"]),
  note: z.string().max(750, "Please keep your message to 750 characters or fewer").optional(),
})

export type ConfirmationValues = z.infer<typeof confirmationSchema>
