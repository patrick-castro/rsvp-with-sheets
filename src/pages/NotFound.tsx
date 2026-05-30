import { useLocation, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type LocationState = { query?: string }

export default function NotFound() {
  const location = useLocation()
  const state = location.state as LocationState | null
  const query = state?.query ?? "your name"

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Name not found</CardTitle>
          <CardDescription>
            We couldn't find <span className="font-medium text-foreground">"{query}"</span> on our guest list.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            If you believe this is a mistake, please reach out to us directly:
          </p>
          <div className="rounded-md border p-4 space-y-1 text-sm text-center">
            {/* Replace with real contact details */}
            <p className="font-medium">Contact the couple</p>
            <p className="text-muted-foreground">+63 900 000 0000</p>
            <p className="text-muted-foreground">hello@example.com</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Try Again</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
