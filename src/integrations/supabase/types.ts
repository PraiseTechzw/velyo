export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      whatsapp_integrations: {
        Row: {
          id: string;
          business_id: string;
          phone_number_id: string;
          business_account_id: string;
          display_phone_number: string;
          status: string;
          last_error: string;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          phone_number_id: string;
          business_account_id: string;
          display_phone_number?: string;
          status?: string;
          last_error?: string;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          last_error?: string;
          display_phone_number?: string;
          verified_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          business_id: string;
          wa_id: string;
          display_name: string;
          is_lead: boolean;
          lead_status: string;
          lead_interest: string;
          lead_source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          wa_id: string;
          display_name?: string;
          is_lead?: boolean;
          lead_status?: string;
          lead_interest?: string;
          lead_source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: { display_name?: string; is_lead?: boolean; lead_status?: string; lead_interest?: string; lead_source?: string; updated_at?: string };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          business_id: string;
          contact_id: string;
          status: string;
          handling_mode: string;
          assigned_to: string | null;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          contact_id: string;
          status?: string;
          handling_mode?: string;
          assigned_to?: string | null;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
          handling_mode?: string;
          assigned_to?: string | null;
          last_message_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          business_id: string;
          conversation_id: string;
          direction: string;
          message_type: string;
          content_text: string;
          provider_message_id: string | null;
          delivery_status: string;
          error_code: string;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          conversation_id: string;
          direction: string;
          message_type?: string;
          content_text?: string;
          provider_message_id?: string | null;
          delivery_status: string;
          error_code?: string;
          occurred_at: string;
          created_at?: string;
        };
        Update: {
          provider_message_id?: string | null;
          delivery_status?: string;
          error_code?: string;
        };
        Relationships: [];
      };
      whatsapp_webhook_events: {
        Row: {
          id: string;
          event_key: string;
          phone_number_id: string;
          business_id: string | null;
          event_type: string;
          payload: Json;
          processing_status: string;
          attempts: number;
          last_error: string;
          next_attempt_at: string | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          event_key: string;
          phone_number_id: string;
          business_id?: string | null;
          event_type: string;
          payload: Json;
          processing_status?: string;
          attempts?: number;
          last_error?: string;
          next_attempt_at?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Update: {
          processing_status?: string;
          attempts?: number;
          last_error?: string;
          next_attempt_at?: string | null;
          processed_at?: string | null;
        };
        Relationships: [];
      };
      business_credentials: {
        Row: {
          business_id: string;
          encrypted_token: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          encrypted_token: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          encrypted_token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_credentials_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          address: string;
          ai_instructions: string;
          contact_email: string;
          contact_phone: string;
          created_at: string;
          country: string;
          currency: string;
          delivery_policy: string;
          description: string;
          faqs: string;
          id: string;
          industry: string;
          timezone: string;
          website: string;
          social_links: string;
          language: string;
          name: string;
          notifications: boolean;
          operating_hours: string;
          owner_id: string;
          profile_visible: boolean;
          products: string;
          whatsapp_business_account_id: string;
          whatsapp_phone_number_id: string;
        };
        Insert: {
          address?: string;
          ai_instructions?: string;
          contact_email?: string;
          contact_phone?: string;
          created_at?: string;
          country?: string;
          currency?: string;
          delivery_policy?: string;
          description?: string;
          faqs?: string;
          id?: string;
          industry?: string;
          timezone?: string;
          website?: string;
          social_links?: string;
          language?: string;
          name: string;
          notifications?: boolean;
          operating_hours?: string;
          owner_id: string;
          profile_visible?: boolean;
          products?: string;
          whatsapp_business_account_id?: string;
          whatsapp_phone_number_id?: string;
        };
        Update: {
          address?: string;
          ai_instructions?: string;
          contact_email?: string;
          contact_phone?: string;
          created_at?: string;
          country?: string;
          currency?: string;
          delivery_policy?: string;
          description?: string;
          faqs?: string;
          id?: string;
          industry?: string;
          timezone?: string;
          website?: string;
          social_links?: string;
          language?: string;
          name?: string;
          notifications?: boolean;
          operating_hours?: string;
          owner_id?: string;
          profile_visible?: boolean;
          products?: string;
          whatsapp_business_account_id?: string;
          whatsapp_phone_number_id?: string;
        };
        Relationships: [];
      };
      contact_questions: {
        Row: {
          business: string;
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
        };
        Insert: {
          business?: string;
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
        };
        Update: {
          business?: string;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          id: string;
        };
        Insert: {
          avatar_url?: string;
          created_at?: string;
          display_name?: string;
          id: string;
        };
        Update: {
          avatar_url?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          business_id: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_business: {
        Args: { business_industry: string; business_name: string };
        Returns: string;
      };
      is_business_member: { Args: { target: string }; Returns: boolean };
      save_business_profile: { Args: { business_data: Json; profile_data: Json }; Returns: string };
      process_whatsapp_event: {
        Args: {
          p_event_key: string;
          p_event_type: string;
          p_payload: Json;
          p_phone_number_id: string;
        };
        Returns: Json;
      };
      retry_failed_whatsapp_events: { Args: { p_batch_size?: number }; Returns: number };
      prepare_whatsapp_message: {
        Args: { p_conversation_id: string; p_text: string };
        Returns: {
          message_id: string;
          business_id: string;
          phone_number_id: string;
          recipient: string;
        }[];
      };
      list_whatsapp_inbox: { Args: { p_before?: string | null; p_limit?: number }; Returns: Json };
      list_whatsapp_messages: {
        Args: {
          p_before_id?: string | null;
          p_before_time?: string | null;
          p_conversation_id: string;
          p_limit?: number;
        };
        Returns: Json;
      };
      mark_whatsapp_message_sent: {
        Args: { p_message_id: string; p_provider_message_id: string };
        Returns: boolean;
      };
      mark_whatsapp_message_failed: {
        Args: { p_message_id: string; p_error_code: string };
        Returns: boolean;
      };
      store_whatsapp_connection: {
        Args: {
          p_business_account_id: string;
          p_business_id: string;
          p_display_phone_number: string;
          p_encrypted_token: string;
          p_phone_number_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
