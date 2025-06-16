import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
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
    headers: { 
      'x-application-name': 'diet-planner',
      'Content-Type': 'application/json'
    },
    fetch: (url, options = {}) => {
      // Add timeout to fetch requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
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

// Helper function to check if we can reach Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('Supabase connection check failed:', error);
    return false;
  }
}

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
      
      // Don't retry auth errors or network errors on first attempt
      if (error?.status === 401 || error?.status === 403) {
        throw error;
      }
      
      // For fetch errors, check connection before retrying
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        const canConnect = await checkSupabaseConnection();
        if (!canConnect && attempt === 1) {
          throw new Error('Unable to connect to Supabase. Please check your internet connection and Supabase configuration.');
        }
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