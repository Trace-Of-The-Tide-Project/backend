import { Collection } from '../collections/models/collection.model';
import { User } from '../users/models/user.model';

export async function seedCollections(adminUser: User) {
  const data = [
    {
      name: 'Nakba 1948',
      description: 'Testimonies and documents from 1948',
      cover_image: 'nakba.jpg',
      created_by: adminUser.id,
      created_date: new Date(),
    },
    {
      name: 'Cultural Heritage',
      description: 'Stories about cultural heritage',
      cover_image: 'heritage.jpg',
      created_by: adminUser.id,
      created_date: new Date(),
    },
  ];

  const collections: Collection[] = [];
  for (const item of data) {
    const [record] = await Collection.findOrCreate({
      where: { name: item.name },
      defaults: item as any,
    });
    collections.push(record);
  }

  console.log('✅ Collections seeded successfully');

  return collections;
}
