import { supabase } from "../supabaseClient";
import type { Database } from "../database.types";

type Theme = Database["public"]["Tables"]["themes"]["Row"];
type ThemeInsert = Database["public"]["Tables"]["themes"]["Insert"];
type ThemeUpdate = Database["public"]["Tables"]["themes"]["Update"];

export const themesApi = {
  /**
   * Get all themes for a specific user
   */
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("themes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }
    return data as Theme[];
  },

  /**
   * Get a single theme by ID (with user ownership check)
   */
  async getById(themeId: string, userId: string) {
    const { data, error } = await supabase
      .from("themes")
      .select("*")
      .eq("id", themeId)
      .eq("user_id", userId)
      .single();

    if (error) {
      throw error;
    }
    return data as Theme;
  },

  /**
   * Get total count of themes
   * @param userId - Optional user ID to filter by
   */
  async getCount(userId?: string) {
    let query = supabase
      .from("themes")
      .select("*", { count: "exact", head: true });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { count, error } = await query;
    if (error) {
      throw error;
    }
    return count || 0;
  },

  /**
   * Create a new theme
   */
  async create(theme: ThemeInsert) {
    const { data, error } = await supabase
      .from("themes")
      .insert(theme)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Theme;
  },

  /**
   * Update an existing theme
   */
  async update(themeId: string, updates: ThemeUpdate) {
    const { data, error } = await supabase
      .from("themes")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", themeId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Theme;
  },

  /**
   * Delete a theme
   */
  async delete(themeId: string) {
    const { error } = await supabase.from("themes").delete().eq("id", themeId);

    if (error) {
      throw error;
    }
  },

  /**
   * Update theme notes
   */
  async updateNotes(themeId: string, notes: string | null) {
    const { data, error } = await supabase
      .from("themes")
      .update({
        notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", themeId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Theme;
  },
};
