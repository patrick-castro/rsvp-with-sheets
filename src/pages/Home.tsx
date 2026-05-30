import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { nameSearchSchema, type NameSearchValues } from "@/schemas/nameSearch"
import { sheets } from "@/services/sheets"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const form = useForm<NameSearchValues>({
    resolver: zodResolver(nameSearchSchema),
    defaultValues: { name: "" },
  })

  async function onSubmit(values: NameSearchValues) {
    setLoading(true)
    setApiError(null)

    try {
      const result = await sheets.search(values.name)

      if (result.found) {
        navigate("/found", { state: { guests: result.guests, query: values.name } })
      } else {
        navigate("/not-found", { state: { query: values.name } })
      }
    } catch {
      setApiError("Unable to reach the RSVP service. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">You're Invited</CardTitle>
          <CardDescription>
            Enter your name below and we'll look you up on the guest list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Patrick Castro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {apiError && (
                <p className="text-sm text-destructive">{apiError}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Searching…" : "Find My Name"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
