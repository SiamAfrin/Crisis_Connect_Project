export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          address: string;
          role: Database["public"]["Enums"]["user_role"];
          rescue_team_category:
            | Database["public"]["Enums"]["rescue_team_category"]
            | null;
          defence_subcategory:
            | Database["public"]["Enums"]["defence_subcategory"]
            | null;
          account_status: Database["public"]["Enums"]["account_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          address: string;
          role: Database["public"]["Enums"]["user_role"];
          rescue_team_category?:
            | Database["public"]["Enums"]["rescue_team_category"]
            | null;
          defence_subcategory?:
            | Database["public"]["Enums"]["defence_subcategory"]
            | null;
          account_status?: Database["public"]["Enums"]["account_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          address?: string;
          role?: Database["public"]["Enums"]["user_role"];
          rescue_team_category?:
            | Database["public"]["Enums"]["rescue_team_category"]
            | null;
          defence_subcategory?:
            | Database["public"]["Enums"]["defence_subcategory"]
            | null;
          account_status?: Database["public"]["Enums"]["account_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      emergency_requests: {
        Row: {
          request_id: string;
          victim_id: string;
          emergency_type: string;
          description: string;
          location: string;
          affected_people: number;
          severity: Database["public"]["Enums"]["emergency_severity"];
          request_status: Database["public"]["Enums"]["request_status"];
          created_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: {
          request_id?: string;
          victim_id: string;
          emergency_type: string;
          description: string;
          location: string;
          affected_people: number;
          severity: Database["public"]["Enums"]["emergency_severity"];
          request_status?: Database["public"]["Enums"]["request_status"];
          created_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: {
          request_id?: string;
          victim_id?: string;
          emergency_type?: string;
          description?: string;
          location?: string;
          affected_people?: number;
          severity?: Database["public"]["Enums"]["emergency_severity"];
          request_status?: Database["public"]["Enums"]["request_status"];
          created_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "emergency_requests_victim_id_fkey";
            columns: ["victim_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emergency_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      emergency_assignments: {
        Row: {
          assignment_id: string;
          request_id: string;
          responder_id: string;
          responder_role: Database["public"]["Enums"]["user_role"];
          assignment_status: Database["public"]["Enums"]["assignment_status"];
          accepted_at: string | null;
          assigned_by: string;
          assigned_at: string;
        };
        Insert: {
          assignment_id?: string;
          request_id: string;
          responder_id: string;
          responder_role: Database["public"]["Enums"]["user_role"];
          assignment_status?: Database["public"]["Enums"]["assignment_status"];
          accepted_at?: string | null;
          assigned_by: string;
          assigned_at?: string;
        };
        Update: {
          assignment_id?: string;
          request_id?: string;
          responder_id?: string;
          responder_role?: Database["public"]["Enums"]["user_role"];
          assignment_status?: Database["public"]["Enums"]["assignment_status"];
          accepted_at?: string | null;
          assigned_by?: string;
          assigned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emergency_assignments_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: true;
            referencedRelation: "emergency_requests";
            referencedColumns: ["request_id"];
          },
          {
            foreignKeyName: "emergency_assignments_responder_id_fkey";
            columns: ["responder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emergency_assignments_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      emergency_acceptances: {
        Row: {
          acceptance_id: string;
          request_id: string;
          responder_id: string;
          accepted_at: string;
        };
        Insert: {
          acceptance_id?: string;
          request_id: string;
          responder_id: string;
          accepted_at?: string;
        };
        Update: {
          acceptance_id?: string;
          request_id?: string;
          responder_id?: string;
          accepted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emergency_acceptances_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "emergency_requests";
            referencedColumns: ["request_id"];
          },
          {
            foreignKeyName: "emergency_acceptances_responder_id_fkey";
            columns: ["responder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      is_active_responder: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_active_victim: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      review_responder_account: {
        Args: {
          target_profile_id: string;
          decision: Database["public"]["Enums"]["account_status"];
        };
        Returns: Database["public"]["Enums"]["account_status"];
      };
      review_emergency_request: {
        Args: {
          target_request_id: string;
          decision: Database["public"]["Enums"]["request_status"];
        };
        Returns: Database["public"]["Enums"]["request_status"];
      };
      accept_emergency_request: {
        Args: {
          target_request_id: string;
        };
        Returns: string;
      };
      assign_emergency_responder: {
        Args: {
          target_request_id: string;
          target_responder_id: string;
        };
        Returns: string;
      };
      list_assigned_request_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
    };
    Enums: {
      user_role: "victim" | "volunteer" | "rescue_team_member" | "administrator";
      rescue_team_category: "government" | "hospital" | "defence" | "ngo";
      defence_subcategory: "police" | "fire_service";
      account_status: "pending" | "active" | "rejected";
      emergency_severity: "low" | "medium" | "high" | "critical";
      request_status: "pending" | "approved" | "rejected";
      assignment_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "completed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type AppEnums = PublicSchema["Enums"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
