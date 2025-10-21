import { supabase } from "../supabaseClient";
import type { Database } from "../database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];
type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];
type AddressUpdate = Database["public"]["Tables"]["addresses"]["Update"];

export const addressesApi = {
  /**
   * Get all addresses for a user
   */
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return data as Address[];
  },

  /**
   * Get a single address by ID
   */
  async getById(addressId: string) {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", addressId)
      .single();

    if (error) {
      throw error;
    }
    return data as Address;
  },

  /**
   * Get total count of addresses
   * @param userId - Optional user ID to filter by
   */
  async getCount(userId?: string) {
    let query = supabase
      .from("addresses")
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
   * Create a new address
   */
  async create(address: AddressInsert) {
    const { data, error } = await supabase
      .from("addresses")
      .insert(address)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Address;
  },

  /**
   * Update an address
   */
  async update(addressId: string, updates: AddressUpdate) {
    const { data, error } = await supabase
      .from("addresses")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", addressId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Address;
  },

  /**
   * Delete an address
   */
  async delete(addressId: string) {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId);

    if (error) {
      throw error;
    }
  },

  /**
   * Update address notes
   */
  async updateNotes(addressId: string, notes: string | null) {
    return await this.update(addressId, { notes });
  },

  /**
   * Update address metadata
   */
  async updateMetadata(
    addressId: string,
    metadata: Database["public"]["Tables"]["addresses"]["Row"]["metadata"]
  ) {
    return await this.update(addressId, { metadata });
  },
};
