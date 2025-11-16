import type { Database } from "../database.types";
import { supabase } from "../supabase-client";
import { addressesApi } from "./addresses";
import { didsApi } from "./dids";
import { usersApi } from "./users";

type Theme = Database["public"]["Tables"]["themes"]["Row"];
type ThemeInsert = Database["public"]["Tables"]["themes"]["Insert"];
type ThemeUpdate = Database["public"]["Tables"]["themes"]["Update"];

type ThemeCreateInput = ThemeInsert;

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
   * @param themeId - The theme ID to fetch
   * @param userId - The user ID (required for non-admin users)
   * @param allowAdminAccess - If true, allows admins to access any theme regardless of ownership
   */
  async getById(
    themeId: string,
    userId: string,
    allowAdminAccess: boolean = false
  ) {
    let query = supabase.from("themes").select("*").eq("id", themeId);

    // If not allowing admin access, enforce ownership check
    if (!allowAdminAccess) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.single();

    if (error) {
      throw error;
    }

    // Security check: if admin access is not allowed, verify ownership
    if (!allowAdminAccess && data.user_id !== userId) {
      throw new Error("Unauthorized: You do not have access to this theme");
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
  async create(theme: ThemeCreateInput) {
    const themeToInsert: ThemeCreateInput = { ...theme };
    const userId = themeToInsert.user_id;

    const needsProfileData =
      !themeToInsert.author_name ||
      !themeToInsert.sponsor ||
      !themeToInsert.twitter ||
      !themeToInsert.website;
    const needsDid = !themeToInsert.did;
    const needsAddress = !themeToInsert.royalty_address;

    if (userId) {
      const [profile, dids, addresses] = await Promise.all([
        needsProfileData ? usersApi.getById(userId).catch(() => null) : null,
        needsDid ? didsApi.getByUserId(userId).catch(() => []) : null,
        needsAddress ? addressesApi.getByUserId(userId).catch(() => []) : null,
      ]);

      if (
        !themeToInsert.author_name ||
        themeToInsert.author_name.trim() === ""
      ) {
        const name = profile?.name?.trim();
        themeToInsert.author_name = name && name.length > 0 ? name : null;
      }
      if (!themeToInsert.sponsor || themeToInsert.sponsor.trim() === "") {
        const sponsor = profile?.sponsor?.trim();
        themeToInsert.sponsor = sponsor && sponsor.length > 0 ? sponsor : null;
      }
      if (!themeToInsert.twitter || themeToInsert.twitter.trim() === "") {
        const twitter = profile?.twitter?.trim();
        themeToInsert.twitter = twitter && twitter.length > 0 ? twitter : null;
      }
      if (!themeToInsert.website || themeToInsert.website.trim() === "") {
        const website = profile?.website?.trim();
        themeToInsert.website = website && website.length > 0 ? website : null;
      }
      if (needsDid) {
        // Prefer default DID, fall back to first DID
        const defaultDid =
          Array.isArray(dids) && dids.length > 0
            ? dids.find((d) => d.is_default) || dids[0]
            : null;
        themeToInsert.did = defaultDid?.launcher_id ?? null;
      }
      if (needsAddress) {
        // Prefer default address, fall back to first address
        const defaultAddress =
          Array.isArray(addresses) && addresses.length > 0
            ? addresses.find((a) => a.is_default) || addresses[0]
            : null;
        themeToInsert.royalty_address = defaultAddress?.address ?? null;
      }
    }

    const { data, error } = await supabase
      .from("themes")
      .insert(themeToInsert)
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

  /**
   * Get all published themes with user information (admin only)
   */
  async getPublishedWithUsers() {
    const { data, error } = await supabase
      .from("themes")
      .select(
        `
        *,
        user_profiles:user_id (
          id,
          email,
          name
        )
      `
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }
    return data as (Theme & {
      user_profiles: {
        id: string;
        email: string;
        name: string | null;
      } | null;
    })[];
  },

  /**
   * Get all minted themes with user information (admin only)
   */
  async getMintedWithUsers() {
    const { data, error } = await supabase
      .from("themes")
      .select(
        `
        *,
        user_profiles:user_id (
          id,
          email,
          name
        )
      `
      )
      .eq("status", "minted")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }
    return data as (Theme & {
      user_profiles: {
        id: string;
        email: string;
        name: string | null;
      } | null;
    })[];
  },
};
