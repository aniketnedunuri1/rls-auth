import { NextResponse } from 'next/server';
import { getUser } from '@/lib/actions/auth';
import stripe from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const user = await getUser();
    
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Unauthorized or no subscription found' },
        { status: 401 }
      );
    }

    console.log('user', user);

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`,
    });

    // Make sure we're returning valid JSON
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    // Make sure error response is also valid JSON
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
} 