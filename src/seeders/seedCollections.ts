import { Collection } from '../collections/models/collection.model';
import { User } from '../users/models/user.model';

export async function seedCollections(adminUser: User) {
  const collections = await Collection.bulkCreate(
    [
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
    ] as any[],
    { ignoreDuplicates: true }
  );


  console.log('✅ Collections seeded successfully');

  return collections;
}
