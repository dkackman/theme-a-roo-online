# Data Access Layer

This directory contains all database queries organized by table. Instead of calling Supabase directly in components, use these API functions.

## Benefits

- **Type Safety**: All queries are properly typed with database types
- **Single Source of Truth**: All queries in one place
- **Easier Testing**: Mock the API layer instead of Supabase
- **Consistency**: Same error handling everywhere
- **Discoverability**: Easy to see all available queries
- **Reusability**: No duplicate query logic

## Usage

### Option 1: Import individual APIs

```typescript
import { themesApi, usersApi, addressesApi, didsApi } from '@/lib/data-access';

// Get themes
const themes = await themesApi.getByUserId(userId);
const theme = await themesApi.getById(themeId, userId);
const count = await themesApi.getCount();

// Create, update, delete
await themesApi.create({ user_id: userId, name: "My Theme", ... });
await themesApi.update(themeId, { display_name: "New Name" });
await themesApi.delete(themeId);
```

### Option 2: Import combined db object

```typescript
import { db } from "@/lib/data-access";

const themes = await db.themes.getByUserId(userId);
const users = await db.users.getAll();
const addresses = await db.addresses.getByUserId(userId);
const dids = await db.dids.getByUserId(userId);
```

## Migration Examples

### Before (Direct Supabase calls)

```typescript
// In theme-editor.tsx
const { data, error } = await supabase
  .from("themes")
  .select("*")
  .eq("user_id", user.id)
  .eq("id", id)
  .single();

if (error) throw error;
setTheme(data);
```

### After (Using data access layer)

```typescript
// In theme-editor.tsx
import { themesApi } from "@/lib/data-access";

try {
  const theme = await themesApi.getById(id, user.id);
  setTheme(theme);
} catch (error) {
  console.error("Error loading theme:", error);
  toast.error("Failed to load theme");
}
```

### Another Example

**Before:**

```typescript
const { count: themeCount } = await supabase
  .from("themes")
  .select("*", { count: "exact", head: true });
```

**After:**

```typescript
const themeCount = await themesApi.getCount();
// Or with user filter:
const userThemeCount = await themesApi.getCount(userId);
```

## API Reference

### Themes API (`themesApi`)

- `getByUserId(userId: string)` - Get all themes for a user
- `getById(themeId: string, userId: string)` - Get a single theme
- `getCount(userId?: string)` - Get total count of themes
- `create(theme: ThemeInsert)` - Create a new theme
- `update(themeId: string, updates: ThemeUpdate)` - Update a theme
- `delete(themeId: string)` - Delete a theme
- `updateNotes(themeId: string, notes: string | null)` - Update theme notes

### Users API (`usersApi`)

- `getAll()` - Get all user profiles (admin only)
- `getById(userId: string)` - Get user profile by ID
- `getCount()` - Get total count of users
- `update(userId: string, updates: UserProfileUpdate)` - Update user profile
- `create(profile: UserProfileInsert)` - Create user profile

### Addresses API (`addressesApi`)

- `getByUserId(userId: string)` - Get all addresses for a user
- `getById(addressId: string)` - Get a single address
- `getCount(userId?: string)` - Get total count of addresses
- `create(address: AddressInsert)` - Create a new address
- `update(addressId: string, updates: AddressUpdate)` - Update an address
- `delete(addressId: string)` - Delete an address
- `updateNotes(addressId: string, notes: string | null)` - Update address notes
- `updateMetadata(addressId: string, metadata: Json)` - Update address metadata

### DIDs API (`didsApi`)

- `getByUserId(userId: string)` - Get all DIDs for a user
- `getById(didId: string)` - Get a single DID
- `getByLauncherId(launcherId: string, userId: string)` - Get DID by launcher ID
- `getCount(userId?: string)` - Get total count of DIDs
- `create(did: DIDInsert)` - Create a new DID
- `update(didId: string, updates: DIDUpdate)` - Update a DID
- `delete(didId: string)` - Delete a DID
- `updateNotes(didId: string, notes: string | null)` - Update DID notes
- `updateName(didId: string, name: string | null)` - Update DID name
- `updateMetadata(didId: string, metadata: Json)` - Update DID metadata

## Error Handling

All API functions throw errors if the database operation fails. Always wrap calls in try/catch:

```typescript
try {
  const themes = await themesApi.getByUserId(userId);
  setThemes(themes);
} catch (error) {
  console.error("Error fetching themes:", error);
  toast.error("Failed to load themes");
}
```

## TypeScript Types

All functions use proper TypeScript types from `database.types.ts`:

- `Row` types for returned data
- `Insert` types for creating records
- `Update` types for updating records

These are automatically enforced, so you get full type safety and autocomplete!
