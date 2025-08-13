import { 
  hasPermission, 
  hasAnyPermission, 
  hasPermissionAction,
  createPermission,
  PERMISSIONS,
  PERMISSION_OBJECTS,
  ACTIONS,
  RESOURCES,
  Permission
} from './permissions';

// Mock user with new permission structure
const mockUser = {
  id: '123',
  username: 'testuser',
  permissions: [
    { action: 'create', resource: 'post' },
    { action: 'read', resource: 'user' },
    { action: 'update', resource: 'asset' }
  ]
};

describe('Permission System', () => {
  test('hasPermission with string format', () => {
    expect(hasPermission(mockUser, 'create post')).toBe(true);
    expect(hasPermission(mockUser, 'delete post')).toBe(false);
    expect(hasPermission(mockUser, 'read user')).toBe(true);
  });

  test('hasPermission with Permission object', () => {
    const createPostPermission = createPermission('create', 'post');
    const deletePostPermission = createPermission('delete', 'post');
    
    expect(hasPermission(mockUser, createPostPermission)).toBe(true);
    expect(hasPermission(mockUser, deletePostPermission)).toBe(false);
  });

  test('hasAnyPermission with mixed formats', () => {
    const permissions = [
      'delete post', // string
      createPermission('read', 'user'), // object
      'update asset' // string
    ];
    
    expect(hasAnyPermission(mockUser, permissions)).toBe(true);
    
    const noMatchPermissions = [
      'delete post',
      'create user'
    ];
    
    expect(hasAnyPermission(mockUser, noMatchPermissions)).toBe(false);
  });

  test('hasPermissionAction', () => {
    expect(hasPermissionAction(mockUser, 'create', 'post')).toBe(true);
    expect(hasPermissionAction(mockUser, 'delete', 'post')).toBe(false);
    expect(hasPermissionAction(mockUser, 'read', 'user')).toBe(true);
  });

  test('PERMISSION_OBJECTS constants work correctly', () => {
    expect(hasPermission(mockUser, PERMISSION_OBJECTS.CREATE_POST)).toBe(true);
    expect(hasPermission(mockUser, PERMISSION_OBJECTS.DELETE_POST)).toBe(false);
    expect(hasPermission(mockUser, PERMISSION_OBJECTS.READ_USER)).toBe(true);
  });

  test('string constants still work', () => {
    expect(hasPermission(mockUser, PERMISSIONS.CREATE_POST)).toBe(true);
    expect(hasPermission(mockUser, PERMISSIONS.DELETE_POST)).toBe(false);
    expect(hasPermission(mockUser, PERMISSIONS.READ_USER)).toBe(true);
  });
});
