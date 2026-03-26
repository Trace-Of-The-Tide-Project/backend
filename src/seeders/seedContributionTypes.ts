import { ContributionType } from '../contributions/models/contribution-type.model';

export async function seedContributionTypes() {
  const typesData = [
    {
      name: 'Personal Story',
      description: 'User personal testimony or story',
    },
    {
      name: 'Testimony',
      description: 'Eyewitness account or formal testimony',
    },
    { name: 'Biography', description: 'Biographical account of a person' },
    {
      name: 'Artwork',
      description: 'Visual art, paintings, illustrations, or sculptures',
    },
    {
      name: 'Music',
      description: 'Musical compositions, recordings, or performances',
    },
    {
      name: 'Literature',
      description: 'Written works — poetry, prose, essays',
    },
    {
      name: 'Photography',
      description: 'Photographs or scanned visual documents',
    },
    {
      name: 'History document',
      description: 'Historical documents, archives, or records',
    },
    { name: 'Other', description: 'Other types of contributions' },
  ];

  const contributionTypes: ContributionType[] = [];
  for (const data of typesData) {
    const [type] = await ContributionType.findOrCreate({
      where: { name: data.name },
      defaults: data as any,
    });
    contributionTypes.push(type);
  }

  console.log('✅ Contribution Types seeded successfully');

  return contributionTypes;
}
