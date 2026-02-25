import { OpenCall } from '../open call/models/open-call.model';
import { Participant } from '../open call/models/participant.model';
import { Contribution } from '../contributions/models/contribution.model';
import { User } from '../users/models/user.model';

export async function seedOpenCallsAndParticipants() {
  console.log('🚀 Starting Open Calls seeding...');

  const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });

  if (!adminUser) {
    console.error('❌ No admin user found. Please seed users first.');
    return;
  }

  const openCalls = await OpenCall.bulkCreate(
    [
      {
        title: 'Oral History of 1967',
        description: 'Collecting testimonies and documents from 1967 war.',
        category: 'historical',
        timeline_start: new Date('2025-01-01'),
        timeline_end: new Date('2025-12-31'),
        created_by: adminUser.id,
        status: 'open',
      },
      {
        title: 'Women in Heritage',
        description: 'Stories of women preserving cultural traditions.',
        category: 'cultural',
        timeline_start: new Date('2025-03-01'),
        timeline_end: new Date('2025-09-30'),
        created_by: adminUser.id,
        status: 'open',
      },
    ] as any[],
    { ignoreDuplicates: true }
  );


  const contributions = await Contribution.findAll({ limit: 2 });

  const participants = await Participant.bulkCreate(
    [
      {
        user_id: adminUser.id,
        open_call_id: openCalls[0].id,
        role: 'contributor',
        contribution_id: contributions[0]?.id || null,
        join_date: new Date(),
        status: 'joined',
      },
      {
        user_id: adminUser.id,
        open_call_id: openCalls[1].id,
        role: 'reviewer',
        contribution_id: contributions[1]?.id || null,
        join_date: new Date(),
        status: 'joined',
      },
    ] as any[]
  );

  console.log('✅ Open Calls and Participants seeded successfully');

}
