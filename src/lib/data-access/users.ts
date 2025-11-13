import type { Database } from "../database.types";
import { supabase } from "../supabase-client";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserProfileInsert =
  Database["public"]["Tables"]["user_profiles"]["Insert"];
type UserProfileUpdate =
  Database["public"]["Tables"]["user_profiles"]["Update"];

export const usersApi = {
  /**
   * Get all user profiles (admin only)
   */
  async getAll() {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return data as UserProfile[];
  },

  /**
   * Get user profile by ID
   */
  async getById(userId: string) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }
    return data as UserProfile;
  },

  /**
   * Get total count of users
   */
  async getCount() {
    const { count, error } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw error;
    }
    return count || 0;
  },

  /**
   * Update user profile
   */
  async update(userId: string, updates: UserProfileUpdate) {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as UserProfile;
  },

  /**
   * Create user profile
   */
  async create(profile: UserProfileInsert) {
    const { data, error } = await supabase
      .from("user_profiles")
      .insert(profile)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as UserProfile;
  },
};
