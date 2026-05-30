import { useEffect, useState } from "react"
import { sheets, type Guest } from "@/services/sheets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Filter = "all" | "pending" | "confirmed" | "declined"

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
}

const STATUS_VARIANTS: Record<string, "secondary" | "default" | "destructive"> = {
  pending: "secondary",
  confirmed: "default",
  declined: "destructive",
}

export default function Admin() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [newName, setNewName] = useState("")
  const [addingGuest, setAddingGuest] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadGuests()
  }, [])

  async function loadGuests() {
    setLoading(true)
    try {
      const data = await sheets.list()
      setGuests(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(guest: Guest, status: string) {
    const isReset = status === "pending"
    const note = isReset ? "" : (guest.notes ?? "")
    setUpdatingId(guest.id)
    try {
      await sheets.updateStatus(guest.id, status, note)
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guest.id
            ? { ...g, status: status as Guest["status"], ...(isReset && { notes: "" }) }
            : g
        )
      )
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleAddGuest() {
    const name = newName.trim()
    if (!name) return
    setAddingGuest(true)
    try {
      await sheets.addGuest(name)
      setNewName("")
      await loadGuests()
    } finally {
      setAddingGuest(false)
    }
  }

  const filtered = guests.filter((g) => filter === "all" || g.status === filter)
  const counts = {
    all: guests.length,
    pending: guests.filter((g) => g.status === "pending").length,
    confirmed: guests.filter((g) => g.status === "confirmed").length,
    declined: guests.filter((g) => g.status === "declined").length,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guest List</h1>
        <Button variant="outline" size="sm" onClick={loadGuests} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "confirmed", "declined"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}{" "}
            <span className="opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Add guest */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a guest name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddGuest()}
          className="max-w-xs"
        />
        <Button onClick={handleAddGuest} disabled={addingGuest || !newName.trim()}>
          {addingGuest ? "Adding…" : "Add Guest"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading guests…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No guests in this category.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">{guest.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[guest.status] ?? "secondary"}>
                      {STATUS_LABELS[guest.status] ?? guest.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {guest.notes || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {guest.updatedAt
                      ? new Date(guest.updatedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {guest.status !== "confirmed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === guest.id}
                          onClick={() => handleStatusChange(guest, "confirmed")}
                        >
                          Confirm
                        </Button>
                      )}
                      {guest.status !== "declined" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === guest.id}
                          onClick={() => handleStatusChange(guest, "declined")}
                        >
                          Decline
                        </Button>
                      )}
                      {guest.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={updatingId === guest.id}
                          onClick={() => handleStatusChange(guest, "pending")}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
