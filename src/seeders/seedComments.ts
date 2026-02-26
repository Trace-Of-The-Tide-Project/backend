import { Comment } from '../comments/models/comment.model';
import { Discussion } from '../discussions/models/discussion.model';
import { User } from '../users/models/user.model';

export async function seedComments(adminUser: User, discussions: Discussion[]) {
  const commentsData = [
    {
      discussion_id: discussions[0].id,
      user_id: adminUser.id,
      content: 'This story deeply resonates with my family\'s experience too.',
      depth: 0,
    },
    {
      discussion_id: discussions[0].id,
      user_id: adminUser.id,
      content: 'Can you share more about the village mentioned?',
      depth: 0,
    },
    {
      discussion_id: discussions[1].id,
      user_id: adminUser.id,
      content: 'We should digitize these songs to preserve them!',
      depth: 0,
    },
  ];

  const comments: Comment[] = [];
  for (const data of commentsData) {
    const [comment] = await Comment.findOrCreate({
      where: {
        discussion_id: data.discussion_id,
        user_id: data.user_id,
        content: data.content,
      },
      defaults: data as any,
    });
    comments.push(comment);
  }

  console.log('✅ Comments seeded');
  return comments;
}