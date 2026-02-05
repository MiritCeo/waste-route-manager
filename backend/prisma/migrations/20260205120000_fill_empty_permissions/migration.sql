-- Fill empty permissions with defaults based on role
UPDATE `User`
SET permissions = JSON_ARRAY('VIEW_ROUTES', 'COLLECT_WASTE')
WHERE role = 'DRIVER' AND (permissions IS NULL OR JSON_LENGTH(permissions) = 0);

UPDATE `User`
SET permissions = JSON_ARRAY('VIEW_ROUTES', 'COLLECT_WASTE', 'VIEW_STATISTICS')
WHERE role = 'MANAGER' AND (permissions IS NULL OR JSON_LENGTH(permissions) = 0);

UPDATE `User`
SET permissions = JSON_ARRAY(
  'VIEW_ROUTES',
  'COLLECT_WASTE',
  'MANAGE_ROUTES',
  'MANAGE_ADDRESSES',
  'MANAGE_USERS',
  'VIEW_STATISTICS',
  'MANAGE_SETTINGS'
)
WHERE role = 'ADMIN' AND (permissions IS NULL OR JSON_LENGTH(permissions) = 0);
