import { Comment } from '../comments/models/comment.model';
import { Discussion } from '../discussions/models/discussion.model';
import { User } from '../users/models/user.model';

export async function seedComments(adminUser: User, discussions: Discussion[]) {
  const comments = await Comment.bulkCreate(
    [
      {
        discussion_id: discussions[0].id,
        user_id: adminUser.id,
        content: 'This story deeply resonates with my family’s experience too.',
        depth: 0,
      },
      {
        discussion_id: discussions[0].id,
        user_id: adminUser.id,
        content: 'Can you share more about the village mentioned?',
        parent_comment_id: null,
        depth: 0,
      },
      {
        discussion_id: discussions[1].id,
        user_id: adminUser.id,
        content: 'We should digitize these songs to preserve them!',
        depth: 0,
      },
    ] as any[]
  );

  console.log('✅ Discussions and Comments seeded successfully.');

  return comments;
}
