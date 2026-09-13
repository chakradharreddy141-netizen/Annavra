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
      workouts: {
        Row: {
          id: string
          user_id: string
          date: string
          workout_type: string
          name: string | null
          duration_minutes: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          workout_type: string
          name?: string | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          workout_type?: string
          name?: string | null
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      workout_sets: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          user_id: string
          set_number: number
          reps: number
          weight_kg: number
          rest_seconds: number | null
          notes: string | null
          is_pr: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          user_id: string
          set_number: number
          reps: number
          weight_kg: number
          rest_seconds?: number | null
          notes?: string | null
          is_pr?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          user_id?: string
          set_number?: number
          reps?: number
          weight_kg?: number
          rest_seconds?: number | null
          notes?: string | null
          is_pr?: boolean
          created_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          muscle_group: string
          primary_muscles: string[] | null
          secondary_muscles: string[] | null
        }
        Insert: {
          id?: string
          name: string
          muscle_group: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
        }
        Update: {
          id?: string
          name?: string
          muscle_group?: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
        }
      }
      daily_summaries: {
        Row: {
          id: string
          user_id: string
          date: string
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number
          steps: number
          workout_completed: boolean
          daily_step_target: number
          goal_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          steps?: number
          workout_completed?: boolean
          daily_step_target?: number
          goal_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          steps?: number
          workout_completed?: boolean
          daily_step_target?: number
          goal_id?: string | null
        }
      }
    }
  }
}
