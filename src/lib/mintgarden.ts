export interface MintGardenProfile {
  encoded_id: string;
  name: string;
  avatar_uri: string | null;
}

export async function fetchProfileFromAPI(
  did: string,
  testnet: boolean = false
): Promise<MintGardenProfile | null> {
  try {
    const response = await fetch(
      `https://api.${testnet ? "testnet." : ""}mintgarden.io/profile/${did}`
    );
    const data = await response.json();

    if (data?.detail !== "Unknown profile.") {
      return data;
    }
  } catch (error) {
    console.error("Failed to fetch profile from MintGarden:", error);
  }
  return null;
}
