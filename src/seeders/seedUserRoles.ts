import { UserRole } from '../users/models/user-role.model';
import { Role } from '../roles/models/role.model';
import { User } from '../users/models/user.model';

export async function seedUserRoles(users: User[], roles: Role[]) {
  const roleMap: Record<string, Role> = {};
  roles.forEach((r) => (roleMap[r.name] = r));

  await Promise.all(
    users.map((user) => {
      let assignedRole: Role | undefined;

      if (user.username === 'admin') assignedRole = roleMap['admin'];
      else if (user.username.startsWith('moderator')) assignedRole = roleMap['moderator'];
      else if (user.username.startsWith('editor')) assignedRole = roleMap['editor'];
      else assignedRole = roleMap['user'];

      if (!assignedRole) {
        console.warn(`⚠️ Role not found for user ${user.username}, skipping role assignment.`);
        return;
      }

      return UserRole.create({
        user_id: user.id,
        role_id: assignedRole.id,
        assigned_at: new Date(),
      } as any);
    })
  );

  console.log('✅ User Roles seeded successfully');
}
