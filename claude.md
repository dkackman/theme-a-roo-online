# Theme-a-roo Online - Project Guide

## Project Overview

Theme-a-roo Online is a Next.js application for creating, editing, and managing themes for Chia blockchain NFTs. Users can design themes, upload images to IPFS, and prepare NFT metadata for minting.

**Repository**: https://github.com/dkackman/theme-a-roo-online
**Current Deployment**: https://theme-a-roo-online.vercel.app

## Current Architecture (Production)

### Frontend

- **Framework**: Next.js 16.0.7 (Pages Router)
- **React**: 19.2.0
- **UI**: Radix UI + Tailwind CSS 4.x
- **Deployment**: Vercel
- **Key Libraries**:
  - `@monaco-editor/react` - Theme editor
  - `theme-o-rama` (v0.4.0) - Core theme library
  - `next-themes` - Dark mode support
  - `react-colorful` - Color picker
  - `html2canvas-pro` - Preview generation

### Backend

- **Database**: Supabase Postgres
  - Project ID: `vpmlokamxveoskhprxep`
  - URL: `vpmlokamxveoskhprxep.supabase.co`
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage for theme files + Pinata (IPFS) for NFT assets
- **Edge Functions**: Deno-based functions in [edge-src/](edge-src/) directory
  - File upload/download/delete operations
  - JWT-based authentication

### External Services

- **Pinata**: IPFS storage for NFT images and metadata
- **Vercel Analytics**: Performance monitoring
- **Vercel Speed Insights**: Performance tracking

## Database Schema

See [docs/sql/01_intial.sql](docs/sql/01_intial.sql) for full schema.

### Core Tables

#### `user_profiles`

- Links to Supabase `auth.users`
- Fields: `id`, `email`, `role`, `created_at`, `last_sign_in_at`
- Roles managed via [docs/guides/ROLES_GUIDE.md](docs/guides/ROLES_GUIDE.md)

#### `themes`

- User-created themes
- Fields: `id`, `user_id`, `name`, `display_name`, `theme` (JSONB), `is_draft`, `notes`
- Unique constraint: `(user_id, name)`

#### `theme_files`

- Binary file storage for themes
- Fields: `id`, `theme_id`, `file_use_type` (enum), `mime_type`, `file` (bytea)
- Unique constraint: `(theme_id, file_use_type)`

#### `addresses`

- Chia blockchain addresses per user
- Fields: `id`, `user_id`, `address`, `network`, `metadata` (JSONB), `notes`

#### `dids`

- Decentralized Identifiers per user
- Fields: `id`, `user_id`, `launcher_id`, `name`, `network`, `metadata` (JSONB), `notes`

## Environment Variables

### Current Production (Vercel + Supabase)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vpmlokamxveoskhprxep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Edge functions only

# Pinata (IPFS)
PINATA_JWT=<jwt-token>
PINATA_GATEWAY_URL=<gateway-url>

# Vercel (optional)
NEXT_PUBLIC_VERCEL_URL=<auto-provided>
```

### Required for Local Development

```bash
# Local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>

# Pinata (can reuse production keys for testing)
PINATA_JWT=<jwt-token>
PINATA_GATEWAY_URL=<gateway-url>

# Optional local settings
NODE_ENV=development
PORT=3000
```

## Migration Path: Production → Local Development

### Phase 1: Local Database Setup

**Goal**: Run Postgres locally instead of Supabase cloud

**Tasks**:

1. Install and initialize Supabase CLI

   ```bash
   npm install -g supabase
   supabase init
   supabase start
   ```

2. Export production schema

   ```bash
   # Already documented in README.md
   npx supabase gen types typescript --project-id vpmlokamxveoskhprxep > src/lib/database.types.ts
   ```

3. Create migration from [docs/sql/01_intial.sql](docs/sql/01_intial.sql)
   - Convert to Supabase migration format
   - Add RLS policies from [docs/sql/ROLE_SETUP.sql](docs/sql/ROLE_SETUP.sql)
   - Test migration: `supabase db reset`

4. Update [src/lib/supabase-client.ts](src/lib/supabase-client.ts)
   - Support local URLs via environment variables
   - Keep production config for Vercel deployments

5. Seed test data (optional)
   - Create sample users, themes, addresses, DIDs

**Files to Modify**:

- [src/lib/supabase-client.ts](src/lib/supabase-client.ts) - Connection config
- [next.config.js](next.config.js) - Image domain allowlist
- `.env.local` (create) - Local environment config

---

### Phase 2: Local Edge Functions

**Goal**: Run Deno edge functions locally

**Tasks**:

1. Install Deno locally: https://deno.land/manual/getting_started/installation

2. Convert [edge-src/](edge-src/) to Supabase Edge Functions

   ```bash
   supabase functions new theme-files
   # Move edge-src code to supabase/functions/theme-files/
   ```

3. Test edge functions locally

   ```bash
   supabase functions serve
   ```

4. Update client code to use local edge function URLs
   - Check [src/hooks/useUploadThemeFile.ts](src/hooks/useUploadThemeFile.ts)
   - Check [src/lib/data-access/themes.ts](src/lib/data-access/themes.ts)

**Files to Review**:

- [edge-src/index.ts](edge-src/index.ts) - Main edge function entry
- [edge-src/upload.ts](edge-src/upload.ts) - File upload logic
- [edge-src/delete.ts](edge-src/delete.ts) - File deletion
- [edge-src/url.ts](edge-src/url.ts) - URL generation

---

### Phase 3: Local Storage

**Goal**: Use local Supabase storage instead of cloud

**Tasks**:

1. Configure Supabase storage buckets locally
   - `supabase storage` commands
   - Match production bucket configuration

2. Update [src/lib/theme-files.ts](src/lib/theme-files.ts) for local storage paths

3. Test file upload/download flows
   - Check [src/components/IpfsImageUpload.tsx](src/components/IpfsImageUpload.tsx)
   - Check [src/components/FileSlot.tsx](src/components/FileSlot.tsx)

---

### Phase 4: IPFS/Pinata (Optional)

**Goal**: Decide on local IPFS strategy

**Options**:

1. **Keep Pinata**: Continue using production Pinata for IPFS uploads (simplest)
2. **Local IPFS Node**: Run local IPFS node (more complex, fully local)
3. **Mock IPFS**: Mock uploads for development (no real IPFS)

**Files Using IPFS**:

- [src/lib/ipfs.ts](src/lib/ipfs.ts) - Pinata SDK wrapper
- [src/components/IpfsImageUpload.tsx](src/components/IpfsImageUpload.tsx)
- [src/pages/prepare-nft.tsx](src/pages/prepare-nft.tsx)

---

### Phase 5: Local Development Workflow

**Goal**: Streamlined local development experience

**Tasks**:

1. Update [package.json](package.json) scripts

   ```json
   "dev:local": "supabase start && next dev",
   "db:reset": "supabase db reset",
   "db:types": "supabase gen types typescript --local > src/lib/database.types.ts",
   "db:migrate": "supabase db push",
   "functions:serve": "supabase functions serve"
   ```

2. Create comprehensive `.env.local.example`

3. Document setup in README.md

4. Add Docker Compose (optional) for one-command startup

---

## Project Structure

```
theme-a-roo-online/
├── src/
│   ├── pages/                    # Next.js pages (Pages Router)
│   │   ├── index.tsx            # Homepage (theme gallery)
│   │   ├── theme-editor.tsx     # Theme editor UI
│   │   ├── prepare-nft.tsx      # NFT metadata preparation
│   │   ├── profile.tsx          # User profile management
│   │   ├── admin.tsx            # Admin dashboard
│   │   ├── auth.tsx             # Authentication
│   │   └── _app.tsx             # App wrapper with providers
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # Radix UI + Tailwind components
│   │   ├── ThemeEditor*.tsx     # Theme editor components
│   │   ├── Nft*.tsx             # NFT-related components
│   │   └── UserProfile*.tsx     # User profile components
│   │
│   ├── Contexts/                # React Context providers
│   │   ├── AuthContext.tsx      # Supabase auth state
│   │   ├── ThemeEditorContext.tsx  # Theme editor state
│   │   └── ClientThemeProvider.tsx # Theme persistence
│   │
│   ├── lib/                     # Utility libraries
│   │   ├── data-access/         # Database query functions
│   │   │   ├── themes.ts        # Theme CRUD
│   │   │   ├── users.ts         # User profile CRUD
│   │   │   ├── addresses.ts     # Address CRUD
│   │   │   └── dids.ts          # DID CRUD
│   │   ├── supabase-client.ts   # Supabase client config
│   │   ├── database.types.ts    # Generated TypeScript types
│   │   ├── ipfs.ts              # Pinata IPFS integration
│   │   ├── theme-files.ts       # Theme file utilities
│   │   └── nft-metadata.ts      # NFT metadata generation
│   │
│   └── hooks/                   # Custom React hooks
│       ├── useUserThemes.ts     # Theme data fetching
│       ├── useThemeOperations.ts # Theme CRUD operations
│       └── useUploadThemeFile.ts # File upload hook
│
├── edge-src/                    # Deno edge functions
│   ├── index.ts                 # Main entry point
│   ├── upload.ts                # File upload handler
│   ├── delete.ts                # File deletion handler
│   └── url.ts                   # URL generation handler
│
├── docs/                        # Documentation
│   ├── sql/                     # Database schemas
│   └── guides/                  # Setup guides
│
├── public/                      # Static assets
├── .vscode/                     # VSCode configuration
└── Configuration files:
    ├── next.config.js           # Next.js config
    ├── tailwind.config.js       # Tailwind CSS config
    ├── tsconfig.json            # TypeScript config
    └── components.json          # shadcn/ui config
```

## Key Pages & Features

### [src/pages/index.tsx](src/pages/index.tsx)

- Theme gallery/dashboard
- List user's themes
- Quick actions (create, edit, delete)

### [src/pages/theme-editor.tsx](src/pages/theme-editor.tsx)

- Monaco-based theme editor
- Live preview with [src/components/ThemePreview.tsx](src/components/ThemePreview.tsx)
- File upload via [src/components/ThemeFiles.tsx](src/components/ThemeFiles.tsx)
- Color picker integration

### [src/pages/prepare-nft.tsx](src/pages/prepare-nft.tsx)

- Multi-step NFT metadata wizard
- IPFS upload integration
- Theme selection and image generation
- JSON metadata output

### [src/pages/profile.tsx](src/pages/profile.tsx)

- User profile management
- Blockchain addresses ([src/components/profile/ProfileAddresses.tsx](src/components/profile/ProfileAddresses.tsx))
- DIDs ([src/components/profile/ProfileDIDs.tsx](src/components/profile/ProfileDIDs.tsx))

### [src/pages/admin.tsx](src/pages/admin.tsx)

- Admin-only page (role-based access)
- Uses [src/components/RoleProtected.tsx](src/components/RoleProtected.tsx) for authorization

## Authentication & Authorization

### Authentication Flow

1. User signs in via [src/pages/auth.tsx](src/pages/auth.tsx)
2. Supabase Auth creates JWT token
3. Token stored in localStorage via [src/Contexts/AuthContext.tsx](src/Contexts/AuthContext.tsx)
4. Client includes JWT in requests to edge functions
5. Edge functions validate JWT via `supabase.auth.getUser(jwt)`

### Role-Based Access Control (RBAC)

- Roles stored in `user_profiles.role` column
- Setup guide: [docs/guides/ROLES_GUIDE.md](docs/guides/ROLES_GUIDE.md)
- SQL: [docs/sql/ROLE_SETUP.sql](docs/sql/ROLE_SETUP.sql)
- Component protection: [src/components/RoleProtected.tsx](src/components/RoleProtected.tsx)

## Data Access Patterns

All database operations go through [src/lib/data-access/](src/lib/data-access/):

```typescript
// Example: Fetch user's themes
import { getUserThemes } from "@/lib/data-access/themes";
const themes = await getUserThemes(userId);

// Example: Create new address
import { createAddress } from "@/lib/data-access/addresses";
const address = await createAddress(userId, addressData);
```

**Benefits**:

- Centralized database logic
- Type-safe queries with [src/lib/database.types.ts](src/lib/database.types.ts)
- Easy to mock for testing
- Consistent error handling

## Development Workflow

### Current (Production Connected)

```bash
npm install
npm run dev  # Connects to production Supabase
```

### Future (Local Development)

```bash
# Start local Supabase
supabase start

# Generate types
npm run db:types

# Start Next.js
npm run dev
```

## Testing Strategy

**Current State**: No automated tests

**Recommended Testing Approach**:

1. **Unit Tests**: Core utilities in [src/lib/](src/lib/)
   - Color manipulation ([src/lib/color.ts](src/lib/color.ts))
   - Theme validation ([src/lib/themes.ts](src/lib/themes.ts))
   - NFT metadata generation ([src/lib/nft-metadata.ts](src/lib/nft-metadata.ts))

2. **Integration Tests**: Data access layer
   - Mock Supabase client
   - Test CRUD operations in [src/lib/data-access/](src/lib/data-access/)

3. **E2E Tests**: Critical user flows
   - Create theme → Edit → Save → Publish
   - Prepare NFT → Upload to IPFS → Generate metadata

**Recommended Tools**:

- Jest + React Testing Library (unit/integration)
- Playwright or Cypress (E2E)
- MSW (Mock Service Worker) for API mocking

## Common Tasks

### Generate Database Types

```bash
# Production
npx supabase gen types typescript --project-id vpmlokamxveoskhprxep > src/lib/database.types.ts

# Local (after Phase 1)
npx supabase gen types typescript --local > src/lib/database.types.ts
```

### Add New Database Table

1. Create migration: `supabase migration new add_table_name`
2. Write SQL in `supabase/migrations/`
3. Apply: `supabase db push`
4. Regenerate types (see above)
5. Add data access functions in [src/lib/data-access/](src/lib/data-access/)

### Deploy Edge Function

```bash
# Current (manual)
# Deploy via Supabase dashboard or CLI

# Future (local dev)
supabase functions deploy theme-files
```

### Update Dependencies

```bash
npm update              # Update all packages
npm outdated            # Check for outdated packages
npm run check           # Lint + format + build
```

## Known Issues & Gotchas

### Next.js 16 + React 19

- Uses latest Next.js with Pages Router (not App Router)
- React 19 has breaking changes from React 18
- Some third-party components may have compatibility issues

### Supabase Image Optimization

- [next.config.js](next.config.js) has hardcoded Supabase hostname: `vpmlokamxveoskhprxep.supabase.co`
- Must update this for local development (use `localhost:54321`)

### Edge Functions

- Currently deployed separately from main app
- Uses Deno runtime (different from Node.js)
- [edge-src/deno.json](edge-src/deno.json) and [edge-src/deno.lock](edge-src/deno.lock) manage Deno dependencies

### IPFS Uploads

- Pinata SDK v2.5.1 used in [src/lib/ipfs.ts](src/lib/ipfs.ts)
- Uploads are public by default
- Group management requires separate API calls

## Future Enhancements

### Performance

- [ ] Add React Query for data fetching/caching
- [ ] Implement optimistic UI updates
- [ ] Add service worker for offline support
- [ ] Optimize bundle size (currently ~63 dependencies)

### Features

- [ ] Theme marketplace/sharing
- [ ] Collaborative editing
- [ ] Version control for themes
- [ ] Theme templates library
- [ ] Batch NFT preparation

### Developer Experience

- [ ] Add Storybook for component development
- [ ] Set up automated testing (unit + E2E)
- [ ] Add commit hooks (husky + lint-staged)
- [ ] Create GitHub Actions CI/CD pipeline
- [ ] Add error tracking (Sentry)

### Infrastructure

- [ ] Migrate to App Router (Next.js 13+ feature)
- [ ] Add Redis for session caching
- [ ] Implement rate limiting
- [ ] Add CDN for theme assets
- [ ] Set up staging environment

## Resources

### Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Pages Router](https://nextjs.org/docs/pages)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Pinata Docs](https://docs.pinata.cloud/)

### Related Projects

- [theme-o-rama](https://www.npmjs.com/package/theme-o-rama) - Core theme library
- Theme-a-roo desktop (if exists - link here)

## Contact & Support

- **Repository Issues**: https://github.com/dkackman/theme-a-roo-online/issues
- **Author**: dkackman

---

**Last Updated**: 2026-02-05
**Project Version**: 1.0.0
**Next.js Version**: 16.0.7
**React Version**: 19.2.0
