import { Tag } from '../tags/models/tag.model';
import { ContributionTag } from '../tags/models/contribution-tag.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Reference } from '../references/models/reference.model';

export async function seedTagsAndReferences() {
  const tags = await Tag.bulkCreate(
    [
      { name: 'heritage', description: 'Cultural and oral heritage' },
      { name: 'history', description: 'Historical documentation' },
      { name: 'women', description: 'Women and gender narratives' },
      { name: 'audio', description: 'Sound and oral testimonies' },
    ] as any[],
    { ignoreDuplicates: true }
  );

  const contributions = await Contribution.findAll({ limit: 2 });
  if (contributions.length === 0) return console.warn('⚠️ No contributions found.');

  await ContributionTag.bulkCreate(
    [
      { contribution_id: contributions[0].id, tag_id: tags[0].id },
      { contribution_id: contributions[1].id, tag_id: tags[1].id },
    ] as any[]
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
    ] as any[]
  );

  console.log('✅ Tags, ContributionTags, and References seeded successfully');
}
