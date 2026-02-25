import { ContributionType } from '../contributions/models/contribution-type.model';

export async function seedContributionTypes() {
  const contributionTypes = await ContributionType.bulkCreate(
    [
      { name: 'personal_story', description: 'User personal testimony or story' },
      { name: 'article', description: 'Written article or document' },
      { name: 'video', description: 'Video testimony or documentary' },
      { name: 'audio', description: 'Audio recording or oral history' },
      { name: 'image', description: 'Photographs or scanned documents' },
    ] as any[],
    { ignoreDuplicates: true }
  );

  console.log('✅ Contribution Types seeded successfully');

  return contributionTypes;
}
