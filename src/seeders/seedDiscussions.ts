import { Discussion } from '../discussions/models/discussion.model';
import { User } from '../users/models/user.model';
import { Contribution } from '../contributions/models/contribution.model';

export async function seedDiscussions(adminUser: User, contributions: Contribution[]) {
  const discussionsData = [
    {
      title: 'Impact of 1948 on Family Stories',
      description: 'Discussing collective memories and narratives after the 1948 displacement.',
      created_by: adminUser.id,
      related_contribution_id: contributions[0]?.id,
      status: 'open',
    },
    {
      title: 'Preserving Traditional Music',
      description: 'Exploring the importance of oral heritage and folk songs.',
      created_by: adminUser.id,
      related_contribution_id: contributions[1]?.id,
      status: 'open',
    },
  ];

  const discussions: Discussion[] = [];
  for (const data of discussionsData) {
    const [discussion] = await Discussion.findOrCreate({
      where: { title: data.title, created_by: data.created_by },
      defaults: data as any,
    });
    discussions.push(discussion);
  }

  console.log('✅ Discussions seeded');
  return discussions;
}