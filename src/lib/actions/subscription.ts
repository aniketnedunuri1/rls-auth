"use server";

import { getUser } from './auth';
import { prisma } from '../prisma';

export async function checkSubscription() {
  try {
    const user = await getUser();
    
    if (!user) {
      return { hasActiveSubscription: false, error: 'User not found' };
    }
    
    // Convert subscriptionStatus to hasActiveSubscription
    const hasActiveSubscription = user.subscriptionStatus === 'pro';
    
    return { hasActiveSubscription };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { hasActiveSubscription: false, error };
  }
} 