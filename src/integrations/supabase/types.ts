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
      admins: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          staff_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          permissions?: Json | null
          staff_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          common_scope: string | null
          course_code: string
          course_title: string | null
          created_at: string | null
          department_id: string
          faculty_id: string | null
          id: string
          is_compulsory: boolean
        }
        Insert: {
          common_scope?: string | null
          course_code: string
          course_title?: string | null
          created_at?: string | null
          department_id: string
          faculty_id?: string | null
          id?: string
          is_compulsory?: boolean
        }
        Update: {
          common_scope?: string | null
          course_code?: string
          course_title?: string | null
          created_at?: string | null
          department_id?: string
          faculty_id?: string | null
          id?: string
          is_compulsory?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lecturer_assignments: {
        Row: {
          academic_year: string | null
          course_id: string
          created_at: string
          department_id: string
          faculty_id: string
          id: string
          lecturer_id: string
          semester: string | null
          source_file: string | null
          source_row: number | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          course_id: string
          created_at?: string
          department_id: string
          faculty_id: string
          id?: string
          lecturer_id: string
          semester?: string | null
          source_file?: string | null
          source_row?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          course_id?: string
          created_at?: string
          department_id?: string
          faculty_id?: string
          id?: string
          lecturer_id?: string
          semester?: string | null
          source_file?: string | null
          source_row?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lecturer_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lecturer_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lecturer_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lecturer_assignments_lecturer_id_fkey"
            columns: ["lecturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          faculty_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          faculty_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          faculty_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_session_halls: {
        Row: {
          exam_session_id: string
          hall_id: string
        }
        Insert: {
          exam_session_id: string
          hall_id: string
        }
        Update: {
          exam_session_id?: string
          hall_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_session_halls_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_session_halls_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          comments: string | null
          course_id: string
          created_at: string | null
          end_time: string
          exam_date: string
          id: string
          start_time: string
        }
        Insert: {
          comments?: string | null
          course_id: string
          created_at?: string | null
          end_time: string
          exam_date: string
          id?: string
          start_time: string
        }
        Update: {
          comments?: string | null
          course_id?: string
          created_at?: string | null
          end_time?: string
          exam_date?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      halls: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          location: string | null
          name: string
          type: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          type?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      lecturers: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          specialization: string | null
          staff_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id: string
          specialization?: string | null
          staff_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          specialization?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecturers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecturers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_timetable_time_columns: {
        Row: {
          created_at: string
          end_time: string
          id: string
          sort_order: number
          start_time: string
          timetable_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          sort_order?: number
          start_time: string
          timetable_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          sort_order?: number
          start_time?: string
          timetable_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_timetable_time_columns_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "manual_timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_timetable_slots: {
        Row: {
          color: string
          course_id: string | null
          course_ids: string[] | null
          created_at: string
          day_of_week: string
          end_time: string
          hall_id: string | null
          hall_ids: string[] | null
          id: string
          lecturer_id: string | null
          lecturer_ids: string[] | null
          notes: string | null
          slot_type: string
          start_time: string
          timetable_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          course_id?: string | null
          course_ids?: string[] | null
          created_at?: string
          day_of_week: string
          end_time: string
          hall_id?: string | null
          hall_ids?: string[] | null
          id?: string
          lecturer_id?: string | null
          lecturer_ids?: string[] | null
          notes?: string | null
          slot_type?: string
          start_time: string
          timetable_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          course_id?: string | null
          course_ids?: string[] | null
          created_at?: string
          day_of_week?: string
          end_time?: string
          hall_id?: string | null
          hall_ids?: string[] | null
          id?: string
          lecturer_id?: string | null
          lecturer_ids?: string[] | null
          notes?: string | null
          slot_type?: string
          start_time?: string
          timetable_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_timetable_slots_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_timetable_slots_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_timetable_slots_lecturer_id_fkey"
            columns: ["lecturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_timetable_slots_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "manual_timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_timetables: {
        Row: {
          academic_year: string
          created_at: string
          created_by: string | null
          department_id: string | null
          faculty_id: string | null
          header_text: string | null
          id: string
          level: string
          notes: string | null
          published_at: string | null
          semester: string
          start_date: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          academic_year?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          faculty_id?: string | null
          header_text?: string | null
          id?: string
          level?: string
          notes?: string | null
          published_at?: string | null
          semester?: string
          start_date?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          faculty_id?: string | null
          header_text?: string | null
          id?: string
          level?: string
          notes?: string | null
          published_at?: string | null
          semester?: string
          start_date?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_timetables_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_timetables_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          level: number | null
          student_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id: string
          level?: number | null
          student_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          level?: number | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_id_fkey"
            columns: ["id"]
            isOneToOne: true
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
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      user_role: "admin" | "lecturer" | "student"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "lecturer", "student"],
    },
  },
} as const
