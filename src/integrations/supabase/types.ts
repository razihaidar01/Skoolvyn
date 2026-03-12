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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          institution_id: string
          is_current: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          institution_id: string
          is_current?: boolean | null
          name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          institution_id?: string
          is_current?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions: {
        Row: {
          academic_year_id: string | null
          applicant_email: string | null
          applicant_name: string
          applicant_phone: string | null
          applying_for: string | null
          assigned_to: string | null
          created_at: string | null
          enquiry_date: string | null
          follow_up_date: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          institution_id: string
          program_id: string | null
          remarks: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year_id?: string | null
          applicant_email?: string | null
          applicant_name: string
          applicant_phone?: string | null
          applying_for?: string | null
          assigned_to?: string | null
          created_at?: string | null
          enquiry_date?: string | null
          follow_up_date?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          institution_id: string
          program_id?: string | null
          remarks?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string | null
          applicant_email?: string | null
          applicant_name?: string
          applicant_phone?: string | null
          applying_for?: string | null
          assigned_to?: string | null
          created_at?: string | null
          enquiry_date?: string | null
          follow_up_date?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          institution_id?: string
          program_id?: string | null
          remarks?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admissions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      alumni: {
        Row: {
          batch: string | null
          created_at: string | null
          current_company: string | null
          current_job_role: string | null
          email: string | null
          full_name: string
          id: string
          institution_id: string
          linkedin_url: string | null
          location: string | null
          passout_year: number | null
          phone: string | null
          program: string | null
          student_id: string | null
        }
        Insert: {
          batch?: string | null
          created_at?: string | null
          current_company?: string | null
          current_job_role?: string | null
          email?: string | null
          full_name: string
          id?: string
          institution_id: string
          linkedin_url?: string | null
          location?: string | null
          passout_year?: number | null
          phone?: string | null
          program?: string | null
          student_id?: string | null
        }
        Update: {
          batch?: string | null
          created_at?: string | null
          current_company?: string | null
          current_job_role?: string | null
          email?: string | null
          full_name?: string
          id?: string
          institution_id?: string
          linkedin_url?: string | null
          location?: string | null
          passout_year?: number | null
          phone?: string | null
          program?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alumni_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumni_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          attachment_url: string | null
          audience: string[] | null
          body: string
          created_at: string | null
          expires_at: string | null
          id: string
          institution_id: string
          is_published: boolean | null
          priority: string | null
          published_by: string | null
          title: string
        }
        Insert: {
          attachment_url?: string | null
          audience?: string[] | null
          body: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          institution_id: string
          is_published?: boolean | null
          priority?: string | null
          published_by?: string | null
          title: string
        }
        Update: {
          attachment_url?: string | null
          audience?: string[] | null
          body?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          institution_id?: string
          is_published?: boolean | null
          priority?: string | null
          published_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_logs: {
        Row: {
          action: string
          action_by: string | null
          created_at: string | null
          id: string
          institution_id: string | null
          reason: string | null
          target_type: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          action_by?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string | null
          reason?: string | null
          target_type: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          action_by?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string | null
          reason?: string | null
          target_type?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_logs_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_url: string | null
          id: string
          institution_id: string
          marks_given: number | null
          remarks: string | null
          status: string | null
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          institution_id: string
          marks_given?: number | null
          remarks?: string | null
          status?: string | null
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          id?: string
          institution_id?: string
          marks_given?: number | null
          remarks?: string | null
          status?: string | null
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          batch_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          faculty_id: string | null
          file_url: string | null
          id: string
          institution_id: string
          is_published: boolean | null
          max_marks: number | null
          subject_id: string
          title: string
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          faculty_id?: string | null
          file_url?: string | null
          id?: string
          institution_id: string
          is_published?: boolean | null
          max_marks?: number | null
          subject_id: string
          title: string
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          faculty_id?: string | null
          file_url?: string | null
          id?: string
          institution_id?: string
          is_published?: boolean | null
          max_marks?: number | null
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_subjects: {
        Row: {
          batch_id: string
          created_at: string | null
          faculty_id: string | null
          id: string
          institution_id: string
          subject_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          institution_id: string
          subject_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          institution_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_subjects_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_subjects_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_subjects_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          academic_year_id: string | null
          class_teacher_id: string | null
          created_at: string | null
          id: string
          institution_id: string
          is_active: boolean | null
          max_students: number | null
          name: string
          program_id: string
          room_no: string | null
          section: string | null
          semester: number | null
          year_level: number | null
        }
        Insert: {
          academic_year_id?: string | null
          class_teacher_id?: string | null
          created_at?: string | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          max_students?: number | null
          name: string
          program_id: string
          room_no?: string | null
          section?: string | null
          semester?: number | null
          year_level?: number | null
        }
        Update: {
          academic_year_id?: string | null
          class_teacher_id?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          max_students?: number | null
          name?: string
          program_id?: string
          room_no?: string | null
          section?: string | null
          semester?: number | null
          year_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          hod_id: string | null
          id: string
          institution_id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          hod_id?: string | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          hod_id?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_hod_id_fkey"
            columns: ["hod_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          audience: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          end_time: string | null
          event_type: string | null
          id: string
          institution_id: string
          is_holiday: boolean | null
          start_date: string
          start_time: string | null
          title: string
          venue: string | null
        }
        Insert: {
          audience?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          institution_id: string
          is_holiday?: boolean | null
          start_date: string
          start_time?: string | null
          title: string
          venue?: string | null
        }
        Update: {
          audience?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          institution_id?: string
          is_holiday?: boolean | null
          start_date?: string
          start_time?: string | null
          title?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_types: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string
          name: string
          weightage: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id: string
          name: string
          weightage?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string
          name?: string
          weightage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_types_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year_id: string | null
          batch_id: string
          created_at: string | null
          end_time: string | null
          exam_date: string | null
          exam_type_id: string | null
          id: string
          institution_id: string
          is_published: boolean | null
          max_marks: number | null
          pass_marks: number | null
          room_no: string | null
          start_time: string | null
          subject_id: string
        }
        Insert: {
          academic_year_id?: string | null
          batch_id: string
          created_at?: string | null
          end_time?: string | null
          exam_date?: string | null
          exam_type_id?: string | null
          id?: string
          institution_id: string
          is_published?: boolean | null
          max_marks?: number | null
          pass_marks?: number | null
          room_no?: string | null
          start_time?: string | null
          subject_id: string
        }
        Update: {
          academic_year_id?: string | null
          batch_id?: string
          created_at?: string | null
          end_time?: string | null
          exam_date?: string | null
          exam_type_id?: string | null
          id?: string
          institution_id?: string
          is_published?: boolean | null
          max_marks?: number | null
          pass_marks?: number | null
          room_no?: string | null
          start_time?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_exam_type_id_fkey"
            columns: ["exam_type_id"]
            isOneToOne: false
            referencedRelation: "exam_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          institution_id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount: number
          collected_by: string | null
          created_at: string | null
          id: string
          institution_id: string
          payment_date: string | null
          payment_mode: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          receipt_no: string
          remarks: string | null
          status: string | null
          student_fee_id: string
          student_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          collected_by?: string | null
          created_at?: string | null
          id?: string
          institution_id: string
          payment_date?: string | null
          payment_mode?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          receipt_no: string
          remarks?: string | null
          status?: string | null
          student_fee_id: string
          student_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          collected_by?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string
          payment_date?: string | null
          payment_mode?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          receipt_no?: string
          remarks?: string | null
          status?: string | null
          student_fee_id?: string
          student_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string | null
          amount: number
          batch_id: string | null
          created_at: string | null
          due_date: string | null
          fee_category_id: string | null
          frequency: string | null
          id: string
          institution_id: string
          is_active: boolean | null
          name: string
          program_id: string | null
        }
        Insert: {
          academic_year_id?: string | null
          amount: number
          batch_id?: string | null
          created_at?: string | null
          due_date?: string | null
          fee_category_id?: string | null
          frequency?: string | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          name: string
          program_id?: string | null
        }
        Update: {
          academic_year_id?: string | null
          amount?: number
          batch_id?: string | null
          created_at?: string | null
          due_date?: string | null
          fee_category_id?: string | null
          frequency?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          name?: string
          program_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_allocations: {
        Row: {
          academic_year_id: string | null
          allotment_date: string
          created_at: string | null
          id: string
          institution_id: string
          room_id: string
          status: string | null
          student_id: string
          vacate_date: string | null
        }
        Insert: {
          academic_year_id?: string | null
          allotment_date: string
          created_at?: string | null
          id?: string
          institution_id: string
          room_id: string
          status?: string | null
          student_id: string
          vacate_date?: string | null
        }
        Update: {
          academic_year_id?: string | null
          allotment_date?: string
          created_at?: string | null
          id?: string
          institution_id?: string
          room_id?: string
          status?: string | null
          student_id?: string
          vacate_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostel_allocations_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hostel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_rooms: {
        Row: {
          amenities: Json | null
          capacity: number | null
          created_at: string | null
          floor: number | null
          hostel_id: string
          id: string
          institution_id: string
          is_available: boolean | null
          monthly_fee: number | null
          occupied: number | null
          room_no: string
          type: string | null
        }
        Insert: {
          amenities?: Json | null
          capacity?: number | null
          created_at?: string | null
          floor?: number | null
          hostel_id: string
          id?: string
          institution_id: string
          is_available?: boolean | null
          monthly_fee?: number | null
          occupied?: number | null
          room_no: string
          type?: string | null
        }
        Update: {
          amenities?: Json | null
          capacity?: number | null
          created_at?: string | null
          floor?: number | null
          hostel_id?: string
          id?: string
          institution_id?: string
          is_available?: boolean | null
          monthly_fee?: number | null
          occupied?: number | null
          room_no?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostel_rooms_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_rooms_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      hostels: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string
          name: string
          total_capacity: number | null
          total_rooms: number | null
          type: string | null
          warden_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id: string
          name: string
          total_capacity?: number | null
          total_rooms?: number | null
          type?: string | null
          warden_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string
          name?: string
          total_capacity?: number | null
          total_rooms?: number | null
          type?: string | null
          warden_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostels_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostels_warden_id_fkey"
            columns: ["warden_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          academic_year_end: string | null
          academic_year_start: string | null
          address: string | null
          affiliation_no: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          board: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          institution_code: string | null
          is_active: boolean | null
          logo_url: string | null
          medium: string | null
          name: string
          phone: string | null
          pincode: string | null
          plan: string | null
          registered_by: string | null
          rejection_reason: string | null
          state: string | null
          subscription_ends_at: string | null
          timezone: string | null
          trial_ends_at: string | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          academic_year_end?: string | null
          academic_year_start?: string | null
          address?: string | null
          affiliation_no?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          board?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          institution_code?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          medium?: string | null
          name: string
          phone?: string | null
          pincode?: string | null
          plan?: string | null
          registered_by?: string | null
          rejection_reason?: string | null
          state?: string | null
          subscription_ends_at?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          academic_year_end?: string | null
          academic_year_start?: string | null
          address?: string | null
          affiliation_no?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          board?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          institution_code?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          medium?: string | null
          name?: string
          phone?: string | null
          pincode?: string | null
          plan?: string | null
          registered_by?: string | null
          rejection_reason?: string | null
          state?: string | null
          subscription_ends_at?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          document_url: string | null
          from_date: string
          id: string
          institution_id: string
          leave_type_id: string | null
          reason: string | null
          remarks: string | null
          status: string | null
          to_date: string
          total_days: number | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_url?: string | null
          from_date: string
          id?: string
          institution_id: string
          leave_type_id?: string | null
          reason?: string | null
          remarks?: string | null
          status?: string | null
          to_date: string
          total_days?: number | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_url?: string | null
          from_date?: string
          id?: string
          institution_id?: string
          leave_type_id?: string | null
          reason?: string | null
          remarks?: string | null
          status?: string | null
          to_date?: string
          total_days?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          applicable_to: string | null
          created_at: string | null
          id: string
          institution_id: string
          max_days: number | null
          name: string
        }
        Insert: {
          applicable_to?: string | null
          created_at?: string | null
          id?: string
          institution_id: string
          max_days?: number | null
          name: string
        }
        Update: {
          applicable_to?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string
          max_days?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          author: string | null
          available_copies: number | null
          category: string | null
          created_at: string | null
          edition: string | null
          id: string
          institution_id: string
          isbn: string | null
          publisher: string | null
          rack_no: string | null
          title: string
          total_copies: number | null
          year: number | null
        }
        Insert: {
          author?: string | null
          available_copies?: number | null
          category?: string | null
          created_at?: string | null
          edition?: string | null
          id?: string
          institution_id: string
          isbn?: string | null
          publisher?: string | null
          rack_no?: string | null
          title: string
          total_copies?: number | null
          year?: number | null
        }
        Update: {
          author?: string | null
          available_copies?: number | null
          category?: string | null
          created_at?: string | null
          edition?: string | null
          id?: string
          institution_id?: string
          isbn?: string | null
          publisher?: string | null
          rack_no?: string | null
          title?: string
          total_copies?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "library_books_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      library_issues: {
        Row: {
          book_id: string
          created_at: string | null
          due_date: string
          fine_amount: number | null
          fine_paid: boolean | null
          id: string
          institution_id: string
          issued_by: string | null
          issued_date: string
          returned_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          due_date: string
          fine_amount?: number | null
          fine_paid?: boolean | null
          id?: string
          institution_id: string
          issued_by?: string | null
          issued_date: string
          returned_date?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          due_date?: string
          fine_amount?: number | null
          fine_paid?: boolean | null
          id?: string
          institution_id?: string
          issued_by?: string | null
          issued_date?: string
          returned_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_issues_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_issues_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_issues_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      marks: {
        Row: {
          created_at: string | null
          entered_by: string | null
          exam_id: string
          grade: string | null
          id: string
          institution_id: string
          is_absent: boolean | null
          is_published: boolean | null
          marks_obtained: number | null
          remarks: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entered_by?: string | null
          exam_id: string
          grade?: string | null
          id?: string
          institution_id: string
          is_absent?: boolean | null
          is_published?: boolean | null
          marks_obtained?: number | null
          remarks?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entered_by?: string | null
          exam_id?: string
          grade?: string | null
          id?: string
          institution_id?: string
          is_absent?: boolean | null
          is_published?: boolean | null
          marks_obtained?: number | null
          remarks?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marks_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          id: string
          institution_id: string | null
          is_read: boolean | null
          read_at: string | null
          reference_id: string | null
          sent_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body: string
          id?: string
          institution_id?: string | null
          is_read?: boolean | null
          read_at?: string | null
          reference_id?: string | null
          sent_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string
          id?: string
          institution_id?: string | null
          is_read?: boolean | null
          read_at?: string | null
          reference_id?: string | null
          sent_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string
          is_primary: boolean | null
          parent_user_id: string
          relation: string | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id: string
          is_primary?: boolean | null
          parent_user_id: string
          relation?: string | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string
          is_primary?: boolean | null
          parent_user_id?: string
          relation?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_parent_user_id_fkey"
            columns: ["parent_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          basic_salary: number | null
          created_at: string | null
          da: number | null
          gross_salary: number | null
          hra: number | null
          id: string
          institution_id: string
          month: number
          net_salary: number | null
          other_allowance: number | null
          other_deduction: number | null
          payment_date: string | null
          payment_mode: string | null
          pf_deduction: number | null
          staff_id: string
          status: string | null
          tax_deduction: number | null
          transaction_id: string | null
          year: number
        }
        Insert: {
          basic_salary?: number | null
          created_at?: string | null
          da?: number | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          institution_id: string
          month: number
          net_salary?: number | null
          other_allowance?: number | null
          other_deduction?: number | null
          payment_date?: string | null
          payment_mode?: string | null
          pf_deduction?: number | null
          staff_id: string
          status?: string | null
          tax_deduction?: number | null
          transaction_id?: string | null
          year: number
        }
        Update: {
          basic_salary?: number | null
          created_at?: string | null
          da?: number | null
          gross_salary?: number | null
          hra?: number | null
          id?: string
          institution_id?: string
          month?: number
          net_salary?: number | null
          other_allowance?: number | null
          other_deduction?: number | null
          payment_date?: string | null
          payment_mode?: string | null
          pf_deduction?: number | null
          staff_id?: string
          status?: string | null
          tax_deduction?: number | null
          transaction_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_applications: {
        Row: {
          created_at: string | null
          drive_id: string
          id: string
          institution_id: string
          offer_letter_url: string | null
          package_lpa: number | null
          status: string | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          drive_id: string
          id?: string
          institution_id: string
          offer_letter_url?: string | null
          package_lpa?: number | null
          status?: string | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          drive_id?: string
          id?: string
          institution_id?: string
          offer_letter_url?: string | null
          package_lpa?: number | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_applications_drive_id_fkey"
            columns: ["drive_id"]
            isOneToOne: false
            referencedRelation: "placement_drives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_applications_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_companies: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          industry: string | null
          institution_id: string
          website: string | null
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          institution_id: string
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          institution_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_companies_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_drives: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          drive_date: string | null
          eligibility: string | null
          id: string
          institution_id: string
          last_apply_date: string | null
          package_lpa: number | null
          role: string
          status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          drive_date?: string | null
          eligibility?: string | null
          id?: string
          institution_id: string
          last_apply_date?: string | null
          package_lpa?: number | null
          role: string
          status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          drive_date?: string | null
          eligibility?: string | null
          id?: string
          institution_id?: string
          last_apply_date?: string | null
          package_lpa?: number | null
          role?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placement_drives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "placement_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_drives_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string | null
          device_os: string | null
          email: string | null
          expo_push_token: string | null
          first_name: string | null
          id: string
          institution_id: string | null
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          rejection_reason: string | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string | null
          device_os?: string | null
          email?: string | null
          expo_push_token?: string | null
          first_name?: string | null
          id: string
          institution_id?: string | null
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string | null
          device_os?: string | null
          email?: string | null
          expo_push_token?: string | null
          first_name?: string | null
          id?: string
          institution_id?: string | null
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          code: string | null
          created_at: string | null
          department_id: string | null
          duration_years: number | null
          id: string
          institution_id: string
          is_active: boolean | null
          name: string
          type: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          department_id?: string | null
          duration_years?: number | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          name: string
          type?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          department_id?: string | null
          duration_years?: number | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          aadhaar_no: string | null
          address: string | null
          bank_account_no: string | null
          bank_name: string | null
          blood_group: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          department_id: string | null
          designation: string | null
          email: string | null
          employee_id: string
          employment_type: string | null
          experience_years: number | null
          full_name: string
          gender: string | null
          id: string
          ifsc_code: string | null
          institution_id: string
          joining_date: string | null
          pan_no: string | null
          pf_no: string | null
          phone: string | null
          pincode: string | null
          profile_photo_url: string | null
          qualification: string | null
          religion: string | null
          salary: number | null
          staff_type: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aadhaar_no?: string | null
          address?: string | null
          bank_account_no?: string | null
          bank_name?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          designation?: string | null
          email?: string | null
          employee_id: string
          employment_type?: string | null
          experience_years?: number | null
          full_name: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          institution_id: string
          joining_date?: string | null
          pan_no?: string | null
          pf_no?: string | null
          phone?: string | null
          pincode?: string | null
          profile_photo_url?: string | null
          qualification?: string | null
          religion?: string | null
          salary?: number | null
          staff_type?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aadhaar_no?: string | null
          address?: string | null
          bank_account_no?: string | null
          bank_name?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          designation?: string | null
          email?: string | null
          employee_id?: string
          employment_type?: string | null
          experience_years?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          institution_id?: string
          joining_date?: string | null
          pan_no?: string | null
          pf_no?: string | null
          phone?: string | null
          pincode?: string | null
          profile_photo_url?: string | null
          qualification?: string | null
          religion?: string | null
          salary?: number | null
          staff_type?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          id: string
          institution_id: string
          remarks: string | null
          staff_id: string
          status: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          id?: string
          institution_id: string
          remarks?: string | null
          staff_id: string
          status: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          institution_id?: string
          remarks?: string | null
          staff_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attendance: {
        Row: {
          batch_id: string
          created_at: string | null
          date: string
          faculty_id: string | null
          id: string
          institution_id: string
          marked_by: string | null
          period_no: number | null
          remarks: string | null
          status: string
          student_id: string
          subject_id: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          date: string
          faculty_id?: string | null
          id?: string
          institution_id: string
          marked_by?: string | null
          period_no?: number | null
          remarks?: string | null
          status: string
          student_id: string
          subject_id?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          date?: string
          faculty_id?: string | null
          id?: string
          institution_id?: string
          marked_by?: string | null
          period_no?: number | null
          remarks?: string | null
          status?: string
          student_id?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fees: {
        Row: {
          academic_year_id: string | null
          balance_amount: number | null
          created_at: string | null
          discount_amount: number | null
          due_date: string | null
          fee_structure_id: string | null
          fine_amount: number | null
          id: string
          institution_id: string
          net_amount: number
          paid_amount: number | null
          status: string | null
          student_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          academic_year_id?: string | null
          balance_amount?: number | null
          created_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          fee_structure_id?: string | null
          fine_amount?: number | null
          id?: string
          institution_id: string
          net_amount: number
          paid_amount?: number | null
          status?: string | null
          student_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string | null
          balance_amount?: number | null
          created_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          fee_structure_id?: string | null
          fine_amount?: number | null
          id?: string
          institution_id?: string
          net_amount?: number
          paid_amount?: number | null
          status?: string | null
          student_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_transport: {
        Row: {
          academic_year_id: string | null
          created_at: string | null
          id: string
          institution_id: string
          route_id: string
          status: string | null
          stop_id: string | null
          student_id: string
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string | null
          id?: string
          institution_id: string
          route_id: string
          status?: string | null
          stop_id?: string | null
          student_id: string
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string
          route_id?: string
          status?: string | null
          stop_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_transport_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "transport_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          aadhaar_no: string | null
          address: string | null
          admission_date: string | null
          admission_no: string
          batch_id: string | null
          blood_group: string | null
          bus_route_id: string | null
          caste: string | null
          category: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          guardian1_aadhaar: string | null
          guardian1_email: string | null
          guardian1_name: string | null
          guardian1_occupation: string | null
          guardian1_phone: string | null
          guardian1_relation: string | null
          guardian2_name: string | null
          guardian2_phone: string | null
          guardian2_relation: string | null
          id: string
          institution_id: string
          is_day_scholar: boolean | null
          mother_tongue: string | null
          nationality: string | null
          phone: string | null
          pincode: string | null
          prev_board: string | null
          prev_percentage: number | null
          prev_school: string | null
          profile_photo_url: string | null
          religion: string | null
          roll_no: string | null
          state: string | null
          status: string | null
          tc_no: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aadhaar_no?: string | null
          address?: string | null
          admission_date?: string | null
          admission_no: string
          batch_id?: string | null
          blood_group?: string | null
          bus_route_id?: string | null
          caste?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          guardian1_aadhaar?: string | null
          guardian1_email?: string | null
          guardian1_name?: string | null
          guardian1_occupation?: string | null
          guardian1_phone?: string | null
          guardian1_relation?: string | null
          guardian2_name?: string | null
          guardian2_phone?: string | null
          guardian2_relation?: string | null
          id?: string
          institution_id: string
          is_day_scholar?: boolean | null
          mother_tongue?: string | null
          nationality?: string | null
          phone?: string | null
          pincode?: string | null
          prev_board?: string | null
          prev_percentage?: number | null
          prev_school?: string | null
          profile_photo_url?: string | null
          religion?: string | null
          roll_no?: string | null
          state?: string | null
          status?: string | null
          tc_no?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aadhaar_no?: string | null
          address?: string | null
          admission_date?: string | null
          admission_no?: string
          batch_id?: string | null
          blood_group?: string | null
          bus_route_id?: string | null
          caste?: string | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          guardian1_aadhaar?: string | null
          guardian1_email?: string | null
          guardian1_name?: string | null
          guardian1_occupation?: string | null
          guardian1_phone?: string | null
          guardian1_relation?: string | null
          guardian2_name?: string | null
          guardian2_phone?: string | null
          guardian2_relation?: string | null
          id?: string
          institution_id?: string
          is_day_scholar?: boolean | null
          mother_tongue?: string | null
          nationality?: string | null
          phone?: string | null
          pincode?: string | null
          prev_board?: string | null
          prev_percentage?: number | null
          prev_school?: string | null
          profile_photo_url?: string | null
          religion?: string | null
          roll_no?: string | null
          state?: string | null
          status?: string | null
          tc_no?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          batch_id: string | null
          created_at: string | null
          description: string | null
          faculty_id: string | null
          file_type: string | null
          file_url: string | null
          id: string
          institution_id: string
          is_published: boolean | null
          subject_id: string | null
          title: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          description?: string | null
          faculty_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          institution_id: string
          is_published?: boolean | null
          subject_id?: string | null
          title: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          description?: string | null
          faculty_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          institution_id?: string
          is_published?: boolean | null
          subject_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string | null
          credits: number | null
          department_id: string | null
          id: string
          institution_id: string
          is_active: boolean | null
          max_marks: number | null
          name: string
          pass_marks: number | null
          program_id: string | null
          type: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          credits?: number | null
          department_id?: string | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          max_marks?: number | null
          name: string
          pass_marks?: number | null
          program_id?: string | null
          type?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          credits?: number | null
          department_id?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          max_marks?: number | null
          name?: string
          pass_marks?: number | null
          program_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable: {
        Row: {
          academic_year_id: string | null
          batch_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          faculty_id: string | null
          id: string
          institution_id: string
          is_active: boolean | null
          period_no: number
          room_no: string | null
          start_time: string
          subject_id: string
        }
        Insert: {
          academic_year_id?: string | null
          batch_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          faculty_id?: string | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          period_no: number
          room_no?: string | null
          start_time: string
          subject_id: string
        }
        Update: {
          academic_year_id?: string | null
          batch_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          faculty_id?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          period_no?: number
          room_no?: string | null
          start_time?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          capacity: number | null
          created_at: string | null
          driver_name: string | null
          driver_phone: string | null
          id: string
          institution_id: string
          is_active: boolean | null
          monthly_fee: number | null
          route_name: string
          route_no: string | null
          vehicle_no: string | null
          vehicle_type: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          institution_id: string
          is_active?: boolean | null
          monthly_fee?: number | null
          route_name: string
          route_no?: string | null
          vehicle_no?: string | null
          vehicle_type?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean | null
          monthly_fee?: number | null
          route_name?: string
          route_no?: string | null
          vehicle_no?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_routes_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_stops: {
        Row: {
          created_at: string | null
          drop_time: string | null
          id: string
          institution_id: string
          monthly_fee: number | null
          pickup_time: string | null
          route_id: string
          stop_name: string
          stop_order: number | null
        }
        Insert: {
          created_at?: string | null
          drop_time?: string | null
          id?: string
          institution_id: string
          monthly_fee?: number | null
          pickup_time?: string | null
          route_id: string
          stop_name: string
          stop_order?: number | null
        }
        Update: {
          created_at?: string | null
          drop_time?: string | null
          id?: string
          institution_id?: string
          monthly_fee?: number | null
          pickup_time?: string | null
          route_id?: string
          stop_name?: string
          stop_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_stops_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          id: string
          institution_id: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          institution_id?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          institution_id?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          aadhaar_no: string | null
          address: string | null
          app_version: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          device_os: string | null
          email: string | null
          expo_push_token: string | null
          full_name: string
          gender: string | null
          id: string
          institution_id: string | null
          is_active: boolean | null
          last_login_at: string | null
          notification_preferences: Json | null
          phone: string | null
          pincode: string | null
          profile_photo_url: string | null
          role: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_no?: string | null
          address?: string | null
          app_version?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          device_os?: string | null
          email?: string | null
          expo_push_token?: string | null
          full_name: string
          gender?: string | null
          id: string
          institution_id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          pincode?: string | null
          profile_photo_url?: string | null
          role: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_no?: string | null
          address?: string | null
          app_version?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          device_os?: string | null
          email?: string | null
          expo_push_token?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          institution_id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          pincode?: string | null
          profile_photo_url?: string | null
          role?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_institution_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      is_super_admin: { Args: never; Returns: boolean }
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
    Enums: {},
  },
} as const
