import { User } from "./providers/auth-provider";

// Permission object structure that matches the backend
export interface Permission {
  action: string;
  resource: string;
}

// Helper function to create a permission object
export function createPermission(action: string, resource: string): Permission {
  return { action, resource };
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  // Check if user has the permission by matching action and resource
  return user.permissions.some(p => 
    p.action === permission.action && p.resource === permission.resource
  );
}

export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  return permissions.some(permission => hasPermission(user, permission));
}

// Check if user has specific action on specific resource
export function hasPermissionAction(user: User | null, action: string, resource: string): boolean {
  return hasPermission(user, createPermission(action, resource));
}

// Check if user has any of the specified actions on a resource
export function hasAnyPermissionAction(user: User | null, actions: string[], resource: string): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  return actions.some(action => hasPermissionAction(user, action, resource));
}

// Check if user has specific action on any resource
export function hasActionOnAnyResource(user: User | null, action: string): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  return user.permissions.some(p => p.action === action);
}

// Check if user has any action on specific resource
export function hasAnyActionOnResource(user: User | null, resource: string): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  return user.permissions.some(p => p.resource === resource);
}

// Check if user has all required permissions
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  return permissions.every(permission => hasPermission(user, permission));
}

// Define action constants for the new permission system (CRUD operations)
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read', 
  UPDATE: 'update',
  DELETE: 'delete'
} as const;

// Define resource constants for the new permission system
export const RESOURCES = {
  POST: 'post',
  USER: 'user', 
  PERMISSION: 'permission',
  ASSET: 'asset'
} as const;

// Object-based permission constants for more structured access
export const PERMISSION_OBJECTS = {
  // Post permissions
  CREATE_POST: createPermission(ACTIONS.CREATE, RESOURCES.POST),
  READ_POST: createPermission(ACTIONS.READ, RESOURCES.POST),
  UPDATE_POST: createPermission(ACTIONS.UPDATE, RESOURCES.POST),
  DELETE_POST: createPermission(ACTIONS.DELETE, RESOURCES.POST),
  
  // User permissions
  READ_USER: createPermission(ACTIONS.READ, RESOURCES.USER),
  CREATE_USER: createPermission(ACTIONS.CREATE, RESOURCES.USER),
  UPDATE_USER: createPermission(ACTIONS.UPDATE, RESOURCES.USER),
  DELETE_USER: createPermission(ACTIONS.DELETE, RESOURCES.USER),
  
  // Permission management permissions
  CREATE_PERMISSION: createPermission(ACTIONS.CREATE, RESOURCES.PERMISSION),
  READ_PERMISSION: createPermission(ACTIONS.READ, RESOURCES.PERMISSION),
  UPDATE_PERMISSION: createPermission(ACTIONS.UPDATE, RESOURCES.PERMISSION),
  DELETE_PERMISSION: createPermission(ACTIONS.DELETE, RESOURCES.PERMISSION),
  
  // Asset permissions
  CREATE_ASSET: createPermission(ACTIONS.CREATE, RESOURCES.ASSET),
  READ_ASSET: createPermission(ACTIONS.READ, RESOURCES.ASSET),
  UPDATE_ASSET: createPermission(ACTIONS.UPDATE, RESOURCES.ASSET),
  DELETE_ASSET: createPermission(ACTIONS.DELETE, RESOURCES.ASSET)
} as const;
