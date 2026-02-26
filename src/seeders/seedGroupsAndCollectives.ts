import { Group } from '../groups/models/group.model';
import { GroupMember } from '../groups/models/group-member.model';
import { Collective } from '../collectives/models/collective.model';
import { CollectiveMember } from '../collectives/models/collective-member.model';
import { User } from '../users/models/user.model';

export async function seedGroupsAndCollectives() {
  console.log('🚀 Seeding Groups & Collectives...');

  const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
  if (!adminUser) {
    console.error('❌ Admin user not found — seed users first.');
    return;
  }

  // Groups
  const groupsData = [
    { name: 'Oral History Contributors', description: 'Members contributing oral history materials.', created_by: adminUser.id },
    { name: 'Heritage Writers', description: 'Writers documenting cultural heritage stories.', created_by: adminUser.id },
  ];

  const groups: Group[] = [];
  for (const data of groupsData) {
    const [group] = await Group.findOrCreate({
      where: { name: data.name },
      defaults: data as any,
    });
    groups.push(group);
  }

  // Group Members
  for (const group of groups) {
    await GroupMember.findOrCreate({
      where: { group_id: group.id, user_id: adminUser.id },
      defaults: {
        group_id: group.id,
        user_id: adminUser.id,
        role: group.name.includes('Oral') ? 'admin' : 'member',
        joined_at: new Date(),
      } as any,
    });
  }

  // Collectives
  const collectivesData = [
    { name: 'Palestinian Heritage Collective', description: 'A collective of historians and researchers preserving Palestinian heritage.', created_by: adminUser.id },
    { name: 'Diaspora Voices', description: 'Collective focusing on stories of Palestinian diaspora communities.', created_by: adminUser.id },
  ];

  const collectives: Collective[] = [];
  for (const data of collectivesData) {
    const [collective] = await Collective.findOrCreate({
      where: { name: data.name },
      defaults: data as any,
    });
    collectives.push(collective);
  }

  // Collective Members
  for (const [i, collective] of collectives.entries()) {
    await CollectiveMember.findOrCreate({
      where: { collective_id: collective.id, user_id: adminUser.id },
      defaults: {
        collective_id: collective.id,
        user_id: adminUser.id,
        role: i === 0 ? 'founder' : 'member',
        joined_at: new Date(),
      } as any,
    });
  }

  console.log('✅ Groups & Collectives seeded');
}