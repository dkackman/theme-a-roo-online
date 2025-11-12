/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { useAuth } from "../../Contexts/AuthContext";
import { addressesApi } from "../../lib/data-access";
import type { Database } from "../../lib/database.types";
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
    try {
      const data = await addressesApi.getByUserId(user.id);
      setAddresses(data);
    } catch (error) {
      console.error("Error fetching addresses", error);
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
    try {
      await addressesApi.create({
        address: address,
        user_id: user.id,
        network: 0,
      });
      toast.success("Address added successfully");
      setAddress("");
      fetchAddresses();
    } catch (error: any) {
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
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await addressesApi.delete(id);
      toast.success("Address deleted successfully");
      fetchAddresses();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to delete address", {
        description: error.message || "An unexpected error occurred.",
      });
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
    try {
      await addressesApi.update(id, updates);
      toast.success("Address updated successfully");
      fetchAddresses();
    } catch (error: any) {
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New Address</CardTitle>
          <CardDescription>
            Enter a blockchain address to add it to your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addAddress}>
            <FieldGroup>
              <Field orientation="vertical">
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <FieldContent>
                  <div className="flex gap-3">
                    <Input
                      id="address"
                      placeholder="Add a new address..."
                      value={address}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setAddress(e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button type="submit" variant="default">
                      Add Address
                    </Button>
                  </div>
                </FieldContent>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
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
