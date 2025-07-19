# AI Coding Instructions for Admin Dashboard

## Architecture Overview
This is a **SolidStart admin dashboard** with a microservices backend architecture. The frontend communicates with three separate APIs (Posts, Auth, Assets) via auto-generated OpenAPI clients.

### Key Architectural Patterns

**Route-based Layout System**: Uses SolidStart's file-based routing with nested layouts:
- `(app)` routes require authentication and use the sidebar layout
- `(login)` routes are public and use minimal layout
- Authentication is enforced at the layout level via `appAuthQuery` in `src/routes/(app).tsx`

**Server-First Data Flow**: All data fetching uses SolidStart's `query()` with `"use server"` directive. Follow this pattern:
```tsx
const dataQuery = query(async () => {
  "use server";
  const { data } = await postsClient.GET("/endpoint");
  return data;
}, "queryKey");
```

**Multi-API Client Architecture**: Three separate API clients in `src/lib/client.ts`:
- `postsClient` - Content management
- `authClient` - Authentication/authorization  
- `assetsClient` - File uploads/media

## Development Workflow

**API Client Updates**: Run `bun run update-api-client` to regenerate all OpenAPI clients from environment variable endpoints (`$POSTS_API`, `$AUTH_API`, `$ASSETS_API`). This runs automatically before dev/build/start.

**Component Library**: Uses shadcn/ui components adapted for SolidJS. Add new components with `bun run add-component -- <component-name>`.

**Environment Setup**: Requires `.dev.env` file with API endpoints. Uses Docker Compose for development with external network `techtonic_plates_network`.

## Project-Specific Conventions

**Permission-Based UI**: Components use `hasAnyUserPermission()` patterns from `src/lib/permissions.ts`. Always check permissions before rendering actions:
```tsx
<Show when={hasPermission(user(), PERMISSIONS.CREATE_POST)}>
  <CreateButton />
</Show>
```

**Session Management**: Server-side sessions with JWT/refresh token handling. Use `useAuthSafe()` in components, `useSession()` in server functions. Auth middleware automatically handles token refresh.

**Custom Data Table**: `src/components/ui/data-table.tsx` provides a feature-rich table component with sorting, filtering, and responsive column priorities. Use `Column<T>` interface for type-safe column definitions.

**Alias Patterns**: 
- `$lib` → `src/lib`
- `$components` → `src/components` 
- `$api` → `./.gen` (generated API clients)

**State Management**: Use SolidJS stores for complex state, signals for simple reactive values. Auth state is managed in `src/lib/providers/auth-provider.tsx` with server-side session backing.

## Critical Integration Points

**Authentication Flow**: Login → JWT + refresh token → server session → client auth provider sync. See `src/lib/providers/auth-provider.tsx` for the complete flow.

**Error Boundaries**: Use SolidJS `ErrorBoundary` for data fetching errors, especially around `createAsync()` calls. See `src/routes/(app)/index.tsx` for the pattern.

**Route Protection**: Protected routes use `appAuthQuery` which throws `redirect("/login")` if unauthenticated. Always preload this query in route definitions.
