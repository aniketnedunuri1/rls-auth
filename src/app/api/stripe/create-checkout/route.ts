import { NextResponse } from 'next/server';
import { getUser } from '@/lib/actions/auth';
import { prisma } from '@/lib/prisma';
import stripe from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    // Log environment variables (redacted for security)
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID);
    console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    
    const user = await getUser();
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Creating checkout for user:', user.id);

    try {
      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        console.log('No Stripe customer ID found, creating new customer');
        try {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              userId: user.id,
            },
          });
          
          // Update customerId with the new customer ID
          customerId = customer.id;
          
          // Save the customer ID to the user
          try {
            console.log('Created Stripe customer:', customer.id);
            console.log('User:', user.id);
            await prisma.user.update({
              where: { id: user.id },
              data: { stripeCustomerId: customer.id },
            });
            console.log('Updated user with Stripe customer ID:', customer.id);
          } 
          catch (updateError) {
            console.error('Error updating user with Stripe customer ID:', updateError);
            // Continue anyway, using the customer ID we just created
          }
        } catch (customerError) {
          console.error('Error creating customer:', customerError);
          return NextResponse.json(
            { 
              error: 'Failed to create Stripe customer',
              message: customerError instanceof Error ? customerError.message : 'Unknown error'
            },
            { status: 500 }
          );
        }
      } else {
        console.log('Using existing Stripe customer ID:', customerId);
      }

      console.log('Creating checkout session with price:', process.env.STRIPE_PRICE_ID);

      try {
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          // Only include customer if customerId is not null
          ...(customerId ? { customer: customerId } : {}),
          line_items: [
            {
              price: process.env.STRIPE_PRICE_ID,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?canceled=true`,
          metadata: {
            userId: user.id,
          },
        });

        console.log('Checkout session created:', session.id);

        // Make sure we're returning valid JSON
        return NextResponse.json({ url: session.url });
      } catch (sessionError) {
        console.error('Error creating checkout session:', sessionError);
        return NextResponse.json(
          { 
            error: 'Failed to create checkout session',
            message: sessionError instanceof Error ? sessionError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } catch (stripeError) {
      console.error('Stripe operation error:', stripeError);
      return NextResponse.json(
        { 
          error: 'Stripe operation failed',
          message: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in checkout route:', error);
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session', 
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 