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

// Replace with the couple's wedding date
const COUPLE_NAMES = 'Gelo & Princess';
const WEDDING_DATE = 'The Twenty-Fourth of July, Two Thousand Twenty-Six';

type Step =
  | { id: 'search' }
  | { id: 'found'; guests: Guest[]; query: string }
  | { id: 'not-found'; query: string }
  | { id: 'already-rsvped'; name: string; status: 'confirmed' | 'declined' }
  | { id: 'success'; name: string; status: 'confirmed' | 'declined' };

export const cardClass =
  'w-full max-w-md gap-7 border border-primary/15 py-10 shadow-[0_30px_70px_-35px_oklch(0.32_0.025_60_/_0.45)]';

// ─── Shared bits ──────────────────────────────────────────────────────────────

export function Ornament() {
  return (
    <div
      aria-hidden
      className='flex items-center justify-center gap-3 text-primary/50'
    >
      <span className='h-px w-12 bg-current' />
      <span className='size-1.5 rotate-45 bg-current' />
      <span className='h-px w-12 bg-current' />
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className='font-sans text-xs tracking-[0.35em] text-primary uppercase'>
      {children}
    </p>
  );
}

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
    <Card className={cardClass}>
      <CardHeader className='gap-3 text-center'>
        <Eyebrow>Together with our families</Eyebrow>
        <CardTitle className='font-heading text-4xl font-normal tracking-wide text-foreground'>
          {COUPLE_NAMES}
        </CardTitle>
        <p className='font-sans text-sm text-muted-foreground italic'>
          {WEDDING_DATE}
        </p>
        <Ornament />
        <CardDescription className='px-2 font-sans text-base text-muted-foreground'>
          We would be honored to have you join us. Please enter your name
          below and we'll find your place on the guest list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-7'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='font-sans text-sm tracking-wide text-foreground/80'>
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. Maria Santos'
                      className='h-11 border-border/80 bg-background/60 font-sans text-base'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {apiError && <p className='text-sm text-destructive'>{apiError}</p>}
            <Button
              type='submit'
              className='h-11 w-full font-sans text-base tracking-wide'
              disabled={loading}
            >
              {loading ? 'Searching…' : 'Find My Invitation'}
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
    <Card className={cardClass}>
      <CardHeader className='gap-3 text-center'>
        <Eyebrow>Wonderful</Eyebrow>
        <CardTitle className='font-heading text-3xl font-normal tracking-wide text-foreground'>
          We Found You
        </CardTitle>
        <Ornament />
        <CardDescription className='px-2 font-sans text-base text-muted-foreground'>
          {guests.length > 1
            ? 'We found a few names that match. Please confirm which one is you.'
            : `${guests[0].name}, we're delighted you'll be considering joining us.`}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {guests.length > 1 && (
          <div className='space-y-2'>
            <p className='font-sans text-sm font-medium tracking-wide'>
              Select your name:
            </p>
            <div className='space-y-2'>
              {guests.map((g) => (
                <button
                  key={g.id}
                  type='button'
                  onClick={() => setSelectedGuest(g)}
                  className={`w-full border px-4 py-3 text-left font-sans text-sm transition-colors ${
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
                    <FormLabel className='font-sans text-sm tracking-wide text-foreground/80'>
                      Leave a wish for the couple (optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Write a message to the couple…'
                        rows={3}
                        maxLength={750}
                        className='border-border/80 bg-background/60 font-sans text-base'
                        {...field}
                      />
                    </FormControl>
                    <p className='text-right font-sans text-xs text-muted-foreground'>
                      {(field.value ?? '').length} / 750
                    </p>
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
                  className='h-11 flex-1 font-sans text-sm tracking-wide'
                  disabled={loading}
                  onClick={() => form.setValue('status', 'confirmed')}
                >
                  {loading && form.getValues('status') === 'confirmed'
                    ? 'Submitting…'
                    : 'Joyfully Accept'}
                </Button>
                <Button
                  type='submit'
                  variant='outline'
                  className='h-11 flex-1 font-sans text-sm tracking-wide'
                  disabled={loading}
                  onClick={() => form.setValue('status', 'declined')}
                >
                  {loading && form.getValues('status') === 'declined'
                    ? 'Submitting…'
                    : 'Regretfully Decline'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {guests.length > 1 && !selectedGuest && (
          <p className='text-center font-sans text-sm text-muted-foreground'>
            Select your name above to continue.
          </p>
        )}

        <Button
          variant='secondary'
          className='w-full font-sans text-sm tracking-wide'
          onClick={onBack}
        >
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
    <Card className={cardClass}>
      <CardHeader className='gap-3 text-center'>
        <Eyebrow>Hmm</Eyebrow>
        <CardTitle className='font-heading text-3xl font-normal tracking-wide text-foreground'>
          We Couldn't Find You
        </CardTitle>
        <Ornament />
        <CardDescription className='px-2 font-sans text-base text-muted-foreground'>
          We couldn't find{' '}
          <span className='font-medium text-foreground'>"{query}"</span> on
          our guest list.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <p className='text-center font-sans text-sm text-muted-foreground'>
          If you believe this is a mistake, please reach out to us directly:
        </p>
        <div className='grid grid-cols-2 divide-x divide-primary/15 border border-primary/15 bg-accent/40 font-sans text-sm'>
          <div className='space-y-1 p-5 text-center'>
            <p className='font-medium tracking-wide'>Gelo</p>
            <p className='text-muted-foreground'>+63 932 670 2248</p>
          </div>
          <div className='space-y-1 p-5 text-center'>
            <p className='font-medium tracking-wide'>Princess</p>
            <p className='text-muted-foreground'>+63 976 067 8298</p>
          </div>
        </div>
        <Button
          variant='outline'
          className='h-11 w-full font-sans text-sm tracking-wide'
          onClick={onBack}
        >
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
    <Card className={cardClass}>
      <CardHeader className='gap-3 text-center'>
        <Eyebrow>{confirmed ? 'With Joy' : 'Noted, With Thanks'}</Eyebrow>
        <CardTitle className='font-heading text-3xl font-normal tracking-wide text-foreground'>
          {confirmed ? 'See You There' : "We'll Miss You"}
        </CardTitle>
        <Ornament />
        <CardDescription className='px-2 font-sans text-base text-muted-foreground'>
          {confirmed
            ? `Thank you, ${name}. Your place at our celebration is confirmed — we can't wait to share this day with you.`
            : `Thank you for letting us know, ${name}. We're sorry you won't be able to join us, but we appreciate you taking the time to reply.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant='outline'
          className='h-11 w-full font-sans text-sm tracking-wide'
          onClick={onBack}
        >
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
    <Card className={cardClass}>
      <CardHeader className='gap-3 text-center'>
        <Eyebrow>Already on Record</Eyebrow>
        <CardTitle className='font-heading text-3xl font-normal tracking-wide text-foreground'>
          {confirmed ? 'RSVP Confirmed' : 'RSVP Declined'}
        </CardTitle>
        <Ornament />
        <CardDescription className='px-2 font-sans text-base text-muted-foreground'>
          {name}'s reply has already been recorded as{' '}
          {confirmed ? 'attending' : 'unable to attend'}.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <p className='text-center font-sans text-sm text-muted-foreground'>
          If you have questions, feel free to reach out:
        </p>
        <div className='grid grid-cols-2 divide-x divide-primary/15 border border-primary/15 bg-accent/40 font-sans text-sm'>
          <div className='space-y-1 p-5 text-center'>
            <p className='font-medium tracking-wide'>Gelo</p>
            <p className='text-muted-foreground'>+63 932 670 2248</p>
          </div>
          <div className='space-y-1 p-5 text-center'>
            <p className='font-medium tracking-wide'>Princess</p>
            <p className='text-muted-foreground'>+63 976 067 8298</p>
          </div>
        </div>
        <Button
          variant='outline'
          className='h-11 w-full font-sans text-sm tracking-wide'
          onClick={onBack}
        >
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
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_oklch(0.91_0.025_100_/_0.6),_transparent_55%)]'
      />
      <div className='relative w-full max-w-md'>
        {step.id === 'search' && (
          <SearchStep
            onFound={handleFound}
            onNotFound={(query) => setStep({ id: 'not-found', query })}
          />
        )}
        {step.id === 'found' && (
          <FoundStep
            guests={step.guests}
            onSuccess={(name, status) =>
              setStep({ id: 'success', name, status })
            }
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
    </div>
  );
}
