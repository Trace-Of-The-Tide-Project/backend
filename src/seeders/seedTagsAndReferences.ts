import { Tag } from '../tags/models/tag.model';
import { ContributionTag } from '../tags/models/contribution-tag.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Reference } from '../references/models/reference.model';

export async function seedTagsAndReferences() {
  await Tag.bulkCreate(
    [
      { name: 'heritage', description: 'Cultural and oral heritage' },
      { name: 'history', description: 'Historical documentation' },
      { name: 'women', description: 'Women and gender narratives' },
      { name: 'audio', description: 'Sound and oral testimonies' },
    ] as any[],
    { ignoreDuplicates: true }
  );

  // Re-fetch tags to get actual IDs (bulkCreate with ignoreDuplicates may not return them)
  const tags = await Tag.findAll({ where: { name: ['heritage', 'history', 'women', 'audio'] } });
  if (tags.length === 0) return console.warn('⚠️ No tags found after seeding.');

  const contributions = await Contribution.findAll({ limit: 2 });
  if (contributions.length < 2) return console.warn('⚠️ Not enough contributions found.');

  const heritageTag = tags.find(t => t.name === 'heritage');
  const historyTag = tags.find(t => t.name === 'history');

  await ContributionTag.bulkCreate(
    [
      { contribution_id: contributions[0].id, tag_id: heritageTag!.id },
      { contribution_id: contributions[1].id, tag_id: historyTag!.id },
    ] as any[],
    { ignoreDuplicates: true }
  );

  await Reference.bulkCreate(
    [
      {
        contribution_id: contributions[0].id,
        title: 'Nakba Oral History Archive',
        type: 'article',
        url: 'https://example.com/nakba-oral-history',
        description: 'Reference to oral testimonies collected in 1948.',
      },
      {
        contribution_id: contributions[1].id,
        title: 'Palestinian Folk Music Study',
        type: 'book',
        url: 'https://example.com/folk-music',
        description: 'Academic study on Palestinian traditional music.',
      },
    ] as any[],
    { ignoreDuplicates: true }
  );

  console.log('✅ Tags, ContributionTags, and References seeded successfully');
}
