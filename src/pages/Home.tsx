import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { nameSearchSchema, type NameSearchValues } from '@/schemas/nameSearch';
import {
  confirmationSchema,
  type ConfirmationValues,
} from '@/schemas/confirmation';
import { sheets, type Guest } from '@/services/sheets';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Step =
  | { id: 'search' }
  | { id: 'found'; guests: Guest[]; query: string }
  | { id: 'not-found'; query: string }
  | { id: 'already-rsvped'; name: string; status: 'confirmed' | 'declined' }
  | { id: 'success'; name: string; status: 'confirmed' | 'declined' };

// ─── Search ──────────────────────────────────────────────────────────────────

type SearchStepProps = {
  onFound: (guests: Guest[], query: string) => void;
  onNotFound: (query: string) => void;
};

function SearchStep({ onFound, onNotFound }: SearchStepProps) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<NameSearchValues>({
    resolver: zodResolver(nameSearchSchema),
    defaultValues: { name: '' },
  });

  async function onSubmit(values: NameSearchValues) {
    setLoading(true);
    setApiError(null);

    try {
      const result = await sheets.search(values.name);

      if (result.found) {
        onFound(result.guests, values.name);
      } else {
        onNotFound(values.name);
      }
    } catch {
      setApiError('Unable to reach the RSVP service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>You're Invited</CardTitle>
        <CardDescription>
          Enter your name below and we'll look you up on the guest list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. John Doe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {apiError && <p className='text-sm text-destructive'>{apiError}</p>}
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Searching…' : 'Find My Name'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ─── Found ────────────────────────────────────────────────────────────────────

type FoundStepProps = {
  guests: Guest[];
  onSuccess: (name: string, status: 'confirmed' | 'declined') => void;
  onBack: () => void;
};

function FoundStep({ guests, onSuccess, onBack }: FoundStepProps) {
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(
    guests.length === 1 ? guests[0] : null,
  );
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ConfirmationValues>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: { note: '' },
  });

  async function onSubmit(values: ConfirmationValues) {
    if (!selectedGuest) return;
    setLoading(true);
    setApiError(null);

    try {
      await sheets.rsvp(selectedGuest.id, values.status, values.note ?? '');
      onSuccess(selectedGuest.name, values.status);
    } catch {
      setApiError('Unable to submit your RSVP. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>We found you!</CardTitle>
        <CardDescription>
          {guests.length > 1
            ? 'We found multiple matches. Please confirm which one is you.'
            : `We found ${guests[0].name} on our guest list.`}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {guests.length > 1 && (
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Select your name:</p>
            <div className='space-y-2'>
              {guests.map((g) => (
                <button
                  key={g.id}
                  type='button'
                  onClick={() => setSelectedGuest(g)}
                  className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                    selectedGuest?.id === g.id
                      ? 'border-primary bg-primary/10 font-medium'
                      : 'border-border hover:bg-muted'
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
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='note'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave a note (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Write a message to the couple…'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {apiError && (
                <p className='text-sm text-destructive'>{apiError}</p>
              )}

              <div className='flex gap-3'>
                <Button
                  type='submit'
                  className='flex-1'
                  disabled={loading}
                  onClick={() => form.setValue('status', 'confirmed')}
                >
                  {loading && form.getValues('status') === 'confirmed'
                    ? 'Submitting…'
                    : 'Confirm'}
                </Button>
                <Button
                  type='submit'
                  variant='outline'
                  className='flex-1'
                  disabled={loading}
                  onClick={() => form.setValue('status', 'declined')}
                >
                  {loading && form.getValues('status') === 'declined'
                    ? 'Submitting…'
                    : 'Decline'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {guests.length > 1 && !selectedGuest && (
          <p className='text-center text-sm text-muted-foreground'>
            Select your name above to continue.
          </p>
        )}

        <Button variant='ghost' className='w-full' onClick={onBack}>
          Search again
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────

type NotFoundStepProps = {
  query: string;
  onBack: () => void;
};

function NotFoundStep({ query, onBack }: NotFoundStepProps) {
  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>Name not found</CardTitle>
        <CardDescription>
          We couldn't find{' '}
          <span className='font-medium text-foreground'>"{query}"</span> on our
          guest list.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <p className='text-sm text-muted-foreground text-center'>
          If you believe this is a mistake, please reach out to us directly:
        </p>
        <div className='rounded-md border p-4 space-y-1 text-sm text-center'>
          {/* Replace with real contact details */}
          <p className='font-medium'>Contact the couple</p>
          <p className='text-muted-foreground'>+63 900 000 0000</p>
          <p className='text-muted-foreground'>hello@example.com</p>
        </div>
        <Button variant='outline' className='w-full' onClick={onBack}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────────

type SuccessStepProps = {
  name: string;
  status: 'confirmed' | 'declined';
  onBack: () => void;
};

function SuccessStep({ name, status, onBack }: SuccessStepProps) {
  const confirmed = status === 'confirmed';

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>
          {confirmed ? 'See you there!' : "We'll miss you!"}
        </CardTitle>
        <CardDescription>
          {confirmed
            ? `Thanks, ${name}. Your attendance has been confirmed. We can't wait to celebrate with you!`
            : `Thanks for letting us know, ${name}. We're sorry you can't make it.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant='outline' className='w-full' onClick={onBack}>
          Back to Home
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Already RSVPed ───────────────────────────────────────────────────────────

type AlreadyRsvpedStepProps = {
  name: string;
  status: 'confirmed' | 'declined';
  onBack: () => void;
};

function AlreadyRsvpedStep({ name, status, onBack }: AlreadyRsvpedStepProps) {
  const confirmed = status === 'confirmed';

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='text-center'>
        <CardTitle className='text-2xl'>
          {confirmed ? 'RSVP Confirmed' : 'RSVP Declined'}
        </CardTitle>
        <CardDescription>
          {name}'s RSVP has already been {confirmed ? 'confirmed' : 'declined'}.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <p className='text-sm text-muted-foreground text-center'>
          If you have questions, feel free to reach out:
        </p>
        <div className='rounded-md border p-4 space-y-1 text-sm text-center'>
          {/* Replace with real contact details */}
          <p className='font-medium'>Contact the couple</p>
          <p className='text-muted-foreground'>+63 900 000 0000</p>
          <p className='text-muted-foreground'>hello@example.com</p>
        </div>
        <Button variant='outline' className='w-full' onClick={onBack}>
          Back to RSVP
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [step, setStep] = useState<Step>({ id: 'search' });

  function handleFound(guests: Guest[], query: string) {
    const pending = guests.filter((g) => g.status === 'pending');
    if (pending.length > 0) {
      setStep({ id: 'found', guests: pending, query });
    } else {
      const guest = guests[0];
      setStep({
        id: 'already-rsvped',
        name: guest.name,
        status: guest.status as 'confirmed' | 'declined',
      });
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-8'>
      {step.id === 'search' && (
        <SearchStep
          onFound={handleFound}
          onNotFound={(query) => setStep({ id: 'not-found', query })}
        />
      )}
      {step.id === 'found' && (
        <FoundStep
          guests={step.guests}
          onSuccess={(name, status) => setStep({ id: 'success', name, status })}
          onBack={() => setStep({ id: 'search' })}
        />
      )}
      {step.id === 'not-found' && (
        <NotFoundStep
          query={step.query}
          onBack={() => setStep({ id: 'search' })}
        />
      )}
      {step.id === 'already-rsvped' && (
        <AlreadyRsvpedStep
          name={step.name}
          status={step.status}
          onBack={() => setStep({ id: 'search' })}
        />
      )}
      {step.id === 'success' && (
        <SuccessStep
          name={step.name}
          status={step.status}
          onBack={() => setStep({ id: 'search' })}
        />
      )}
    </div>
  );
}
