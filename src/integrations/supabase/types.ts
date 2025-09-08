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
          created_at: string
          data_consulta: string
          email_paciente: string
          horario: string
          id: string
          mercado_pago_preference_id: string | null
          nome_paciente: string
          observacoes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          professional_id: string | null
          status: string
          stripe_session_id: string | null
          telefone_paciente: string
          updated_at: string
          user_id: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          data_consulta: string
          email_paciente: string
          horario: string
          id?: string
          mercado_pago_preference_id?: string | null
          nome_paciente: string
          observacoes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          professional_id?: string | null
          status?: string
          stripe_session_id?: string | null
          telefone_paciente: string
          updated_at?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          data_consulta?: string
          email_paciente?: string
          horario?: string
          id?: string
          mercado_pago_preference_id?: string | null
          nome_paciente?: string
          observacoes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          professional_id?: string | null
          status?: string
          stripe_session_id?: string | null
          telefone_paciente?: string
          updated_at?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_email: string
          author_name: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_email?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        }
        Insert: {
          created_at?: string | null
          eh_estudante?: boolean
          id?: string
          instituicao_ensino?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string | null
          eh_estudante?: boolean
          id?: string
          instituicao_ensino?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
          nome: string
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
          id?: string
          nome: string
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
          id?: string
          nome?: string
          tipo_usuario?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          ativo: boolean
          cpf: string | null
          crp_crm: string | null
          display_name: string
          email_secundario: string | null
          first_name: string | null
          formacao_raw: string | null
          foto_id: number | null
          foto_perfil_url: string | null
          id: number
          idiomas_raw: string | null
          last_name: string | null
          linkedin: string | null
          possui_e_psi: boolean | null
          preco_consulta: number | null
          profile_id: string | null
          profissao: string | null
          resumo: string | null
          resumo_profissional: string | null
          servicos_raw: string | null
          telefone: string | null
          tempo_consulta: number | null
          user_email: string
          user_id: number
          user_login: string
        }
        Insert: {
          ativo?: boolean
          cpf?: string | null
          crp_crm?: string | null
          display_name: string
          email_secundario?: string | null
          first_name?: string | null
          formacao_raw?: string | null
          foto_id?: number | null
          foto_perfil_url?: string | null
          id?: number
          idiomas_raw?: string | null
          last_name?: string | null
          linkedin?: string | null
          possui_e_psi?: boolean | null
          preco_consulta?: number | null
          profile_id?: string | null
          profissao?: string | null
          resumo?: string | null
          resumo_profissional?: string | null
          servicos_raw?: string | null
          telefone?: string | null
          tempo_consulta?: number | null
          user_email: string
          user_id: number
          user_login: string
        }
        Update: {
          ativo?: boolean
          cpf?: string | null
          crp_crm?: string | null
          display_name?: string
          email_secundario?: string | null
          first_name?: string | null
          formacao_raw?: string | null
          foto_id?: number | null
          foto_perfil_url?: string | null
          id?: number
          idiomas_raw?: string | null
          last_name?: string | null
          linkedin?: string | null
          possui_e_psi?: boolean | null
          preco_consulta?: number | null
          profile_id?: string | null
          profissao?: string | null
          resumo?: string | null
          resumo_profissional?: string | null
          servicos_raw?: string | null
          telefone?: string | null
          tempo_consulta?: number | null
          user_email?: string
          user_id?: number
          user_login?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
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
      system_configurations: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
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
          updated_at?: string
          updated_by?: string | null
          value?: Json
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
    }
    Views: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "super_admin" | "moderator"
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
      app_role: ["admin", "super_admin", "moderator"],
      payment_status: ["pending_payment", "paid", "failed"],
    },
  },
} as const
