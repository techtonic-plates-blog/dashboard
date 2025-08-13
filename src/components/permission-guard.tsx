import { JSX, Show } from "solid-js";
import { User } from "~/lib/providers/auth-provider";
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission } from "~/lib/permissions";

export interface PermissionGuardProps {
  children: JSX.Element;
  user: User | null;
  
  // Use one of these permission check options:
  permission?: Permission; // Check for a single specific permission
  permissions?: Permission[]; // Check if user has ANY of these permissions
  allPermissions?: Permission[]; // Check if user has ALL of these permissions
  customCheck?: (user: User | null) => boolean; // Custom permission logic
  
  // Optional fallback content when permission is denied
  fallback?: JSX.Element;
}

/**
 * PermissionGuard - Conditionally renders children based on user permissions
 * 
 * @param permission - Single permission to check for (Permission object only)
 * @param permissions - Array of permissions (user needs ANY of them)
 * @param allPermissions - Array of permissions (user needs ALL of them)
 * @param customCheck - Custom function for complex permission logic
 * @param fallback - Optional content to show when permission is denied
 * @param children - Content to show when permission is granted
 * @param user - User object to check permissions against
 * 
 * @example
 * // Check for single permission using Permission object
 * <PermissionGuard user={user} permission={PERMISSION_OBJECTS.CREATE_POST}>
 *   <button>Create Post</button>
 * </PermissionGuard>
 * 
 * @example
 * // Check for any of multiple permissions using objects
 * <PermissionGuard user={user} permissions={[PERMISSION_OBJECTS.CREATE_POST, PERMISSION_OBJECTS.UPDATE_POST]}>
 *   <PostEditor />
 * </PermissionGuard>
 * 
 * @example
 * // Check for all required permissions
 * <PermissionGuard user={user} allPermissions={[PERMISSION_OBJECTS.CREATE_POST, PERMISSION_OBJECTS.DELETE_POST]}>
 *   <AdminPostEditor />
 * </PermissionGuard>
 * 
 * @example
 * // Custom permission logic
 * <PermissionGuard 
 *   user={user} 
 *   customCheck={(user) => user?.username === "admin"}
 *   fallback={<div>Access denied</div>}
 * >
 *   <AdminPanel />
 * </PermissionGuard>
 */
export default function PermissionGuard(props: PermissionGuardProps) {
  const hasAccess = () => {
    // Custom check takes precedence
    if (props.customCheck) {
      return props.customCheck(props.user);
    }
    
    // Check for all required permissions
    if (props.allPermissions) {
      return hasAllPermissions(props.user, props.allPermissions);
    }
    
    // Check for any of the provided permissions
    if (props.permissions) {
      return hasAnyPermission(props.user, props.permissions);
    }
    
    // Check for single permission
    if (props.permission) {
      return hasPermission(props.user, props.permission);
    }
    
    // If no permission checks are specified, deny access
    return false;
  };

  return (
    <Show when={hasAccess()} fallback={props.fallback}>
      {props.children}
    </Show>
  );
}
