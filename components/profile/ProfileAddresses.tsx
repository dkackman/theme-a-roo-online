import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { useAuth } from "../../lib/AuthContext";
import type { Database } from "../../lib/database.types";
import { supabase } from "../../lib/supabaseClient";
import AddressList from "../AddressList";

type Address = Database["public"]["Tables"]["addresses"]["Row"];

export default function ProfileAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching addresses", error);
    } else {
      setAddresses(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user, fetchAddresses]);

  const addAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!address || !user) {
      return;
    }
    const newAddress = { address: address, user_id: user.id, network: 0 };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type inference issue with Supabase client
    const { error } = await supabase
      .from("addresses")
      .insert(newAddress)
      .select();
    if (error) {
      console.error(error);
      // Check for duplicate key error
      if (error.code === "23505") {
        toast.error("Duplicate Address", {
          description: "This address already exists in your addresses.",
        });
      } else {
        toast.error("Failed to add address", {
          description: error.message || "An unexpected error occurred.",
        });
      }
    } else {
      toast.success("Address added successfully");
      setAddress("");
      fetchAddresses();
    }
  };

  const deleteAddress = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Failed to delete address", {
        description: error.message || "An unexpected error occurred.",
      });
    } else {
      toast.success("Address deleted successfully");
      fetchAddresses();
    }
  };

  const updateAddress = async (
    id: string,
    updates: {
      address: string;
      notes: string | null;
      network: number;
    }
  ) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type inference issue with Supabase client
    const { error } = await supabase
      .from("addresses")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating address:", error);
      // Check for duplicate key error
      if (error.code === "23505") {
        toast.error("Duplicate Address", {
          description: "This address already exists in your addresses.",
        });
      } else {
        toast.error("Failed to update address", {
          description: error.message || "An unexpected error occurred.",
        });
      }
      throw error;
    } else {
      toast.success("Address updated successfully");
      fetchAddresses();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Addresses</h2>
        <p className="text-muted-foreground">
          Manage your blockchain addresses
        </p>
      </div>

      <form onSubmit={addAddress} className="flex gap-3">
        <Input
          placeholder="Add a new address..."
          value={address}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setAddress(e.target.value)
          }
        />
        <Button type="submit" variant="default">
          Add Address
        </Button>
      </form>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <AddressList
          addresses={addresses}
          onDelete={deleteAddress}
          onUpdate={updateAddress}
        />
      )}
    </div>
  );
}
