import { UserSettings } from '../author-dashboard/models/user-settings.model';
import { User } from '../users/models/user.model';

export async function seedAuthorDashboard() {
  console.log('👤 Seeding author dashboard data...');

  const users = await User.findAll({
    attributes: ['id', 'email'],
    limit: 10,
  });

  for (const user of users) {
    await UserSettings.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        user_id: user.id,
        notify_article_updates: true,
        notify_new_followers: true,
        notify_new_contributors: true,
        notify_comments: false,
        notify_weekly_digest: true,
        notify_push_browser: true,
        profile_visibility: 'public',
        show_email: true,
        show_activity: false,
        allow_follows: true,
        availability_status: 'available',
      } as any,
    });
  }

  console.log('✅ Author dashboard data seeded');
}
