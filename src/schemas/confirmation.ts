import { z } from "zod"

export const confirmationSchema = z.object({
  status: z.enum(["confirmed", "declined"]),
  note: z.string().optional(),
})

export type ConfirmationValues = z.infer<typeof confirmationSchema>
