import { Contribution } from '../contributions/models/contribution.model';
import { ContributionType } from '../contributions/models/contribution-type.model';
import { User } from '../users/models/user.model';

export async function seedContributions(adminUser: User, contributionTypes: ContributionType[]) {
  const storyType = contributionTypes.find((t) => t.name === 'personal_story');
  const audioType = contributionTypes.find((t) => t.name === 'audio');

  const contributionsData = [
    {
      title: 'My Family Story',
      description: 'Testimony about 1948 displacement.',
      type_id: storyType?.id,
      status: 'pending',
      user_id: adminUser.id,
      submission_date: new Date(),
    },
    {
      title: 'Traditional Music',
      description: 'Audio recording of folk songs.',
      type_id: audioType?.id,
      status: 'published',
      user_id: adminUser.id,
      submission_date: new Date(),
    },
  ];

  const contributions: Contribution[] = [];
  for (const data of contributionsData) {
    const [contrib] = await Contribution.findOrCreate({
      where: { title: data.title, user_id: data.user_id },
      defaults: data as any,
    });
    contributions.push(contrib);
  }

  console.log('✅ Contributions seeded');
  return contributions;
}