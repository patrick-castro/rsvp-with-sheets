import { useState } from "react"
import { useLocation, useNavigate, Navigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { confirmationSchema, type ConfirmationValues } from "@/schemas/confirmation"
import { sheets, type Guest } from "@/services/sheets"
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
import { Textarea } from "@/components/ui/textarea"

type LocationState = {
  guests: Guest[]
  query: string
}

export default function Found() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null

  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(
    state?.guests.length === 1 ? state.guests[0] : null
  )
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const form = useForm<ConfirmationValues>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: { note: "" },
  })

  if (!state?.guests?.length) {
    return <Navigate to="/" replace />
  }

  const { guests } = state

  async function onSubmit(values: ConfirmationValues) {
    if (!selectedGuest) return
    setLoading(true)
    setApiError(null)

    try {
      await sheets.rsvp(selectedGuest.id, values.status, values.note ?? "")
      navigate("/success", {
        state: { name: selectedGuest.name, status: values.status },
      })
    } catch {
      setApiError("Unable to submit your RSVP. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">We found you!</CardTitle>
          <CardDescription>
            {guests.length > 1
              ? "We found multiple matches. Please confirm which one is you."
              : `We found ${guests[0].name} on our guest list.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guest picker — only shown when there are multiple matches */}
          {guests.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Select your name:</p>
              <div className="space-y-2">
                {guests.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGuest(g)}
                    className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                      selectedGuest?.id === g.id
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedGuest && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave a note (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write a message to the couple…"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {apiError && (
                  <p className="text-sm text-destructive">{apiError}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                    onClick={() => form.setValue("status", "confirmed")}
                  >
                    {loading && form.getValues("status") === "confirmed"
                      ? "Submitting…"
                      : "Confirm"}
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                    onClick={() => form.setValue("status", "declined")}
                  >
                    {loading && form.getValues("status") === "declined"
                      ? "Submitting…"
                      : "Decline"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {guests.length > 1 && !selectedGuest && (
            <p className="text-center text-sm text-muted-foreground">
              Select your name above to continue.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
