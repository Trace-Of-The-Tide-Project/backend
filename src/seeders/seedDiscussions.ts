import { Discussion } from '../discussions/models/discussion.model';
import { User } from '../users/models/user.model';
import { Contribution } from '../contributions/models/contribution.model';

export async function seedDiscussions(adminUser: User, contributions: Contribution[]) {
  const discussions = await Discussion.bulkCreate(
    [
      {
        title: 'Impact of 1948 on Family Stories',
        description: 'Discussing collective memories and narratives after the 1948 displacement.',
        created_by: adminUser.id,
        related_contribution_id: contributions[0]?.id,
      },
      {
        title: 'Preserving Traditional Music',
        description: 'Exploring the importance of oral heritage and folk songs.',
        created_by: adminUser.id,
        related_contribution_id: contributions[1]?.id,
      },
    ] as any[]
  );

  return discussions;
}
