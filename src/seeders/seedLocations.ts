import { Location } from '../knowledge/models/location.model';
import { User } from '../users/models/user.model';

export async function seedLocations() {
  console.log('📍 Starting Locations seeding...');

  // Get the admin user who owns the seed data
  const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
  if (!adminUser) {
    console.error('❌ No admin user found. Please seed users first.');
    return [];
  }

  // Create meaningful heritage locations
  const locations = await Location.bulkCreate(
    [
      {
        name: 'Acre',
        description: 'Ancient coastal city in northern Palestine, known for its rich history and resistance.',
        latitude: 32.9234,
        longitude: 35.0826,
        address: 'Acre, Palestine',
        created_by: adminUser.id,
      },
      {
        name: 'Gaza City',
        description: 'One of the oldest cities in the world, and a major center of Palestinian heritage.',
        latitude: 31.5,
        longitude: 34.4667,
        address: 'Gaza, Palestine',
        created_by: adminUser.id,
      },
      {
        name: 'Jerusalem',
        description: 'Historic and spiritual capital of Palestine, rich with religious and cultural landmarks.',
        latitude: 31.7683,
        longitude: 35.2137,
        address: 'Jerusalem, Palestine',
        created_by: adminUser.id,
      },
      {
        name: 'Beirut',
        description: 'City in Lebanon with historical ties to Palestinian diaspora and cultural movements.',
        latitude: 33.8938,
        longitude: 35.5018,
        address: 'Beirut, Lebanon',
        created_by: adminUser.id,
      },
      {
        name: 'Haifa',
        description: 'Port city known for its diverse communities and role in Palestinian urban life before 1948.',
        latitude: 32.794,
        longitude: 34.9896,
        address: 'Haifa, Palestine',
        created_by: adminUser.id,
      },
    ] as any[],
    { ignoreDuplicates: true }
  );

  console.log(`✅ ${locations.length} Locations seeded successfully`);
  return locations;
}
