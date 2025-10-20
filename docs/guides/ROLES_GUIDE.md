# User Roles Implementation Guide

## 🎯 Roles in Your App

Your app now supports three user roles:

- **Admin**: Full access to everything, can see/edit/delete all DIDs
- **Creator**: Can manage their own content (expandable for future features)
- **User**: Basic access, can only manage their own DIDs

---

## 📋 Step-by-Step Setup

### **1. Run SQL Commands in Supabase**

1. Open your Supabase project: <https://supabase.com/dashboard/project/vpmlokamxveoskhprxep>
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `ROLE_SETUP.sql`
5. **IMPORTANT**: Update line 79 - replace `'your-email@example.com'` with your actual email
6. Click **Run** to execute

### **2. Assign Your Admin Role**

After running the SQL, you'll need to **log out and log back in** for the role to take effect.

The JWT token is created at login time, so existing sessions won't have the new role until you re-authenticate.

### **3. Verify It Worked**

After logging back in:

1. Check your profile dropdown - you should see an **"Admin"** badge (purple)
2. The **Admin** link should appear in the navigation
3. Visit `/admin` to see the admin dashboard

---

## 🔧 How to Use Roles in Your Code

### **In Components:**

```typescript
import { useAuth } from "../lib/AuthContext";

export default function MyComponent() {
  const { role, isAdmin, isCreator } = useAuth();

  return (
    <div>
      {/* Show for admins only */}
      {isAdmin && <button>Delete All</button>}

      {/* Show for creators and admins */}
      {(isCreator || isAdmin) && <button>Special Feature</button>}

      {/* Show role name */}
      <p>Your role: {role}</p>
    </div>
  );
}
```

### **Protect Entire Pages:**

```typescript
import { AdminOnly, CreatorOrAdmin } from "../components/RoleProtected";

// Admin-only page
export default function AdminPage() {
  return (
    <AdminOnly>
      <h1>Admin Dashboard</h1>
    </AdminOnly>
  );
}

// Creator or Admin page
export default function CreatorPage() {
  return (
    <CreatorOrAdmin>
      <h1>Creator Tools</h1>
    </CreatorOrAdmin>
  );
}
```

---

## 🔐 How Roles Work

### **Storage:**

- Roles are stored in `auth.users.raw_app_metadata.role`
- Included in the JWT token automatically
- No extra database queries needed!

### **Client-Side:**

- `AuthContext` extracts role from `user.app_metadata.role`
- Available everywhere via `useAuth()` hook
- Protected components redirect unauthorized users

### **Server-Side (RLS):**

- `auth.user_role()` function reads role from JWT
- RLS policies enforce permissions at database level
- Even if someone bypasses UI, database blocks unauthorized access

---

## 👥 Managing User Roles

### **Make Someone an Admin:**

```sql
UPDATE auth.users
SET raw_app_metadata =
  raw_app_metadata || '{"role": "admin"}'::jsonb
WHERE email = 'user@example.com';
```

### **Make Someone a Creator:**

```sql
UPDATE auth.users
SET raw_app_metadata =
  raw_app_metadata || '{"role": "creator"}'::jsonb
WHERE email = 'creator@example.com';
```

### **Reset to Regular User:**

```sql
UPDATE auth.users
SET raw_app_metadata =
  raw_app_metadata || '{"role": "user"}'::jsonb
WHERE email = 'someone@example.com';
```

### **View All User Roles:**

```sql
SELECT
  email,
  raw_app_metadata->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

---

## 🛡️ Security Notes

1. **RLS is Mandatory**: Always set up RLS policies - they're your last line of defense
2. **Never Trust Client**: Even though UI hides things, users can bypass it - RLS prevents actual access
3. **Role Changes**: Users must re-login after role changes to get new JWT
4. **Default Role**: All users without a role default to "user"

---

## 🚀 Future Expansion Ideas

### **Add More Granular Permissions:**

```sql
-- Instead of just role, add permissions array
UPDATE auth.users
SET raw_app_metadata = raw_app_metadata || '{
  "role": "creator",
  "permissions": ["create_themes", "edit_own_themes", "publish_themes"]
}'::jsonb
WHERE email = 'creator@example.com';
```

Then in your code:

```typescript
const permissions = user?.app_metadata?.permissions || [];
const canPublish = permissions.includes("publish_themes");
```

### **Add Role Expiration:**

```sql
UPDATE auth.users
SET raw_app_metadata = raw_app_metadata || '{
  "role": "creator",
  "role_expires_at": "2025-12-31"
}'::jsonb
WHERE email = 'temp-creator@example.com';
```

---

## ✅ What's Implemented

- [x] Role types (admin, creator, user)
- [x] AuthContext with role support
- [x] Role-based navigation (Admin link only for admins)
- [x] Role badges in UI (purple for admin, blue for creator)
- [x] Protected route components (AdminOnly, CreatorOrAdmin, RoleProtected)
- [x] Admin dashboard example page
- [x] SQL helper function for RLS
- [x] Complete RLS policies
- [x] TypeScript type safety for all roles

---

## 🔄 Migration Path (If You Need Custom Table Later)

If requirements change and you need the custom table approach:

1. The frontend code stays ~95% the same
2. Only `AuthContext` changes (fetch from table instead of JWT)
3. Migration can be done in a few hours
4. See previous conversation for detailed migration guide
