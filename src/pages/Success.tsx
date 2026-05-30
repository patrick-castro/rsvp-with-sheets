import { useLocation, Link, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type LocationState = { name: string; status: "confirmed" | "declined" }

export default function Success() {
  const location = useLocation()
  const state = location.state as LocationState | null

  if (!state?.name) {
    return <Navigate to="/" replace />
  }

  const { name, status } = state
  const confirmed = status === "confirmed"

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {confirmed ? "See you there!" : "We'll miss you!"}
          </CardTitle>
          <CardDescription>
            {confirmed
              ? `Thanks, ${name}. Your attendance has been confirmed. We can't wait to celebrate with you!`
              : `Thanks for letting us know, ${name}. We're sorry you can't make it.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
