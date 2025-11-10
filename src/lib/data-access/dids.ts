import type { Database } from "../database.types";
import { supabase } from "../supabaseClient";

type DID = Database["public"]["Tables"]["dids"]["Row"];
type DIDInsert = Database["public"]["Tables"]["dids"]["Insert"];
type DIDUpdate = Database["public"]["Tables"]["dids"]["Update"];

export const didsApi = {
  /**
   * Get all DIDs for a user
   */
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("dids")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return data as DID[];
  },

  /**
   * Get a single DID by ID
   */
  async getById(didId: string) {
    const { data, error } = await supabase
      .from("dids")
      .select("*")
      .eq("id", didId)
      .single();

    if (error) {
      throw error;
    }
    return data as DID;
  },

  /**
   * Get DID by launcher ID
   */
  async getByLauncherId(launcherId: string, userId: string) {
    const { data, error } = await supabase
      .from("dids")
      .select("*")
      .eq("launcher_id", launcherId)
      .eq("user_id", userId)
      .single();

    if (error) {
      throw error;
    }
    return data as DID;
  },

  /**
   * Get total count of DIDs
   * @param userId - Optional user ID to filter by
   */
  async getCount(userId?: string) {
    let query = supabase
      .from("dids")
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
   * Create a new DID
   */
  async create(did: DIDInsert) {
    const { data, error } = await supabase
      .from("dids")
      .insert(did)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as DID;
  },

  /**
   * Update a DID
   */
  async update(didId: string, updates: DIDUpdate) {
    const { data, error } = await supabase
      .from("dids")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", didId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as DID;
  },

  /**
   * Delete a DID
   */
  async delete(didId: string) {
    const { error } = await supabase.from("dids").delete().eq("id", didId);

    if (error) {
      throw error;
    }
  },

  /**
   * Update DID notes
   */
  async updateNotes(didId: string, notes: string | null) {
    return await this.update(didId, { notes });
  },

  /**
   * Update DID name
   */
  async updateName(didId: string, name: string | null) {
    return await this.update(didId, { name });
  },
  /**
   * Update DID avatar URI
   */
  async updateAvatarUri(didId: string, avatarUri: string | null) {
    return await this.update(didId, { avatar_uri: avatarUri });
  },
};
