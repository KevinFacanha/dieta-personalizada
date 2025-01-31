import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure client with better error handling and retries
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'diet-planner' }
  },
  db: {
    schema: 'public'
  },
  // Add retry configuration
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Helper function for retries with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000,
  exponential = true
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // More detailed error logging
      console.warn(
        `Attempt ${attempt}/${maxAttempts} failed:`,
        error?.message || error,
        error?.status,
        error?.statusText
      );
      
      // Don't retry auth errors
      if (error?.status === 401 || error?.status === 403) {
        throw error;
      }
      
      if (attempt < maxAttempts) {
        // Exponential delay with jitter
        const delay = exponential
          ? Math.min(baseDelay * Math.pow(2, attempt - 1), 10000) + Math.random() * 1000
          : baseDelay;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}