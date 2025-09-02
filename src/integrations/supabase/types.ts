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
          id: number
          idiomas_raw: string | null
          last_name: string | null
          linkedin: string | null
          preco_consulta: number | null
          profissao: string | null
          resumo: string | null
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
          id?: number
          idiomas_raw?: string | null
          last_name?: string | null
          linkedin?: string | null
          preco_consulta?: number | null
          profissao?: string | null
          resumo?: string | null
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
          id?: number
          idiomas_raw?: string | null
          last_name?: string | null
          linkedin?: string | null
          preco_consulta?: number | null
          profissao?: string | null
          resumo?: string | null
          servicos_raw?: string | null
          telefone?: string | null
          tempo_consulta?: number | null
          user_email?: string
          user_id?: number
          user_login?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "profissionais_sessoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_disponibilidades"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: []
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
          {
            foreignKeyName: "profissionais_sessoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_disponibilidades"
            referencedColumns: ["user_id"]
          },
        ]
      }
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
