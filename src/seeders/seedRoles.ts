import { Role } from '../roles/models/role.model';

export async function seedRoles() {
  const roleNames = [
    { name: 'admin', description: 'System administrator' },
    { name: 'user', description: 'Normal user' },
    { name: 'editor', description: 'Content editor' },
    { name: 'author', description: 'Content author' },
    { name: 'contributor', description: 'Content contributor' },
    { name: 'moderator', description: 'Content moderator' },
    { name: 'manager', description: 'Team manager' },
    { name: 'artist', description: 'Artist / creative practitioner' },
  ];

  const roles: Role[] = [];
  for (const data of roleNames) {
    const [role] = await Role.findOrCreate({
      where: { name: data.name },
      defaults: data as any,
    });
    roles.push(role);
  }

  console.log(`✅ Roles seeded (${roles.length} total)`);
  return roles;
}
