import { PrismaClient } from '@prisma/client'

// Define a global type that includes our prisma instance
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create the instance if it doesn't exist, or reuse the existing one
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

// In development, save the instance to the global object
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 