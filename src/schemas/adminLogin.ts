import { z } from "zod"

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Please enter your username"),
  password: z.string().min(1, "Please enter your password"),
})

export type AdminLoginValues = z.infer<typeof adminLoginSchema>
