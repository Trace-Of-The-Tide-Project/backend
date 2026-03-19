import { Reaction } from '../reactions/models/reaction.model';
import { Comment } from '../comments/models/comment.model';
import { User } from '../users/models/user.model';

export async function seedReactions() {
  console.log('🚀 Starting Reactions seeding...');

  const adminUser = await User.findOne({
    where: { email: 'admin@example.com' },
  });
  if (!adminUser) {
    console.error('❌ No admin user found. Please seed users first.');
    return;
  }

  const comments = await Comment.findAll({ limit: 5 });
  if (!comments || comments.length === 0) {
    console.warn('⚠️ No comments found — skipping reactions seeding.');
    return;
  }

  await Reaction.bulkCreate(
    [
      {
        user_id: adminUser.id,
        comment_id: comments[0].id,
        type: 'like',
        created_at: new Date(),
      },
      {
        user_id: adminUser.id,
        comment_id: comments[1]?.id || comments[0].id,
        type: 'love',
        created_at: new Date(),
      },
      {
        user_id: adminUser.id,
        comment_id: comments[2]?.id || comments[0].id,
        type: 'insightful',
        created_at: new Date(),
      },
    ] as any[],
    { ignoreDuplicates: true },
  );

  console.log('✅ Reactions seeded successfully');
}
