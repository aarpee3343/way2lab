'use server';

import prisma from '@/lib/db'; // Ensure this points to your Prisma Client instance

/**
 * 1. Fetch All Unique States from Database
 */
export async function fetchStates() {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' },
      select: { name: true }
    });
    
    // Returns a flat array of strings: ["ASSAM", "BIHAR", ...]
    return states.map(s => s.name.toUpperCase());
  } catch (error) {
    console.error("❌ Database Error (fetchStates):", error);
    return [];
  }
}

/**
 * 2. Fetch Districts (Cities) for a selected State
 */
export async function fetchCities(stateName: string) {
  if (!stateName) return [];
  
  try {
    const cities = await prisma.city.findMany({
      where: {
        state: {
          name: {
            equals: stateName,
            mode: 'insensitive' // Handles case mismatches
          }
        }
      },
      orderBy: { name: 'asc' },
      select: { name: true }
    });

    return cities.map(c => c.name);
  } catch (error) {
    console.error(`❌ Database Error (fetchCities) for ${stateName}:`, error);
    return [];
  }
}

/**
 * 3. Fetch Pincodes for a selected District
 */
export async function fetchPincodes(districtName: string) {
  if (!districtName) return [];

  try {
    const pincodes = await prisma.pincode.findMany({
      where: {
        city: {
          name: { equals: districtName, mode: 'insensitive' }
        }
      },
      select: { code: true },
      // This tells Prisma to only return unique codes
      distinct: ['code'], 
      orderBy: { code: 'asc' },
    });

    return pincodes.map(p => p.code);
  } catch (error) {
    console.error(`❌ fetchPincodes Error:`, error);
    return [];
  }
}