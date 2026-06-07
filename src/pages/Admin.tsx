import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Check, Pencil, X } from 'lucide-react';
import { auth } from '@/services/auth';
import { sheets, type Guest } from '@/services/sheets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Filter = 'all' | 'pending' | 'confirmed' | 'declined';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  declined: 'Declined',
};

const STATUS_VARIANTS: Record<string, 'secondary' | 'default' | 'destructive'> =
  {
    pending: 'secondary',
    confirmed: 'default',
    declined: 'destructive',
  };

const STATUS_CLASSES: Record<string, string> = {
  confirmed: 'bg-green-500/10 text-green-700 dark:text-green-400',
};

type PendingEdit = { id: string; oldName: string; newName: string };
type PendingDelete = { id: string; name: string };

// ─── Dashboard ────────────────────────────────────────────────────────────────

type AdminDashboardProps = {
  onLogout: () => void;
};

function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [newName, setNewName] = useState('');
  const [addingGuest, setAddingGuest] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Inline name edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // Delete
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadGuests();
  }, []);

  async function loadGuests() {
    setLoading(true);
    try {
      const data = await sheets.list();
      setGuests(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(guest: Guest, status: string) {
    const isReset = status === 'pending';
    const note = isReset ? '' : (guest.message ?? '');
    setUpdatingId(guest.id);
    try {
      await sheets.updateStatus(guest.id, status, note);
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guest.id
            ? {
                ...g,
                status: status as Guest['status'],
                ...(isReset
                  ? { message: '', updatedAt: undefined }
                  : { updatedAt: new Date().toISOString() }),
              }
            : g,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleAddGuest() {
    const name = newName.trim();
    if (!name) return;
    setAddingGuest(true);
    try {
      await sheets.addGuest(name);
      setNewName('');
      await loadGuests();
    } finally {
      setAddingGuest(false);
    }
  }

  function startEditing(guest: Guest) {
    setEditingId(guest.id);
    setEditingName(guest.name);
  }

  function commitEdit(guest: Guest) {
    const trimmed = editingName.trim();
    if (trimmed && trimmed !== guest.name) {
      setPendingEdit({ id: guest.id, oldName: guest.name, newName: trimmed });
    }
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  async function confirmRename() {
    if (!pendingEdit) return;
    setRenamingId(pendingEdit.id);
    try {
      await sheets.updateName(pendingEdit.id, pendingEdit.newName);
      setGuests((prev) =>
        prev.map((g) =>
          g.id === pendingEdit.id ? { ...g, name: pendingEdit.newName } : g,
        ),
      );
    } finally {
      setRenamingId(null);
      setPendingEdit(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await sheets.deleteGuest(pendingDelete.id);
      setGuests((prev) => prev.filter((g) => g.id !== pendingDelete.id));
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  const filtered = guests.filter(
    (g) => filter === 'all' || g.status === filter,
  );
  const counts = {
    all: guests.length,
    pending: guests.filter((g) => g.status === 'pending').length,
    confirmed: guests.filter((g) => g.status === 'confirmed').length,
    declined: guests.filter((g) => g.status === 'declined').length,
  };

  return (
    <div className='max-w-5xl mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Guest List</h1>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link to='/rsvp'>Back to RSVP</Link>
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={loadGuests}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
          <Button variant='ghost' size='sm' onClick={onLogout}>
            Log out
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className='flex gap-2 flex-wrap'>
        {(['all', 'pending', 'confirmed', 'declined'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
            <span className='opacity-70'>({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Add guest */}
      <div className='flex gap-2'>
        <Input
          placeholder='Add a guest name…'
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
          className='max-w-xs'
        />
        <Button
          onClick={handleAddGuest}
          disabled={addingGuest || !newName.trim()}
        >
          {addingGuest ? 'Adding…' : 'Add Guest'}
        </Button>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table className='table-fixed min-w-3xl'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[20%]'>Name</TableHead>
              <TableHead className='w-[10%]'>Status</TableHead>
              <TableHead className='w-[26%]'>Message</TableHead>
              <TableHead className='w-[14%]'>Last updated</TableHead>
              <TableHead className='w-[15%]'>Response</TableHead>
              <TableHead className='w-[15%] text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-center text-muted-foreground py-8'
                >
                  Loading guests…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-center text-muted-foreground py-8'
                >
                  No guests in this category.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className='font-medium whitespace-normal wrap-break-word'>
                    {editingId === guest.id ? (
                      <span className='flex items-center gap-1 w-full'>
                        <Input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitEdit(guest);
                            }
                          }}
                          className='h-8 text-sm flex-1'
                        />
                        <span className='flex items-center gap-1 ml-auto pl-1'>
                          <button
                            type='button'
                            onClick={() => commitEdit(guest)}
                            disabled={
                              !editingName.trim() ||
                              editingName.trim() === guest.name
                            }
                            className='text-green-600 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type='button'
                            onClick={cancelEdit}
                            className='text-red-500 hover:text-red-600 transition-colors'
                          >
                            <X size={14} />
                          </button>
                        </span>
                      </span>
                    ) : (
                      <span className='flex items-center gap-2 group min-w-0'>
                        <span className='min-w-0 wrap-break-word'>{guest.name}</span>
                        <button
                          type='button'
                          onClick={() => startEditing(guest)}
                          className='opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground'
                        >
                          <Pencil size={13} />
                        </button>
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANTS[guest.status] ?? 'secondary'}
                      className={STATUS_CLASSES[guest.status]}
                    >
                      {STATUS_LABELS[guest.status] ?? guest.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground whitespace-pre-wrap wrap-break-word'>
                    {guest.message || '—'}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {guest.updatedAt
                      ? new Date(guest.updatedAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {guest.status !== 'confirmed' && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-500/20'
                          disabled={updatingId === guest.id}
                          onClick={() =>
                            handleStatusChange(guest, 'confirmed')
                          }
                        >
                          Confirm
                        </Button>
                      )}
                      {guest.status !== 'declined' && (
                        <Button
                          size='sm'
                          variant='destructive'
                          disabled={updatingId === guest.id}
                          onClick={() => handleStatusChange(guest, 'declined')}
                        >
                          Decline
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap justify-end gap-1'>
                      {guest.status !== 'pending' && (
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={updatingId === guest.id}
                          onClick={() => handleStatusChange(guest, 'pending')}
                        >
                          Reset
                        </Button>
                      )}
                      <Button
                        size='sm'
                        variant='outline'
                        className='text-destructive hover:text-destructive hover:bg-destructive/10'
                        disabled={deletingId === guest.id}
                        onClick={() =>
                          setPendingDelete({ id: guest.id, name: guest.name })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rename confirmation */}
      <Dialog
        open={!!pendingEdit}
        onOpenChange={(open) => !open && setPendingEdit(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Rename guest</DialogTitle>
            <DialogDescription>
              Are you sure you want to edit{' '}
              <span className='font-medium text-foreground'>
                "{pendingEdit?.oldName}"
              </span>{' '}
              to{' '}
              <span className='font-medium text-foreground'>
                "{pendingEdit?.newName}"
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setPendingEdit(null)}
              disabled={!!renamingId}
            >
              Cancel
            </Button>
            <Button onClick={confirmRename} disabled={!!renamingId}>
              {renamingId ? 'Saving…' : 'Yes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete guest</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-medium text-foreground'>
                "{pendingDelete?.name}"
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setPendingDelete(null)}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={confirmDelete}
              disabled={!!deletingId}
            >
              {deletingId ? 'Deleting…' : 'Yes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

type AuthState = 'checking' | 'signed-in' | 'signed-out';

export default function Admin() {
  const [authState, setAuthState] = useState<AuthState>('checking');

  useEffect(() => {
    let cancelled = false;
    auth.checkSession().then((authenticated) => {
      if (!cancelled) setAuthState(authenticated ? 'signed-in' : 'signed-out');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (authState === 'checking') {
    return (
      <div className='flex min-h-screen items-center justify-center text-sm text-muted-foreground'>
        Checking session…
      </div>
    );
  }

  if (authState === 'signed-out') {
    return <Navigate to='/login' replace />;
  }

  return (
    <AdminDashboard
      onLogout={() => {
        auth.logout();
        setAuthState('signed-out');
      }}
    />
  );
}
