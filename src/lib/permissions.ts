import { User } from "./providers/auth-provider";

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  return permissions.some(permission => user.permissions.includes(permission));
}

// Define permission constants for easier maintenance
export const PERMISSIONS = {
  // Post permissions
  CREATE_POST: 'create post',
  UPDATE_POST: 'update post',
  DELETE_POST: 'delete post',
  
  // User permissions
  GET_USER: 'get user',
  CREATE_USER: 'create user',
  UPDATE_USER: 'update user',
  DELETE_USER: 'delete user',
  
  // Permission management permissions
  CREATE_PERMISSION: 'create permission',
  DELETE_PERMISSION: 'delete permission',
  ASSIGN_PERMISSION: 'assign permission'
} as const;

// Helper functions for checking groups of related permissions
export function hasAnyPostPermission(user: User | null): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.CREATE_POST,
    PERMISSIONS.UPDATE_POST,
    PERMISSIONS.DELETE_POST
  ]);
}

export function hasAnyUserPermission(user: User | null): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.GET_USER,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER
  ]);
}

export function hasAnyPermissionManagementPermission(user: User | null): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.CREATE_PERMISSION,
    PERMISSIONS.DELETE_PERMISSION,
    PERMISSIONS.ASSIGN_PERMISSION
  ]);
}
