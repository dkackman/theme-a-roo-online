import { themesApi } from "./themes";
import { usersApi } from "./users";
import { addressesApi } from "./addresses";
import { didsApi } from "./dids";

export { themesApi, usersApi, addressesApi, didsApi };

/**
 * Combined database API object
 *
 * Usage:
 * ```typescript
 * import { db } from '@/lib/data-access';
 *
 * const themes = await db.themes.getByUserId(userId);
 * const users = await db.users.getAll();
 * const addresses = await db.addresses.getByUserId(userId);
 * const dids = await db.dids.getByUserId(userId);
 * ```
 */
export const db = {
  themes: themesApi,
  users: usersApi,
  addresses: addressesApi,
  dids: didsApi,
} as const;
