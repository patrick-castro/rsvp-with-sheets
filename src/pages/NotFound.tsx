import { Link } from 'react-router-dom';

import { cardClass, Eyebrow, Ornament } from '@/pages/Home';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_oklch(0.91_0.025_100_/_0.6),_transparent_55%)]'
      />
      <div className='relative w-full max-w-md'>
        <Card className={cardClass}>
          <CardHeader className='gap-3 text-center'>
            <Eyebrow>Wrong Turn</Eyebrow>
            <CardTitle className='font-heading text-3xl font-normal tracking-wide text-foreground'>
              Page Not Found
            </CardTitle>
            <Ornament />
            <CardDescription className='px-2 font-sans text-base text-muted-foreground'>
              The page you're looking for doesn't seem to exist. Let's get you
              back to the celebration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className='h-11 w-full font-sans text-base tracking-wide'
            >
              <Link to='/rsvp'>Back to the RSVP</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
