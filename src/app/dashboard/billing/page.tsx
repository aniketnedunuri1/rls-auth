"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { checkSubscription } from "@/lib/actions/subscription";
import { Loader2, CreditCard } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
// import { useToast } from "@/components/ui/use-toast";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<{ 
    hasActiveSubscription: boolean, 
    error?: unknown 
  }>({ 
    hasActiveSubscription: false 
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkUserSubscription = async () => {
      const result = await checkSubscription();
      setSubscription({
        hasActiveSubscription: result.hasActiveSubscription === true,
        error: result.error
      });
    };

    checkUserSubscription();

    // Check URL params for success/canceled
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    // if (success) {
    //   toast({
    //     title: "Subscription Successful",
    //     description: "Your subscription has been activated successfully.",
    //     variant: "default",
    //   });
    // }

    // if (canceled) {
    //   toast({
    //     title: "Subscription Canceled",
    //     description: "Your subscription process was canceled.",
    //     variant: "destructive",
    //   });
    // }
  }, [searchParams]);

  const handleSubscribe = async () => {
   
    setLoading(true);
    console.log('Loading state set to true');
    
    try {
      console.log('Starting subscription process...');
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response:', response);

      console.log('Response status:', response.status);
      
      // Try to get the response text first
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      // Only try to parse if we have content
      if (responseText) {
        try {
          const data = JSON.parse(responseText);
          console.log('Parsed data:', data);
          
          if (data.url) {
            console.log('Redirecting to:', data.url);
            window.location.href = data.url;
          } else if (data.error) {
            console.error('API error:', data.error, data.message);
            throw new Error(data.message || data.error);
          } else {
            throw new Error('No URL in response');
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid JSON response');
        }
      } else {
        throw new Error('Empty response from server');
      }
    } catch (error) {
      console.error('Error details:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to initiate subscription'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    console.log('Starting subscription process...');
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create customer portal session');
      }
    } catch (error) {
      console.error('Error:', error);
      // toast({
      //   title: "Error",
      //   description: "Failed to open subscription management portal.",
      //   variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">Subscription Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-white/10 bg-[#0f0f0f] rounded-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Free Plan</CardTitle>
            <CardDescription className="text-gray-400 text-sm">Basic access with limited features</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-4">$0</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Generate anonymous role tests
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Run anonymous role tests
              </li>
              <li className="flex items-center text-gray-500">
                <svg className="h-5 w-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="line-through">Authenticated role tests</span>
              </li>
              <li className="flex items-center text-gray-500">
                <svg className="h-5 w-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="line-through">Advanced security features</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              disabled={!subscription.hasActiveSubscription} 
              className="w-full border border-white/10 hover:border-white/20 text-white rounded-md bg-transparent"
            >
              {!subscription.hasActiveSubscription ? "Current Plan" : "Downgrade"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-purple-500/20 bg-[#0f0f0f] rounded-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Pro Plan</CardTitle>
            <CardDescription className="text-gray-400 text-sm">Full access to all features</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-4">$15<span className="text-sm font-normal text-gray-400 ml-1">/month</span></p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Generate anonymous role tests
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Run anonymous role tests
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Generate authenticated role tests
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Run authenticated role tests
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 text-purple-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced security features
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {subscription.hasActiveSubscription ? (
              <Button 
                className="w-full border border-white/10 hover:border-white/20 text-white rounded-md bg-transparent"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Manage Subscription"
                )}
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  console.log('Button clicked directly');
                  handleSubscribe();
                }} 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-md" 
                disabled={loading}
              >
                {loading ? "Processing..." : "Subscribe Now"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {subscription.hasActiveSubscription && (
        <div className="mt-10">
          <Card className="border border-white/10 bg-[#0f0f0f] rounded-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Your Pro Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You currently have an active Pro subscription with access to all features.</p>
              <p className="mt-2 text-sm text-gray-400">
                You can manage your subscription, update payment methods, or cancel at any time.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-2" 
                onClick={handleManageSubscription}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Manage Subscription
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
} 