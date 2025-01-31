export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_points: {
        Row: {
          id: string
          user_id: string
          points: number
          free_weekly_meals: number
          last_week_reset: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points?: number
          free_weekly_meals?: number
          last_week_reset?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          free_weekly_meals?: number
          last_week_reset?: string
          created_at?: string
          updated_at?: string
        }
      }
      meal_history: {
        Row: {
          id: string
          user_id: string
          date: string
          breakfast: boolean
          morning_snack: boolean
          lunch: boolean
          afternoon_snack: boolean
          dinner: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          breakfast?: boolean
          morning_snack?: boolean
          lunch?: boolean
          afternoon_snack?: boolean
          dinner?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          breakfast?: boolean
          morning_snack?: boolean
          lunch?: boolean
          afternoon_snack?: boolean
          dinner?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferences: {
            carbs: string[]
            proteins: string[]
            fruits: string[]
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferences: {
            carbs: string[]
            proteins: string[]
            fruits: string[]
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferences?: {
            carbs: string[]
            proteins: string[]
            fruits: string[]
          }
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}