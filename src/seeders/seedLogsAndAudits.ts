import { Log } from '../logs/models/log.model';
import { AuditTrail } from '../audit-trails/models/audit-trail.model';
import { User } from '../users/models/user.model';

export async function seedLogsAndAudits() {
  const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
  if (!adminUser) {
    console.error('❌ No admin user found. Please seed users first.');
    return;
  }

  // Logs
  const logsData = [
    { user_id: adminUser.id, action: 'LOGIN', entity_type: 'User', entity_id: adminUser.id, details: 'Admin logged into the system' },
    { user_id: adminUser.id, action: 'CREATE_COLLECTION', entity_type: 'Collection', entity_id: '00000000-0000-0000-0000-000000000001', details: 'Created Nakba 1948 collection' },
  ];

  for (const data of logsData) {
    await Log.findOrCreate({
      where: { user_id: data.user_id, action: data.action, entity_type: data.entity_type },
      defaults: data as any,
    });
  }

  // Audit Trails
  const auditsData = [
    { user_id: adminUser.id, action: 'UPDATE_CONTRIBUTION', entity_type: 'Contribution', entity_id: '00000000-0000-0000-0000-000000000002', changes: JSON.stringify({ status: ['pending_review', 'approved'] }) },
    { user_id: adminUser.id, action: 'DELETE_FILE', entity_type: 'File', entity_id: '00000000-0000-0000-0000-000000000003', changes: JSON.stringify({ deleted: true }) },
  ];

  for (const data of auditsData) {
    await AuditTrail.findOrCreate({
      where: { user_id: data.user_id, action: data.action, entity_type: data.entity_type },
      defaults: data as any,
    });
  }

  console.log('✅ Logs and Audit Trails seeded');
}