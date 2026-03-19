import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import { User } from '../users/models/user.model';

export async function seedUserRoles(users: User[], roles: Role[]) {
  const roleMap: Record<string, Role> = {};
  roles.forEach((r) => (roleMap[r.name] = r));

  for (const user of users) {
    let assignedRole: Role | undefined;

    if (user.username === 'admin' || user.username === 'admin2') {
      assignedRole = roleMap['admin'];
    } else if (user.username.startsWith('moderator')) {
      assignedRole = roleMap['moderator'];
    } else if (user.username.startsWith('editor')) {
      assignedRole = roleMap['editor'];
    } else if (user.username === 'author') {
      assignedRole = roleMap['author'];
    } else {
      assignedRole = roleMap['user'];
    }

    if (!assignedRole) {
      console.warn(`⚠️ Role not found for user ${user.username}, skipping.`);
      continue;
    }

    await UserRole.findOrCreate({
      where: { user_id: user.id, role_id: assignedRole.id },
      defaults: {
        user_id: user.id,
        role_id: assignedRole.id,
        assigned_at: new Date(),
      } as any,
    });
  }

  console.log('✅ User Roles seeded');
}
