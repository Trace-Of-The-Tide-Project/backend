import { UserProfile } from '../users/models/user-profile.model';
import { User } from '../users/models/user.model';

export async function seedUserProfiles(users: User[]) {
  for (const [i, user] of users.entries()) {
    await UserProfile.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        user_id: user.id,
        avatar: `avatar${i + 1}.png`,
        display_name: user.full_name?.split(' ')[0] || user.username,
        birth_date: new Date(`199${i % 10}-01-01`),
        gender: i % 2 === 0 ? 'male' : 'female',
        location: 'Palestine',
        about: `Profile of ${user.username}`,
        social_links: JSON.stringify({ twitter: `@${user.username}` }),
      } as any,
    });
  }

  console.log('✅ User Profiles seeded');
}
