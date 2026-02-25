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
    const groups = await Group.bulkCreate([
        {
            name: 'Oral History Contributors',
            description: 'Members contributing oral history materials.',
            created_by: adminUser.id,
            created_at: new Date(),
        },
        {
            name: 'Heritage Writers',
            description: 'Writers documenting cultural heritage stories.',
            created_by: adminUser.id,
            created_at: new Date(),
        },
    ] as any);

    // Group Members
    await GroupMember.bulkCreate([
        {
            group_id: groups[0].id,
            user_id: adminUser.id,
            role: 'admin',
            joined_at: new Date(),
        },
        {
            group_id: groups[1].id,
            user_id: adminUser.id,
            role: 'member',
            joined_at: new Date(),
        },
    ] as any);

    // Collectives
    const collectives = await Collective.bulkCreate([
        {
            name: 'Palestinian Heritage Collective',
            description: 'A collective of historians and researchers preserving Palestinian heritage.',
            created_by: adminUser.id,
            created_at: new Date(),
        },
        {
            name: 'Diaspora Voices',
            description: 'Collective focusing on stories of Palestinian diaspora communities.',
            created_by: adminUser.id,
            created_at: new Date(),
        },
    ] as any);

    // Collective Members
    await CollectiveMember.bulkCreate([
        {
            collective_id: collectives[0].id,
            user_id: adminUser.id,
            role: 'founder',
            joined_at: new Date(),
        },
        {
            collective_id: collectives[1].id,
            user_id: adminUser.id,
            role: 'member',
            joined_at: new Date(),
        },
    ] as any);

    console.log('✅ Groups & Collectives seeded successfully.');
}
