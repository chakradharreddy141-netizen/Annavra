export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_summaries: {
        Row: {
          created_at: string | null
          date: string
          goal_id: string | null
          id: string
          meals_logged: number | null
          steps: number | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          updated_at: string | null
          user_id: string
          water_ml: number | null
          workout_completed: boolean | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          goal_id?: string | null
          id?: string
          meals_logged?: number | null
          steps?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id: string
          water_ml?: number | null
          workout_completed?: boolean | null
        }
        Update: {
          created_at?: string | null
          date?: string
          goal_id?: string | null
          id?: string
          meals_logged?: number | null
          steps?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id?: string
          water_ml?: number | null
          workout_completed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_summaries_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          equipment: string | null
          exercise_type: string | null
          id: string
          muscle_group: string
          name: string
          primary_muscles: string[] | null
          secondary_muscles: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          equipment?: string | null
          exercise_type?: string | null
          id?: string
          muscle_group: string
          name: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          equipment?: string | null
          exercise_type?: string | null
          id?: string
          muscle_group?: string
          name?: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          bmi: number
          bmi_category: string
          bmr: number
          body_fat_pct: number | null
          created_at: string | null
          current_weight_kg: number
          daily_calories: number
          daily_carbs_g: number
          daily_fat_g: number
          daily_fiber_g: number
          daily_protein_g: number
          daily_water_ml: number
          effective_from: string | null
          effective_until: string | null
          fitness_goal: string
          id: string
          is_active: boolean | null
          target_weight_kg: number | null
          tdee: number
          user_id: string
        }
        Insert: {
          bmi: number
          bmi_category: string
          bmr: number
          body_fat_pct?: number | null
          created_at?: string | null
          current_weight_kg: number
          daily_calories: number
          daily_carbs_g: number
          daily_fat_g: number
          daily_fiber_g: number
          daily_protein_g: number
          daily_water_ml: number
          effective_from?: string | null
          effective_until?: string | null
          fitness_goal: string
          id?: string
          is_active?: boolean | null
          target_weight_kg?: number | null
          tdee: number
          user_id: string
        }
        Update: {
          bmi?: number
          bmi_category?: string
          bmr?: number
          body_fat_pct?: number | null
          created_at?: string | null
          current_weight_kg?: number
          daily_calories?: number
          daily_carbs_g?: number
          daily_fat_g?: number
          daily_fiber_g?: number
          daily_protein_g?: number
          daily_water_ml?: number
          effective_from?: string | null
          effective_until?: string | null
          fitness_goal?: string
          id?: string
          is_active?: boolean | null
          target_weight_kg?: number | null
          tdee?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_items: {
        Row: {
          calories: number
          carbs_g: number
          confidence: number | null
          created_at: string | null
          fat_g: number
          fdc_id: string | null
          fiber_g: number | null
          food_name: string
          id: string
          meal_id: string
          protein_g: number
          quantity: number
          serving_size: string | null
          sodium_mg: number | null
          source: string | null
          sugar_g: number | null
          unit: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          confidence?: number | null
          created_at?: string | null
          fat_g?: number
          fdc_id?: string | null
          fiber_g?: number | null
          food_name: string
          id?: string
          meal_id: string
          protein_g?: number
          quantity?: number
          serving_size?: string | null
          sodium_mg?: number | null
          source?: string | null
          sugar_g?: number | null
          unit?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          confidence?: number | null
          created_at?: string | null
          fat_g?: number
          fdc_id?: string | null
          fiber_g?: number | null
          food_name?: string
          id?: string
          meal_id?: string
          protein_g?: number
          quantity?: number
          serving_size?: string | null
          sodium_mg?: number | null
          source?: string | null
          sugar_g?: number | null
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_targets: {
        Row: {
          created_at: string | null
          goal_id: string | null
          id: string
          is_active: boolean | null
          meal_name: string
          meal_number: number
          target_calories: number
          target_carbs_g: number
          target_fat_g: number
          target_protein_g: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id?: string | null
          id?: string
          is_active?: boolean | null
          meal_name: string
          meal_number: number
          target_calories: number
          target_carbs_g: number
          target_fat_g: number
          target_protein_g: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string | null
          id?: string
          is_active?: boolean | null
          meal_name?: string
          meal_number?: number
          target_calories?: number
          target_carbs_g?: number
          target_fat_g?: number
          target_protein_g?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_targets_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string | null
          date: string
          id: string
          image_url: string | null
          logged_at: string | null
          meal_name: string
          meal_number: number
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          total_sodium_mg: number | null
          total_sugar_g: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          image_url?: string | null
          logged_at?: string | null
          meal_name: string
          meal_number: number
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          total_sodium_mg?: number | null
          total_sugar_g?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          image_url?: string | null
          logged_at?: string | null
          meal_name?: string
          meal_number?: number
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          total_sodium_mg?: number | null
          total_sugar_g?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          created_at: string | null
          current_workout_split: string | null
          daily_step_target: number | null
          dietary_preference: string | null
          dietary_restrictions: string | null
          email: string | null
          gender: string | null
          height_cm: number | null
          id: string
          meals_per_day: number | null
          name: string | null
          onboarding_completed: boolean | null
          preferred_workout_days: string[] | null
          theme: string | null
          units: string | null
          updated_at: string | null
          workout_frequency: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          created_at?: string | null
          current_workout_split?: string | null
          daily_step_target?: number | null
          dietary_preference?: string | null
          dietary_restrictions?: string | null
          email?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          meals_per_day?: number | null
          name?: string | null
          onboarding_completed?: boolean | null
          preferred_workout_days?: string[] | null
          theme?: string | null
          units?: string | null
          updated_at?: string | null
          workout_frequency?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          created_at?: string | null
          current_workout_split?: string | null
          daily_step_target?: number | null
          dietary_preference?: string | null
          dietary_restrictions?: string | null
          email?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          meals_per_day?: number | null
          name?: string | null
          onboarding_completed?: boolean | null
          preferred_workout_days?: string[] | null
          theme?: string | null
          units?: string | null
          updated_at?: string | null
          workout_frequency?: number | null
        }
        Relationships: []
      }
      saved_meals: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          name: string
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_protein_g: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json
          name: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          name?: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      step_entries: {
        Row: {
          created_at: string | null
          date: string
          id: string
          steps: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          steps?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          steps?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_entries: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: string
          is_rest_day: boolean | null
          user_id: string
          workout_type: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          is_rest_day?: boolean | null
          user_id: string
          workout_type?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_rest_day?: boolean | null
          user_id?: string
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_schedule_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          is_pr: boolean | null
          notes: string | null
          reps: number
          rest_seconds: number | null
          set_number: number
          user_id: string
          weight_kg: number
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          is_pr?: boolean | null
          notes?: string | null
          reps: number
          rest_seconds?: number | null
          set_number: number
          user_id: string
          weight_kg: number
          workout_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          is_pr?: boolean | null
          notes?: string | null
          reps?: number
          rest_seconds?: number | null
          set_number?: number
          user_id?: string
          weight_kg?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          date: string
          duration_minutes: number | null
          id: string
          name: string | null
          notes: string | null
          updated_at: string | null
          user_id: string
          workout_type: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
          workout_type: string
        }
        Update: {
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type DietaryPreference = 'vegetarian' | 'vegan' | 'eggetarian' | 'non_vegetarian' | 'custom';
export type FitnessGoal = 'lose_fat' | 'maintain' | 'gain_muscle' | 'gain_weight' | 'improve_fitness' | 'improve_strength' | 'custom';
export type Units = 'metric' | 'imperial';
export type Theme = 'light' | 'dark' | 'system';

export type Profile = Omit<Database['public']['Tables']['profiles']['Row'], 'gender' | 'activity_level' | 'dietary_preference' | 'units' | 'theme'> & { 
    gender: Gender | null, 
    activity_level: ActivityLevel | null, 
    dietary_preference: DietaryPreference | null, 
    units: Units, 
    theme: Theme,
    timezone?: string | null 
};
export type Goal = Omit<Database['public']['Tables']['goals']['Row'], 'fitness_goal'> & { fitness_goal: FitnessGoal };
export type MealTarget = Database['public']['Tables']['meal_targets']['Row'];
export type WeightEntry = Database['public']['Tables']['weight_entries']['Row'];
export type Meal = Database['public']['Tables']['meals']['Row'];
export type MealItem = Database['public']['Tables']['meal_items']['Row'] & { 
    nutrition_source?: 'ai' | 'nutrition_label' | 'usda' | 'user_entered',
    confidence?: number | null,
    source?: string | null
};
export type Workout = Database['public']['Tables']['workouts']['Row'];
export type Exercise = Database['public']['Tables']['exercises']['Row'] & {
    primary_muscles?: string[] | null,
    secondary_muscles?: string[] | null
};
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row'];
export type StepEntry = Database['public']['Tables']['step_entries']['Row'];
export type DailySummary = Database['public']['Tables']['daily_summaries']['Row'];
