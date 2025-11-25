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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agendamento_tokens: {
        Row: {
          agendamento_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          updated_at: string
          used: boolean
        }
        Insert: {
          agendamento_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          updated_at?: string
          used?: boolean
        }
        Update: {
          agendamento_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string
          used?: boolean
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          coupon_id: string | null
          created_at: string
          data_consulta: string
          email_paciente: string
          horario: string
          id: string
          meeting_link: string | null
          mercado_pago_preference_id: string | null
          nome_paciente: string
          observacoes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          professional_id: number
          status: string
          stripe_session_id: string | null
          telefone_paciente: string
          tenant_id: string | null
          updated_at: string
          user_id: string
          valor: number | null
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          data_consulta: string
          email_paciente: string
          horario: string
          id?: string
          meeting_link?: string | null
          mercado_pago_preference_id?: string | null
          nome_paciente: string
          observacoes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          professional_id: number
          status?: string
          stripe_session_id?: string | null
          telefone_paciente: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          data_consulta?: string
          email_paciente?: string
          horario?: string
          id?: string
          meeting_link?: string | null
          mercado_pago_preference_id?: string | null
          nome_paciente?: string
          observacoes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          professional_id?: number
          status?: string
          stripe_session_id?: string | null
          telefone_paciente?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "institution_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agendamentos_professional_id"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          content: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
          timestamp: string
        }
        Insert: {
          content: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          timestamp?: string
        }
        Update: {
          content?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_data_sources: {
        Row: {
          created_at: string
          created_by: string | null
          data_fields: Json | null
          description: string | null
          display_name: string
          enabled: boolean
          id: string
          privacy_level: string
          source_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fields?: Json | null
          description?: string | null
          display_name: string
          enabled?: boolean
          id?: string
          privacy_level?: string
          source_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fields?: Json | null
          description?: string | null
          display_name?: string
          enabled?: boolean
          id?: string
          privacy_level?: string
          source_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_insights_history: {
        Row: {
          created_at: string
          feedback_comment: string | null
          feedback_rating: boolean | null
          feedback_submitted_at: string | null
          id: string
          insight_content: string
          mood_data: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: boolean | null
          feedback_submitted_at?: string | null
          id?: string
          insight_content: string
          mood_data: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: boolean | null
          feedback_submitted_at?: string | null
          id?: string
          insight_content?: string
          mood_data?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_insights_usage: {
        Row: {
          created_at: string
          id: string
          insights_count: number
          month_year: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          insights_count?: number
          month_year: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          insights_count?: number
          month_year?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blog_analytics_daily: {
        Row: {
          avg_time_spent: number | null
          completion_rate: number | null
          created_at: string
          date: string
          id: string
          post_id: string
          unique_visitors: number | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          avg_time_spent?: number | null
          completion_rate?: number | null
          created_at?: string
          date: string
          id?: string
          post_id: string
          unique_visitors?: number | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          avg_time_spent?: number | null
          completion_rate?: number | null
          created_at?: string
          date?: string
          id?: string
          post_id?: string
          unique_visitors?: number | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_analytics_daily_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_ratings: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          rating: number
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          rating: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          rating?: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_ratings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_revisions: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          excerpt: string | null
          id: string
          post_id: string
          revision_note: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          post_id: string
          revision_note?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          post_id?: string
          revision_note?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_views_tracking: {
        Row: {
          completed_reading: boolean | null
          created_at: string
          device_type: string | null
          id: string
          post_id: string
          referrer: string | null
          session_id: string
          tenant_id: string | null
          time_spent: number | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          completed_reading?: boolean | null
          created_at?: string
          device_type?: string | null
          id?: string
          post_id: string
          referrer?: string | null
          session_id: string
          tenant_id?: string | null
          time_spent?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          completed_reading?: boolean | null
          created_at?: string
          device_type?: string | null
          id?: string
          post_id?: string
          referrer?: string | null
          session_id?: string
          tenant_id?: string | null
          time_spent?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_views_tracking_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_views_tracking_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          allow_comments: boolean | null
          allow_ratings: boolean | null
          author_id: string
          average_rating: number | null
          badge_expires_at: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          editorial_badge: Database["public"]["Enums"]["editorial_badge"] | null
          excerpt: string | null
          featured_image_url: string | null
          featured_order: number | null
          id: string
          is_featured: boolean | null
          published_at: string | null
          ratings_count: number | null
          read_time_minutes: number | null
          scheduled_for: string | null
          slug: string
          status: string
          tenant_id: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          allow_comments?: boolean | null
          allow_ratings?: boolean | null
          author_id: string
          average_rating?: number | null
          badge_expires_at?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          editorial_badge?:
            | Database["public"]["Enums"]["editorial_badge"]
            | null
          excerpt?: string | null
          featured_image_url?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          ratings_count?: number | null
          read_time_minutes?: number | null
          scheduled_for?: string | null
          slug: string
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          allow_comments?: boolean | null
          allow_ratings?: boolean | null
          author_id?: string
          average_rating?: number | null
          badge_expires_at?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          editorial_badge?:
            | Database["public"]["Enums"]["editorial_badge"]
            | null
          excerpt?: string | null
          featured_image_url?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          ratings_count?: number | null
          read_time_minutes?: number | null
          scheduled_for?: string | null
          slug?: string
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_email: string
          author_name: string
          content: string
          created_at: string
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string
          reported_count: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_email: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id: string
          reported_count?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_email?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
          reported_count?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          appointment_id: string | null
          coupon_id: string
          discount_amount: number
          final_amount: number
          id: string
          metadata: Json | null
          original_amount: number
          used_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          coupon_id: string
          discount_amount: number
          final_amount: number
          id?: string
          metadata?: Json | null
          original_amount: number
          used_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          coupon_id?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          metadata?: Json | null
          original_amount?: number
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "institution_coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      default_emotion_types: {
        Row: {
          category: string | null
          created_at: string | null
          default_color_scheme: Json | null
          default_emoji_set: Json | null
          default_scale_max: number | null
          default_scale_min: number | null
          description: string | null
          display_name: string
          emotion_type: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_color_scheme?: Json | null
          default_emoji_set?: Json | null
          default_scale_max?: number | null
          default_scale_min?: number | null
          description?: string | null
          display_name: string
          emotion_type: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_color_scheme?: Json | null
          default_emoji_set?: Json | null
          default_scale_max?: number | null
          default_scale_min?: number | null
          description?: string | null
          display_name?: string
          emotion_type?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      deleted_users: {
        Row: {
          deleted_at: string
          deleted_by: string | null
          deletion_reason: string | null
          email: string
          id: string
          nome: string
          original_user_id: string
          tipo_usuario: string
          user_data: Json | null
        }
        Insert: {
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string | null
          email: string
          id?: string
          nome: string
          original_user_id: string
          tipo_usuario: string
          user_data?: Json | null
        }
        Update: {
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string
          id?: string
          nome?: string
          original_user_id?: string
          tipo_usuario?: string
          user_data?: Json | null
        }
        Relationships: []
      }
      educational_institutions: {
        Row: {
          can_manage_coupons: boolean
          can_manage_professionals: boolean
          can_manage_users: boolean
          created_at: string
          has_partnership: boolean
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          can_manage_coupons?: boolean
          can_manage_professionals?: boolean
          can_manage_users?: boolean
          created_at?: string
          has_partnership?: boolean
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          can_manage_coupons?: boolean
          can_manage_professionals?: boolean
          can_manage_users?: boolean
          created_at?: string
          has_partnership?: boolean
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_confirmation_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          updated_at: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          updated_at?: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      email_test_logs: {
        Row: {
          created_at: string
          custom_html: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          resend_email_id: string | null
          status: string
          tenant_id: string
          tested_by: string
          variables: Json
        }
        Insert: {
          created_at?: string
          custom_html?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          resend_email_id?: string | null
          status: string
          tenant_id: string
          tested_by: string
          variables?: Json
        }
        Update: {
          created_at?: string
          custom_html?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          resend_email_id?: string | null
          status?: string
          tenant_id?: string
          tested_by?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_test_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_configurations: {
        Row: {
          color_scheme: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          emoji_set: Json | null
          emotion_type: string
          id: string
          is_enabled: boolean | null
          order_position: number | null
          scale_max: number | null
          scale_min: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color_scheme?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          emoji_set?: Json | null
          emotion_type: string
          id?: string
          is_enabled?: boolean | null
          order_position?: number | null
          scale_max?: number | null
          scale_min?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color_scheme?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          emoji_set?: Json | null
          emotion_type?: string
          id?: string
          is_enabled?: boolean | null
          order_position?: number | null
          scale_max?: number | null
          scale_min?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      google_calendar_events: {
        Row: {
          created_at: string
          end_time: string
          event_id: string
          id: string
          is_busy: boolean
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          event_id: string
          id?: string
          is_busy?: boolean
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          event_id?: string
          id?: string
          is_busy?: boolean
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_session_registrations: {
        Row: {
          attended_at: string | null
          cancelled_at: string | null
          id: string
          payment_status: string | null
          registered_at: string | null
          session_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          attended_at?: string | null
          cancelled_at?: string | null
          id?: string
          payment_status?: string | null
          registered_at?: string | null
          session_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          attended_at?: string | null
          cancelled_at?: string | null
          id?: string
          payment_status?: string | null
          registered_at?: string | null
          session_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      group_sessions: {
        Row: {
          allowed_institution_ids: string[] | null
          audience_type: string | null
          created_at: string | null
          created_by: string | null
          current_registrations: number | null
          description: string
          duration_minutes: number | null
          featured_image_url: string | null
          google_event_id: string | null
          has_libras: boolean | null
          id: string
          institution_id: string | null
          is_free: boolean | null
          max_participants: number | null
          meeting_link: string | null
          organizer_type: string
          price: number | null
          professional_id: number | null
          session_date: string
          session_type: string
          start_time: string
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          allowed_institution_ids?: string[] | null
          audience_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_registrations?: number | null
          description: string
          duration_minutes?: number | null
          featured_image_url?: string | null
          google_event_id?: string | null
          has_libras?: boolean | null
          id?: string
          institution_id?: string | null
          is_free?: boolean | null
          max_participants?: number | null
          meeting_link?: string | null
          organizer_type: string
          price?: number | null
          professional_id?: number | null
          session_date: string
          session_type: string
          start_time: string
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          allowed_institution_ids?: string[] | null
          audience_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_registrations?: number | null
          description?: string
          duration_minutes?: number | null
          featured_image_url?: string | null
          google_event_id?: string | null
          has_libras?: boolean | null
          id?: string
          institution_id?: string | null
          is_free?: boolean | null
          max_participants?: number | null
          meeting_link?: string | null
          organizer_type?: string
          price?: number | null
          professional_id?: number | null
          session_date?: string
          session_type?: string
          start_time?: string
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_sessions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "educational_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_sessions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_sessions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_audit_log: {
        Row: {
          action_type: string
          changes_summary: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          institution_id: string | null
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          action_type: string
          changes_summary?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          institution_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          action_type?: string
          changes_summary?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          institution_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_audit_log_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "educational_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_audit_log_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_usage_count: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          institution_id: string
          is_active: boolean
          max_discount_amount: number | null
          maximum_uses: number | null
          metadata: Json | null
          minimum_purchase_amount: number | null
          name: string
          professional_scope: string | null
          professional_scope_ids: number[] | null
          target_audience: string | null
          target_audience_user_ids: string[] | null
          tenant_id: string | null
          updated_at: string
          uses_per_user: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_usage_count?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          institution_id: string
          is_active?: boolean
          max_discount_amount?: number | null
          maximum_uses?: number | null
          metadata?: Json | null
          minimum_purchase_amount?: number | null
          name: string
          professional_scope?: string | null
          professional_scope_ids?: number[] | null
          target_audience?: string | null
          target_audience_user_ids?: string[] | null
          tenant_id?: string | null
          updated_at?: string
          uses_per_user?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_usage_count?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          institution_id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          maximum_uses?: number | null
          metadata?: Json | null
          minimum_purchase_amount?: number | null
          name?: string
          professional_scope?: string | null
          professional_scope_ids?: number[] | null
          target_audience?: string | null
          target_audience_user_ids?: string[] | null
          tenant_id?: string | null
          updated_at?: string
          uses_per_user?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_coupons_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "educational_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_coupons_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_link_requests: {
        Row: {
          created_at: string | null
          enrollment_type: string | null
          id: string
          institution_id: string
          metadata: Json | null
          patient_id: string | null
          professional_id: number | null
          profile_id: string | null
          relationship_type: string | null
          request_message: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          enrollment_type?: string | null
          id?: string
          institution_id: string
          metadata?: Json | null
          patient_id?: string | null
          professional_id?: number | null
          profile_id?: string | null
          relationship_type?: string | null
          request_message?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          enrollment_type?: string | null
          id?: string
          institution_id?: string
          metadata?: Json | null
          patient_id?: string | null
          professional_id?: number | null
          profile_id?: string | null
          relationship_type?: string | null
          request_message?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_link_requests_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "educational_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_link_requests_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_link_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_link_requests_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_link_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_link_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_user_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          institution_user_id: string | null
          permission: Database["public"]["Enums"]["institution_permission"]
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          institution_user_id?: string | null
          permission: Database["public"]["Enums"]["institution_permission"]
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          institution_user_id?: string | null
          permission?: Database["public"]["Enums"]["institution_permission"]
        }
        Relationships: [
          {
            foreignKeyName: "institution_user_permissions_institution_user_id_fkey"
            columns: ["institution_user_id"]
            isOneToOne: false
            referencedRelation: "institution_users"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_users: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          institution_id: string
          is_active: boolean
          role: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id: string
          is_active?: boolean
          role?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean
          role?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_users_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "educational_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_users_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          caption: string | null
          filename: string
          height: number | null
          id: string
          mime_type: string
          size_bytes: number | null
          uploaded_at: string
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          filename: string
          height?: number | null
          id?: string
          mime_type: string
          size_bytes?: number | null
          uploaded_at?: string
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string
          size_bytes?: number | null
          uploaded_at?: string
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          anxiety_level: number | null
          audio_url: string | null
          created_at: string | null
          date: string
          emotion_values: Json | null
          energy_level: number | null
          id: string
          journal_text: string | null
          mood_score: number | null
          profile_id: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          tags: string[] | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anxiety_level?: number | null
          audio_url?: string | null
          created_at?: string | null
          date: string
          emotion_values?: Json | null
          energy_level?: number | null
          id?: string
          journal_text?: string | null
          mood_score?: number | null
          profile_id?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anxiety_level?: number | null
          audio_url?: string | null
          created_at?: string | null
          date?: string
          emotion_values?: Json | null
          energy_level?: number | null
          id?: string
          journal_text?: string | null
          mood_score?: number | null
          profile_id?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_factors: {
        Row: {
          created_at: string | null
          factor_type: string
          factor_value: Json | null
          id: string
          mood_entry_id: string | null
        }
        Insert: {
          created_at?: string | null
          factor_type: string
          factor_value?: Json | null
          id?: string
          mood_entry_id?: string | null
        }
        Update: {
          created_at?: string | null
          factor_type?: string
          factor_value?: Json | null
          id?: string
          mood_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_factors_mood_entry_id_fkey"
            columns: ["mood_entry_id"]
            isOneToOne: false
            referencedRelation: "mood_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pacientes: {
        Row: {
          created_at: string | null
          eh_estudante: boolean
          id: string
          instituicao_ensino: string | null
          profile_id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          eh_estudante?: boolean
          id?: string
          instituicao_ensino?: string | null
          profile_id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          eh_estudante?: boolean
          id?: string
          instituicao_ensino?: string | null
          profile_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          updated_at: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          updated_at?: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      patient_institutions: {
        Row: {
          created_at: string
          enrollment_date: string | null
          enrollment_status: string
          id: string
          institution_id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          enrollment_date?: string | null
          enrollment_status?: string
          id?: string
          institution_id: string
          patient_id: string
        }
        Update: {
          created_at?: string
          enrollment_date?: string | null
          enrollment_status?: string
          id?: string
          institution_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_institutions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "educational_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_institutions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_institutions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_institutions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          institution_id: string
          is_active: boolean
          notes: string | null
          professional_id: number
          relationship_type: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          institution_id: string
          is_active?: boolean
          notes?: string | null
          professional_id: number
          relationship_type?: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean
          notes?: string | null
          professional_id?: number
          relationship_type?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_institutions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "educational_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_institutions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institution_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_institutions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_registration_attempts: {
        Row: {
          created_at: string | null
          email: string
          error_message: string | null
          form_data: Json
          id: string
          ip_address: string | null
          nome: string | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          status: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          error_message?: string | null
          form_data: Json
          id?: string
          ip_address?: string | null
          nome?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          status?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          error_message?: string | null
          form_data?: Json
          id?: string
          ip_address?: string | null
          nome?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          status?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_registration_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_tenants: {
        Row: {
          created_at: string | null
          featured_order: number | null
          id: string
          is_featured: boolean | null
          professional_id: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          professional_id: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          professional_id?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_tenants_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_unavailability: {
        Row: {
          all_day: boolean
          created_at: string
          date: string
          end_time: string | null
          id: string
          professional_id: number
          reason: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          professional_id: number
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          professional_id?: number
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          como_conheceu: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string
          foto_perfil_url: string | null
          genero: string | null
          google_calendar_refresh_token: string | null
          google_calendar_scope: string | null
          google_calendar_token: string | null
          id: string
          nome: string
          raca: string | null
          sexualidade: string | null
          tenant_id: string | null
          tipo_usuario: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          como_conheceu?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email: string
          foto_perfil_url?: string | null
          genero?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_scope?: string | null
          google_calendar_token?: string | null
          id?: string
          nome: string
          raca?: string | null
          sexualidade?: string | null
          tenant_id?: string | null
          tipo_usuario: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          como_conheceu?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string
          foto_perfil_url?: string | null
          genero?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_scope?: string | null
          google_calendar_token?: string | null
          id?: string
          nome?: string
          raca?: string | null
          sexualidade?: string | null
          tenant_id?: string | null
          tipo_usuario?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string | null
          conta: string | null
          cpf: string | null
          crp_crm: string | null
          display_name: string
          em_destaque: boolean | null
          email_secundario: string | null
          first_name: string | null
          formacao_normalizada: string[] | null
          formacao_raw: string | null
          foto_id: number | null
          foto_perfil_url: string | null
          id: number
          idiomas_raw: string | null
          last_name: string | null
          linkedin: string | null
          ordem_destaque: number | null
          pix: string | null
          possui_e_psi: boolean | null
          preco_consulta: number | null
          profile_id: string | null
          profissao: string | null
          resumo: string | null
          resumo_profissional: string | null
          servicos_normalizados: string[] | null
          servicos_raw: string | null
          telefone: string | null
          tempo_consulta: number | null
          tipo_conta: string | null
          user_email: string
          user_id: number
          user_login: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          conta?: string | null
          cpf?: string | null
          crp_crm?: string | null
          display_name: string
          em_destaque?: boolean | null
          email_secundario?: string | null
          first_name?: string | null
          formacao_normalizada?: string[] | null
          formacao_raw?: string | null
          foto_id?: number | null
          foto_perfil_url?: string | null
          id?: number
          idiomas_raw?: string | null
          last_name?: string | null
          linkedin?: string | null
          ordem_destaque?: number | null
          pix?: string | null
          possui_e_psi?: boolean | null
          preco_consulta?: number | null
          profile_id?: string | null
          profissao?: string | null
          resumo?: string | null
          resumo_profissional?: string | null
          servicos_normalizados?: string[] | null
          servicos_raw?: string | null
          telefone?: string | null
          tempo_consulta?: number | null
          tipo_conta?: string | null
          user_email: string
          user_id: number
          user_login: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          conta?: string | null
          cpf?: string | null
          crp_crm?: string | null
          display_name?: string
          em_destaque?: boolean | null
          email_secundario?: string | null
          first_name?: string | null
          formacao_normalizada?: string[] | null
          formacao_raw?: string | null
          foto_id?: number | null
          foto_perfil_url?: string | null
          id?: number
          idiomas_raw?: string | null
          last_name?: string | null
          linkedin?: string | null
          ordem_destaque?: number | null
          pix?: string | null
          possui_e_psi?: boolean | null
          preco_consulta?: number | null
          profile_id?: string | null
          profissao?: string | null
          resumo?: string | null
          resumo_profissional?: string | null
          servicos_normalizados?: string[] | null
          servicos_raw?: string | null
          telefone?: string | null
          tempo_consulta?: number | null
          tipo_conta?: string | null
          user_email?: string
          user_id?: number
          user_login?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais_sessoes: {
        Row: {
          clinic_id: number | null
          day: string | null
          end_time: string
          id: number
          minutos_janela: number | null
          session_id: number | null
          start_time: string
          time_slot: number | null
          user_id: number
        }
        Insert: {
          clinic_id?: number | null
          day?: string | null
          end_time: string
          id?: number
          minutos_janela?: number | null
          session_id?: number | null
          start_time: string
          time_slot?: number | null
          user_id: number
        }
        Update: {
          clinic_id?: number | null
          day?: string | null
          end_time?: string
          id?: number
          minutos_janela?: number | null
          session_id?: number | null
          start_time?: string
          time_slot?: number | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_sessoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["user_id"]
          },
        ]
      }
      saved_filters: {
        Row: {
          created_at: string | null
          filter_config: Json
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filter_config: Json
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filter_config?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_configurations: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          about_autoplay: boolean | null
          about_autoplay_delay: number | null
          about_images: string[] | null
          accent_color: string
          admin_email: string | null
          ai_match_button_text: string | null
          base_path: string
          booking_max_days_ahead: number | null
          booking_min_hours_notice: number | null
          button_bg_color_dark: string | null
          button_bg_color_light: string | null
          button_text_color_dark: string | null
          button_text_color_light: string | null
          cnpj: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string | null
          cross_tenant_navigation_warning_enabled: boolean | null
          cross_tenant_navigation_warning_message: string | null
          cross_tenant_navigation_warning_title: string | null
          cta_primary_text: string | null
          cta_secondary_text: string | null
          domain_redirect_enabled: boolean | null
          domain_redirect_from: string[] | null
          domain_redirect_to: string | null
          email_sender_email: string | null
          email_sender_name: string | null
          email_support_email: string | null
          empty_state_message: string | null
          fallback_professional_image: string | null
          favicon_url: string | null
          font_family_body: string | null
          font_family_headings: string | null
          footer_bg_color_dark: string | null
          footer_bg_color_light: string | null
          footer_text_color_dark: string | null
          footer_text_color_light: string | null
          google_analytics_id: string | null
          google_calendar_email: string | null
          google_calendar_refresh_token: string | null
          google_calendar_scope: string | null
          google_calendar_token: string | null
          google_meet_mode: string | null
          google_tag_manager_id: string | null
          header_color: string | null
          header_text_color_dark: string | null
          header_text_color_light: string | null
          hero_autoplay: boolean | null
          hero_autoplay_delay: number | null
          hero_cta_text: string | null
          hero_images: string[] | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_active: boolean | null
          logo_size: number | null
          logo_url: string | null
          meta_config: Json | null
          meta_keywords: string[] | null
          modules_enabled: Json | null
          name: string
          payment_methods: Json | null
          primary_color: string
          privacy_url: string | null
          razao_social: string | null
          secondary_color: string | null
          slug: string
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_share_image: string | null
          specialty_tag_bg_dark: string | null
          specialty_tag_bg_light: string | null
          specialty_tag_text_dark: string | null
          specialty_tag_text_light: string | null
          terms_url: string | null
          theme_config: Json | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          about_autoplay?: boolean | null
          about_autoplay_delay?: number | null
          about_images?: string[] | null
          accent_color: string
          admin_email?: string | null
          ai_match_button_text?: string | null
          base_path: string
          booking_max_days_ahead?: number | null
          booking_min_hours_notice?: number | null
          button_bg_color_dark?: string | null
          button_bg_color_light?: string | null
          button_text_color_dark?: string | null
          button_text_color_light?: string | null
          cnpj?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          cross_tenant_navigation_warning_enabled?: boolean | null
          cross_tenant_navigation_warning_message?: string | null
          cross_tenant_navigation_warning_title?: string | null
          cta_primary_text?: string | null
          cta_secondary_text?: string | null
          domain_redirect_enabled?: boolean | null
          domain_redirect_from?: string[] | null
          domain_redirect_to?: string | null
          email_sender_email?: string | null
          email_sender_name?: string | null
          email_support_email?: string | null
          empty_state_message?: string | null
          fallback_professional_image?: string | null
          favicon_url?: string | null
          font_family_body?: string | null
          font_family_headings?: string | null
          footer_bg_color_dark?: string | null
          footer_bg_color_light?: string | null
          footer_text_color_dark?: string | null
          footer_text_color_light?: string | null
          google_analytics_id?: string | null
          google_calendar_email?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_scope?: string | null
          google_calendar_token?: string | null
          google_meet_mode?: string | null
          google_tag_manager_id?: string | null
          header_color?: string | null
          header_text_color_dark?: string | null
          header_text_color_light?: string | null
          hero_autoplay?: boolean | null
          hero_autoplay_delay?: number | null
          hero_cta_text?: string | null
          hero_images?: string[] | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean | null
          logo_size?: number | null
          logo_url?: string | null
          meta_config?: Json | null
          meta_keywords?: string[] | null
          modules_enabled?: Json | null
          name: string
          payment_methods?: Json | null
          primary_color: string
          privacy_url?: string | null
          razao_social?: string | null
          secondary_color?: string | null
          slug: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_share_image?: string | null
          specialty_tag_bg_dark?: string | null
          specialty_tag_bg_light?: string | null
          specialty_tag_text_dark?: string | null
          specialty_tag_text_light?: string | null
          terms_url?: string | null
          theme_config?: Json | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          about_autoplay?: boolean | null
          about_autoplay_delay?: number | null
          about_images?: string[] | null
          accent_color?: string
          admin_email?: string | null
          ai_match_button_text?: string | null
          base_path?: string
          booking_max_days_ahead?: number | null
          booking_min_hours_notice?: number | null
          button_bg_color_dark?: string | null
          button_bg_color_light?: string | null
          button_text_color_dark?: string | null
          button_text_color_light?: string | null
          cnpj?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          cross_tenant_navigation_warning_enabled?: boolean | null
          cross_tenant_navigation_warning_message?: string | null
          cross_tenant_navigation_warning_title?: string | null
          cta_primary_text?: string | null
          cta_secondary_text?: string | null
          domain_redirect_enabled?: boolean | null
          domain_redirect_from?: string[] | null
          domain_redirect_to?: string | null
          email_sender_email?: string | null
          email_sender_name?: string | null
          email_support_email?: string | null
          empty_state_message?: string | null
          fallback_professional_image?: string | null
          favicon_url?: string | null
          font_family_body?: string | null
          font_family_headings?: string | null
          footer_bg_color_dark?: string | null
          footer_bg_color_light?: string | null
          footer_text_color_dark?: string | null
          footer_text_color_light?: string | null
          google_analytics_id?: string | null
          google_calendar_email?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_scope?: string | null
          google_calendar_token?: string | null
          google_meet_mode?: string | null
          google_tag_manager_id?: string | null
          header_color?: string | null
          header_text_color_dark?: string | null
          header_text_color_light?: string | null
          hero_autoplay?: boolean | null
          hero_autoplay_delay?: number | null
          hero_cta_text?: string | null
          hero_images?: string[] | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean | null
          logo_size?: number | null
          logo_url?: string | null
          meta_config?: Json | null
          meta_keywords?: string[] | null
          modules_enabled?: Json | null
          name?: string
          payment_methods?: Json | null
          primary_color?: string
          privacy_url?: string | null
          razao_social?: string | null
          secondary_color?: string | null
          slug?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_share_image?: string | null
          specialty_tag_bg_dark?: string | null
          specialty_tag_bg_light?: string | null
          specialty_tag_text_dark?: string | null
          specialty_tag_text_light?: string | null
          terms_url?: string | null
          theme_config?: Json | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
      user_booking_tracking: {
        Row: {
          booking_data: Json | null
          event_data: Json | null
          event_name: string
          id: string
          professional_id: string | null
          session_id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          booking_data?: Json | null
          event_data?: Json | null
          event_name: string
          id?: string
          professional_id?: string | null
          session_id: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          booking_data?: Json | null
          event_data?: Json | null
          event_name?: string
          id?: string
          professional_id?: string | null
          session_id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tenants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      institution_metrics: {
        Row: {
          has_partnership: boolean | null
          id: string | null
          institution_created_at: string | null
          is_active: boolean | null
          last_professional_added: string | null
          last_user_added: string | null
          name: string | null
          total_active_coupons: number | null
          total_coupon_uses: number | null
          total_discount_given: number | null
          total_professionals: number | null
          total_users: number | null
          type: string | null
        }
        Relationships: []
      }
      vw_disponibilidades: {
        Row: {
          clinic_id: number | null
          dia: string | null
          end_time: string | null
          minutos_janela: number | null
          profissao: string | null
          profissional: string | null
          profissional_ativo: boolean | null
          profissional_email: string | null
          profissional_telefone: string | null
          sessao_id: number | null
          start_time: string | null
          time_slot: number | null
          user_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_sessoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vw_profissionais_sessoes: {
        Row: {
          clinic_id: number | null
          day: string | null
          end_time: string | null
          fim_fmt: string | null
          id: number | null
          inicio_fmt: string | null
          minutos_janela: number | null
          session_id: number | null
          start_time: string | null
          time_slot: number | null
          user_id: number | null
        }
        Insert: {
          clinic_id?: number | null
          day?: string | null
          end_time?: string | null
          fim_fmt?: never
          id?: number | null
          inicio_fmt?: never
          minutos_janela?: number | null
          session_id?: number | null
          start_time?: string | null
          time_slot?: number | null
          user_id?: number | null
        }
        Update: {
          clinic_id?: number | null
          day?: string | null
          end_time?: string | null
          fim_fmt?: never
          id?: number | null
          inicio_fmt?: never
          minutos_janela?: number | null
          session_id?: number | null
          start_time?: string | null
          time_slot?: number | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_sessoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      check_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      clean_old_chat_sessions: { Args: never; Returns: undefined }
      get_current_tenant_id: { Args: never; Returns: string }
      get_institution_alerts: {
        Args: { p_institution_id: string }
        Returns: {
          count: number
          message: string
          severity: string
        }[]
      }
      get_institution_engagement_metrics: {
        Args: { p_institution_id: string }
        Returns: Json
      }
      get_institution_growth_metrics: {
        Args: { p_institution_id: string }
        Returns: {
          month: string
          professionals_added: number
          students_enrolled: number
        }[]
      }
      get_institution_metrics: {
        Args: { p_institution_id?: string }
        Returns: {
          has_partnership: boolean
          id: string
          institution_created_at: string
          is_active: boolean
          last_professional_added: string
          last_user_added: string
          name: string
          total_active_coupons: number
          total_coupon_uses: number
          total_discount_given: number
          total_professionals: number
          total_users: number
          type: string
        }[]
      }
      get_institution_professional_ids: {
        Args: { _user_id: string }
        Returns: {
          professional_id: number
        }[]
      }
      get_patient_institutions_for_institution_admin: {
        Args: { admin_user_id: string }
        Returns: {
          patient_id: string
        }[]
      }
      get_professionals_with_filtered_availability: {
        Args: {
          p_date_end?: string
          p_date_start?: string
          p_tenant_id?: string
        }
        Returns: {
          ativo: boolean
          available_dates: Json
          como_conheceu: string
          crp_crm: string
          data_nascimento: string
          days_available: number
          display_name: string
          em_destaque: boolean
          email_secundario: string
          first_name: string
          formacao_normalizada: string[]
          genero: string
          idiomas_raw: string
          institutions: Json
          last_available_date: string
          last_name: string
          linkedin: string
          next_available_date: string
          ordem_destaque: number
          possui_e_psi: boolean
          preco_consulta: number
          professional_id: number
          profile_id: string
          profissao: string
          raca: string
          resumo: string
          resumo_profissional: string
          schedule_summary: Json
          servicos_normalizados: string[]
          sexualidade: string
          slots_per_day: Json
          telefone: string
          tenant_info: Json
          total_slots_available: number
          user_email: string
          user_id: number
          user_login: string
        }[]
      }
      get_professionals_with_filtered_availability_minimal: {
        Args: {
          p_date_end?: string
          p_date_start?: string
          p_tenant_id?: string
        }
        Returns: {
          ativo: boolean
          crp_crm: string
          data_nascimento: string
          days_available: number
          display_name: string
          em_destaque: boolean
          genero: string
          last_available_date: string
          next_available_date: string
          ordem_destaque: number
          preco_consulta: number
          professional_id: number
          profile_id: string
          profissao: string
          raca: string
          servicos_normalizados: string[]
          sexualidade: string
          slots_per_day: Json
          tenant_info: Json
          total_slots_available: number
        }[]
      }
      get_professionals_with_filtered_availability_minimal_medcos: {
        Args: { p_date_end?: string; p_date_start?: string }
        Returns: {
          ativo: boolean
          crp_crm: string
          data_nascimento: string
          days_available: number
          display_name: string
          em_destaque: boolean
          formacao_normalizada: string[]
          genero: string
          last_available_date: string
          next_available_date: string
          ordem_destaque: number
          preco_consulta: number
          professional_id: number
          profile_id: string
          profissao: string
          raca: string
          servicos_normalizados: string[]
          sexualidade: string
          slots_per_day: Json
          tenant_info: Json
          total_slots_available: number
        }[]
      }
      get_student_profile_ids_for_institution_admin: {
        Args: { _user_id: string }
        Returns: {
          profile_id: string
        }[]
      }
      get_uncatalogued_institutions: {
        Args: never
        Returns: {
          first_mention: string
          last_mention: string
          name: string
          patient_count: number
        }[]
      }
      get_user_institutions: {
        Args: { _user_id: string }
        Returns: {
          institution_id: string
          role: string
          tenant_id: string
        }[]
      }
      has_institution_permission: {
        Args: {
          _institution_id: string
          _permission: Database["public"]["Enums"]["institution_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_post_views: { Args: { post_slug: string }; Returns: undefined }
      institution_has_permission: {
        Args: {
          _institution_id: string
          _permission_type: string
          _user_id: string
        }
        Returns: boolean
      }
      invoke_blog_analytics_aggregation: { Args: never; Returns: undefined }
      invoke_google_calendar_sync: { Args: never; Returns: undefined }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      normalize_specialties: {
        Args: { raw_specialties: string[] }
        Returns: string[]
      }
      parse_php_serialized_array: {
        Args: { php_data: string }
        Returns: string[]
      }
      publish_scheduled_posts: { Args: never; Returns: undefined }
      refresh_institution_metrics: { Args: never; Returns: undefined }
      user_belongs_to_institution: {
        Args: { _institution_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_institution_access: {
        Args: { _institution_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_professional: {
        Args: { _professional_id: number; _user_id: string }
        Returns: boolean
      }
      validate_coupon: {
        Args: {
          _amount: number
          _code: string
          _professional_id: number
          _tenant_id: string
          _user_id: string
        }
        Returns: {
          coupon_id: string
          discount_amount: number
          discount_type: string
          discount_value: number
          error_message: string
          final_amount: number
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "super_admin"
        | "moderator"
        | "author"
        | "super_author"
        | "institution_admin"
      editorial_badge:
        | "editors_pick"
        | "trending"
        | "must_read"
        | "community_favorite"
        | "staff_pick"
      institution_permission:
        | "view_users"
        | "add_users"
        | "remove_users"
        | "edit_users"
        | "view_professionals"
        | "add_professionals"
        | "remove_professionals"
        | "edit_professionals"
        | "view_coupons"
        | "create_coupons"
        | "edit_coupons"
        | "delete_coupons"
        | "view_analytics"
        | "export_data"
        | "manage_permissions"
        | "view_audit_log"
      payment_status: "pending_payment" | "paid" | "failed"
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
      app_role: [
        "admin",
        "super_admin",
        "moderator",
        "author",
        "super_author",
        "institution_admin",
      ],
      editorial_badge: [
        "editors_pick",
        "trending",
        "must_read",
        "community_favorite",
        "staff_pick",
      ],
      institution_permission: [
        "view_users",
        "add_users",
        "remove_users",
        "edit_users",
        "view_professionals",
        "add_professionals",
        "remove_professionals",
        "edit_professionals",
        "view_coupons",
        "create_coupons",
        "edit_coupons",
        "delete_coupons",
        "view_analytics",
        "export_data",
        "manage_permissions",
        "view_audit_log",
      ],
      payment_status: ["pending_payment", "paid", "failed"],
    },
  },
} as const
