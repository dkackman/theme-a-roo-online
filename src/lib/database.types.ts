export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string;
          created_at: string | null;
          id: string;
          name: string | null;
          network: number;
          notes: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          address: string;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          network?: number;
          notes?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          address?: string;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          network?: number;
          notes?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dids: {
        Row: {
          avatar_uri: string | null;
          created_at: string | null;
          id: string;
          launcher_id: string;
          name: string | null;
          network: number;
          notes: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          avatar_uri?: string | null;
          created_at?: string | null;
          id?: string;
          launcher_id: string;
          name?: string | null;
          network?: number;
          notes?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          avatar_uri?: string | null;
          created_at?: string | null;
          id?: string;
          launcher_id?: string;
          name?: string | null;
          network?: number;
          notes?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dids_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      theme_files: {
        Row: {
          created_at: string | null;
          file_use_type: Database["public"]["Enums"]["file_use_type"];
          id: string;
          mime_type: string | null;
          size: number | null;
          storage_path: string | null;
          theme_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          file_use_type: Database["public"]["Enums"]["file_use_type"];
          id?: string;
          mime_type?: string | null;
          size?: number | null;
          storage_path?: string | null;
          theme_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          file_use_type?: Database["public"]["Enums"]["file_use_type"];
          id?: string;
          mime_type?: string | null;
          size?: number | null;
          storage_path?: string | null;
          theme_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "theme_files_theme_id_fkey";
            columns: ["theme_id"];
            isOneToOne: false;
            referencedRelation: "themes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "theme_files_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      themes: {
        Row: {
          author_name: string | null;
          created_at: string | null;
          description: string | null;
          did: string | null;
          display_name: string;
          id: string;
          name: string;
          royalty_address: string | null;
          sponsor: string | null;
          status: Database["public"]["Enums"]["theme_status"];
          theme: Json | null;
          twitter: string | null;
          updated_at: string | null;
          user_id: string;
          website: string | null;
        };
        Insert: {
          author_name?: string | null;
          created_at?: string | null;
          description?: string | null;
          did?: string | null;
          display_name?: string;
          id?: string;
          name?: string;
          royalty_address?: string | null;
          sponsor?: string | null;
          status?: Database["public"]["Enums"]["theme_status"];
          theme?: Json | null;
          twitter?: string | null;
          updated_at?: string | null;
          user_id: string;
          website?: string | null;
        };
        Update: {
          author_name?: string | null;
          created_at?: string | null;
          description?: string | null;
          did?: string | null;
          display_name?: string;
          id?: string;
          name?: string;
          royalty_address?: string | null;
          sponsor?: string | null;
          status?: Database["public"]["Enums"]["theme_status"];
          theme?: Json | null;
          twitter?: string | null;
          updated_at?: string | null;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "themes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          created_at: string | null;
          email: string | null;
          email_confirmed_at: string | null;
          id: string;
          last_sign_in_at: string | null;
          name: string | null;
          role: string | null;
          sponsor: string | null;
          twitter: string | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          email_confirmed_at?: string | null;
          id: string;
          last_sign_in_at?: string | null;
          name?: string | null;
          role?: string | null;
          sponsor?: string | null;
          twitter?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          email_confirmed_at?: string | null;
          id?: string;
          last_sign_in_at?: string | null;
          name?: string | null;
          role?: string | null;
          sponsor?: string | null;
          twitter?: string | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_id: { Args: never; Returns: string };
      decode_jwt_claims: {
        Args: { jwt_text: string };
        Returns: {
          error: string;
          extracted_role: string;
          payload: Json;
        }[];
      };
      get_user_role: { Args: never; Returns: string };
      get_user_uid: { Args: never; Returns: string };
    };
    Enums: {
      file_use_type: "background" | "banner" | "preview";
      network: "mainnet" | "testnet";
      theme_status: "draft" | "ready" | "published" | "minted";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      file_use_type: ["background", "banner", "preview"],
      network: ["mainnet", "testnet"],
      theme_status: ["draft", "ready", "published", "minted"],
    },
  },
} as const;
