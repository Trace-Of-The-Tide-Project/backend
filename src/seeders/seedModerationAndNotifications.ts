import { Notification } from '../notifications/models/notification.model';
import { ModerationLog } from '../moderation/models/moderation-log.model';
import { User } from '../users/models/user.model';
import { Contribution } from '../contributions/models/contribution.model';

export async function seedModerationAndNotifications() {
  const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
  const contributions = await Contribution.findAll({ limit: 2 });

  if (!adminUser || contributions.length === 0) {
    console.warn('⚠️ Missing users or contributions for seeding moderation/notifications.');
    return;
  }

  await Notification.bulkCreate(
    [
      {
        user_id: adminUser.id,
        message: 'Your contribution "My Family Story" has been approved!',
        type: 'review',
        status: 'unread',
      },
      {
        user_id: adminUser.id,
        message: 'New open call available: "Women in Heritage".',
        type: 'system',
        status: 'unread',
      },
    ] as any[],
  );

  await ModerationLog.bulkCreate(
    [
      {
        contribution_id: contributions[0].id,
        reviewer_id: adminUser.id,
        action: 'approved',
        reason: 'High-quality and historically verified content.',
      },
      {
        contribution_id: contributions[1].id,
        reviewer_id: adminUser.id,
        action: 'flagged',
        reason: 'Audio missing transcript; needs review.',
      },
    ] as any[],
  );

  console.log('✅ Notifications and Moderation Logs seeded successfully');
}
