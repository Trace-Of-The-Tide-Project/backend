import { Follow } from '../follows/models/follow.model';
import { User } from '../users/models/user.model';

export async function seedFollows() {
  const users = await User.findAll({ limit: 8 });
  if (users.length < 4) {
    console.warn('⚠️ Not enough users to seed follows.');
    return;
  }

  // Create a realistic follow graph
  const followsData = [
    // user1 follows admin, editor1, author
    { follower_id: users[4]?.id, following_id: users[0]?.id },
    { follower_id: users[4]?.id, following_id: users[4 + 1]?.id || users[1]?.id },
    // user2 follows admin, user1
    { follower_id: users[5]?.id, following_id: users[0]?.id },
    { follower_id: users[5]?.id, following_id: users[4]?.id },
    // editor1 follows admin
    { follower_id: users[4]?.id, following_id: users[0]?.id },
    // admin follows editor1
    { follower_id: users[0]?.id, following_id: users[4]?.id },
    // user3 follows admin, user1, user2
    { follower_id: users[6]?.id, following_id: users[0]?.id },
    { follower_id: users[6]?.id, following_id: users[4]?.id },
    { follower_id: users[6]?.id, following_id: users[5]?.id },
  ];

  for (const data of followsData) {
    if (data.follower_id && data.following_id && data.follower_id !== data.following_id) {
      await Follow.findOrCreate({
        where: { follower_id: data.follower_id, following_id: data.following_id },
        defaults: data as any,
      });
    }
  }

  console.log('✅ Follows seeded successfully');
}
