import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// Remove the headers import since we're using req.headers directly
// import { headers } from 'next/headers';

// This is critical for App Router
export const dynamic = 'force-dynamic';

// This is important - webhooks should NOT require authentication
export async function POST(req: Request) {
  console.log('Webhook received at:', new Date().toISOString());
  
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature found' }, { status: 400 });
    }

    console.log('Verifying webhook signature...');
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      
      console.log('Event verified:', event.type);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const session = event.data.object as any;

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Processing checkout.session.completed event');
        // Subscription created
        if (session.mode === 'subscription') {
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            const userId = session.metadata.userId;
            
            console.log('Updating subscription for user:', userId);

            // Calculate expiry date from the subscription period end
            const subscriptionExpiry = new Date(subscription.current_period_end * 1000);

            // Update user with subscription details
            await prisma.user.update({
              where: { id: userId },
              data: {
                subscriptionStatus: 'pro',
                subscriptionExpiry: subscriptionExpiry,
                stripeCustomerId: session.customer,
              },
            });
            
            console.log('User subscription updated successfully');
          } catch (error) {
            console.error('Error updating user subscription:', error);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        // Subscription renewed
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          // Find user by customer ID
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: session.customer },
          });

          if (user) {
            // Update subscription expiry
            await prisma.user.update({
              where: { id: user.id },
              data: {
                subscriptionStatus: 'pro',
                subscriptionExpiry: new Date(subscription.current_period_end * 1000),
              },
            });
          }
        }
        break;

      case 'customer.subscription.updated':
        // Subscription updated
        const customerSubscription = await stripe.subscriptions.retrieve(session.id);
        const customer = await prisma.user.findFirst({
          where: { stripeCustomerId: session.customer },
        });

        if (customer) {
          // Check if subscription is still active
          const isActive = customerSubscription.status === 'active';
          
          await prisma.user.update({
            where: { id: customer.id },
            data: {
              subscriptionStatus: isActive ? 'pro' : 'free',
              subscriptionExpiry: isActive 
                ? new Date(customerSubscription.current_period_end * 1000)
                : null,
            },
          });
        }
        break;

      case 'customer.subscription.deleted':
        // Subscription canceled or expired
        const canceledCustomer = await prisma.user.findFirst({
          where: { stripeCustomerId: session.customer },
        });

        if (canceledCustomer) {
          await prisma.user.update({
            where: { id: canceledCustomer.id },
            data: {
              subscriptionStatus: 'free',
              subscriptionExpiry: null,
            },
          });
        }
        break;
        
      // Handle customer.created event
      case 'customer.created':
        console.log('Customer created:', session.id);
        // No action needed here, just acknowledge receipt
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Remove the Pages Router config
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };  