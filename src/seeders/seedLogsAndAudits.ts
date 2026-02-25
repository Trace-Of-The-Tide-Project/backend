import { Log } from '../logs/models/log.model';
import { AuditTrail } from '../audit-trails/models/audit-trail.model';
import { User } from '../users/models/user.model';

export async function seedLogsAndAudits() {
  const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
  if (!adminUser) {
    console.error('❌ No admin user found. Please seed users first.');
    return;
  }

  await Log.bulkCreate([
    {
      user_id: adminUser.id,
      action: 'LOGIN',
      entity_type: 'User',
      entity_id: adminUser.id,
      details: 'Admin logged into the system',
    },
    {
      user_id: adminUser.id,
      action: 'CREATE_COLLECTION',
      entity_type: 'Collection',
      entity_id: '00000000-0000-0000-0000-000000000001', // dummy UUID
      details: 'Created Nakba 1948 collection',
    },
  ] as any[]);

  await AuditTrail.bulkCreate([
    {
      user_id: adminUser.id,
      action: 'UPDATE_CONTRIBUTION',
      entity_type: 'Contribution',
      entity_id: '00000000-0000-0000-0000-000000000002', // dummy UUID
      changes: JSON.stringify({ status: ['pending_review', 'approved'] }),
    },
    {
      user_id: adminUser.id,
      action: 'DELETE_FILE',
      entity_type: 'File',
      entity_id: '00000000-0000-0000-0000-000000000003', // dummy UUID
      changes: JSON.stringify({ deleted: true }),
    },
  ] as any[]);

  console.log('✅ Logs and Audit Trails seeded successfully');
}
