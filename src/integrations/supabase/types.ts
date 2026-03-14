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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      insurance_profiles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          level: number
          manual_markup_brl: number
          name: string
          pricing_mode: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          manual_markup_brl?: number
          name: string
          pricing_mode?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          manual_markup_brl?: number
          name?: string
          pricing_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          break_even_basis_brl: number
          broker: string
          broker_account: string
          brokerage_currency: string
          brokerage_per_contract: number
          commodity: string
          confirmation_message: string
          costs: Json
          created_at: string
          exchange: string
          exchange_rate: number | null
          exp_date: string
          futures_price: number
          futures_price_currency: string
          generated_at: string
          generated_by_user_id: string | null
          id: string
          legs: Json
          notes: string | null
          operation_date: string
          operation_id: string | null
          order_message: string
          origination_price_gross_brl: number
          origination_price_net_brl: number
          payment_date: string
          purchased_basis_brl: number
          sale_date: string
          sequential_number: number
          status: string
          stonex_confirmation_text: string | null
          stonex_confirmed_at: string | null
          target_basis_brl: number
          ticker: string
          updated_at: string
          volume_bushels: number | null
          volume_sacks: number
          volume_tons: number
          warehouse_display_name: string
          warehouse_id: string
        }
        Insert: {
          break_even_basis_brl?: number
          broker?: string
          broker_account?: string
          brokerage_currency: string
          brokerage_per_contract?: number
          commodity: string
          confirmation_message?: string
          costs?: Json
          created_at?: string
          exchange: string
          exchange_rate?: number | null
          exp_date: string
          futures_price: number
          futures_price_currency: string
          generated_at?: string
          generated_by_user_id?: string | null
          id?: string
          legs?: Json
          notes?: string | null
          operation_date?: string
          operation_id?: string | null
          order_message?: string
          origination_price_gross_brl: number
          origination_price_net_brl: number
          payment_date: string
          purchased_basis_brl?: number
          sale_date: string
          sequential_number: number
          status?: string
          stonex_confirmation_text?: string | null
          stonex_confirmed_at?: string | null
          target_basis_brl?: number
          ticker: string
          updated_at?: string
          volume_bushels?: number | null
          volume_sacks: number
          volume_tons: number
          warehouse_display_name: string
          warehouse_id: string
        }
        Update: {
          break_even_basis_brl?: number
          broker?: string
          broker_account?: string
          brokerage_currency?: string
          brokerage_per_contract?: number
          commodity?: string
          confirmation_message?: string
          costs?: Json
          created_at?: string
          exchange?: string
          exchange_rate?: number | null
          exp_date?: string
          futures_price?: number
          futures_price_currency?: string
          generated_at?: string
          generated_by_user_id?: string | null
          id?: string
          legs?: Json
          notes?: string | null
          operation_date?: string
          operation_id?: string | null
          order_message?: string
          origination_price_gross_brl?: number
          origination_price_net_brl?: number
          payment_date?: string
          purchased_basis_brl?: number
          sale_date?: string
          sequential_number?: number
          status?: string
          stonex_confirmation_text?: string | null
          stonex_confirmed_at?: string | null
          target_basis_brl?: number
          ticker?: string
          updated_at?: string
          volume_bushels?: number | null
          volume_sacks?: number
          volume_tons?: number
          warehouse_display_name?: string
          warehouse_id?: string
        }
        Relationships: []
      }
      pricing_combinations: {
        Row: {
          additional_discount_brl: number
          brokerage_per_contract: number
          commodity: string
          created_at: string
          created_by: string | null
          desk_cost_pct: number
          display_name: string
          exchange_rate: number | null
          exp_date: string
          futures_price: number
          grain_reception_date: string | null
          id: string
          interest_rate: number
          interest_rate_period: string
          is_active: boolean
          option_type: string
          payment_date: string
          reception_cost: number
          risk_free_rate: number
          rounding_increment: number
          sale_date: string
          shrinkage_rate_monthly: number
          sigma: number
          storage_cost: number
          storage_cost_type: string
          target_basis: number
          ticker: string
          trade_date_override: string | null
          updated_at: string
          updated_by: string | null
          warehouse_id: string
        }
        Insert: {
          additional_discount_brl?: number
          brokerage_per_contract?: number
          commodity: string
          created_at?: string
          created_by?: string | null
          desk_cost_pct?: number
          display_name: string
          exchange_rate?: number | null
          exp_date: string
          futures_price: number
          grain_reception_date?: string | null
          id?: string
          interest_rate?: number
          interest_rate_period?: string
          is_active?: boolean
          option_type?: string
          payment_date: string
          reception_cost?: number
          risk_free_rate?: number
          rounding_increment?: number
          sale_date: string
          shrinkage_rate_monthly?: number
          sigma?: number
          storage_cost?: number
          storage_cost_type?: string
          target_basis?: number
          ticker: string
          trade_date_override?: string | null
          updated_at?: string
          updated_by?: string | null
          warehouse_id: string
        }
        Update: {
          additional_discount_brl?: number
          brokerage_per_contract?: number
          commodity?: string
          created_at?: string
          created_by?: string | null
          desk_cost_pct?: number
          display_name?: string
          exchange_rate?: number | null
          exp_date?: string
          futures_price?: number
          grain_reception_date?: string | null
          id?: string
          interest_rate?: number
          interest_rate_period?: string
          is_active?: boolean
          option_type?: string
          payment_date?: string
          reception_cost?: number
          risk_free_rate?: number
          rounding_increment?: number
          sale_date?: string
          shrinkage_rate_monthly?: number
          sigma?: number
          storage_cost?: number
          storage_cost_type?: string
          target_basis?: number
          ticker?: string
          trade_date_override?: string | null
          updated_at?: string
          updated_by?: string | null
          warehouse_id?: string
        }
        Relationships: []
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
