import { CollectionContribution } from '../collections/models/collection-contribution.model';
import { Collection } from '../collections/models/collection.model';
import { Contribution } from '../contributions/models/contribution.model';

export async function seedCollectionContributions(
  collections: Collection[],
  contributions: Contribution[],
) {
  if (!collections.length || !contributions.length) {
    console.log(
      '⚠️ Skipping collection-contributions — no collections or contributions found',
    );
    return;
  }

  // Link first collection to first contribution
  await CollectionContribution.findOrCreate({
    where: {
      collection_id: collections[0].id,
      contribution_id: contributions[0].id,
    },
    defaults: {
      collection_id: collections[0].id,
      contribution_id: contributions[0].id,
      added_at: new Date(),
    } as any,
  });

  // Link second collection to second contribution (if they exist)
  if (collections.length > 1 && contributions.length > 1) {
    await CollectionContribution.findOrCreate({
      where: {
        collection_id: collections[1].id,
        contribution_id: contributions[1].id,
      },
      defaults: {
        collection_id: collections[1].id,
        contribution_id: contributions[1].id,
        added_at: new Date(),
      } as any,
    });
  }

  console.log('✅ Collection-Contributions seeded');
}
