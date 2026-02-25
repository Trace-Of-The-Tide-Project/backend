import { Trip } from '../trips/models/trip.model';
import { TripStop } from '../trips/models/trip-stop.model';
import { TripParticipant } from '../trips/models/trip-participant.model';
import { User } from '../users/models/user.model';
import { Location } from '../knowledge/models/location.model';

export async function seedTrips() {
  const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
  if (!adminUser) return console.error('❌ No admin user found.');

  const locations = await Location.findAll();
  const jerusalem = locations.find((l) => l.name === 'Jerusalem');
  const acre = locations.find((l) => l.name === 'Acre');
  const haifa = locations.find((l) => l.name === 'Haifa');

  // Trip 1 — published
  const [trip1] = await Trip.findOrCreate({
    where: { title: 'Heritage Walk: Old Jerusalem' },
    defaults: {
      title: 'Heritage Walk: Old Jerusalem',
      description: 'A guided cultural walk through the four quarters of the Old City, exploring centuries of Palestinian heritage and architecture.',
      cover_image: 'jerusalem_walk.jpg',
      category: 'cultural',
      route_summary: 'Jaffa Gate → Christian Quarter → Armenian Quarter → Jewish Quarter → Muslim Quarter',
      start_date: new Date('2026-04-15T08:00:00Z'),
      end_date: new Date('2026-04-15T16:00:00Z'),
      price: 25.0,
      currency: 'USD',
      max_participants: 15,
      status: 'published',
      difficulty: 'moderate',
      duration_hours: 8,
      tags: JSON.stringify(['heritage', 'walking', 'architecture', 'photography']),
      created_by: adminUser.id,
    } as any,
  });

  // Trip 2 — draft
  const [trip2] = await Trip.findOrCreate({
    where: { title: 'Northern Palestine: Acre to Haifa' },
    defaults: {
      title: 'Northern Palestine: Acre to Haifa',
      description: 'A two-day journey exploring the coastal heritage of northern Palestine.',
      cover_image: 'acre_haifa.jpg',
      category: 'historical',
      route_summary: 'Acre → Haifa',
      start_date: new Date('2026-05-10T07:00:00Z'),
      end_date: new Date('2026-05-11T18:00:00Z'),
      price: 75.0,
      currency: 'USD',
      max_participants: 20,
      status: 'draft',
      difficulty: 'easy',
      duration_hours: 16,
      tags: JSON.stringify(['heritage', 'coastal', 'history']),
      created_by: adminUser.id,
    } as any,
  });

  // Stops for Trip 1
  if (jerusalem) {
    const stopsData = [
      { trip_id: trip1.id, location_id: jerusalem.id, stop_order: 1, title: 'Jaffa Gate Gathering Point', description: 'Meet at the historic Jaffa Gate entrance.', duration_minutes: 30 },
      { trip_id: trip1.id, location_id: jerusalem.id, stop_order: 2, title: 'Church of the Holy Sepulchre', description: 'Visit one of the most important religious sites.', duration_minutes: 60 },
      { trip_id: trip1.id, location_id: jerusalem.id, stop_order: 3, title: 'Al-Aqsa Mosque Compound', description: 'Guided tour of the historic mosque and Dome of the Rock.', duration_minutes: 90 },
      { trip_id: trip1.id, location_id: jerusalem.id, stop_order: 4, title: 'Old City Market (Souq)', description: 'Explore the vibrant traditional market.', duration_minutes: 60 },
    ];

    for (const data of stopsData) {
      await TripStop.findOrCreate({
        where: { trip_id: data.trip_id, stop_order: data.stop_order },
        defaults: data as any,
      });
    }
  }

  // Stops for Trip 2
  if (acre && haifa) {
    const stopsData = [
      { trip_id: trip2.id, location_id: acre.id, stop_order: 1, title: 'Acre Old City Tour', description: 'Explore the UNESCO World Heritage site.', duration_minutes: 180 },
      { trip_id: trip2.id, location_id: haifa.id, stop_order: 2, title: 'Haifa Port & German Colony', description: 'Walk through the historic port area.', duration_minutes: 120 },
    ];

    for (const data of stopsData) {
      await TripStop.findOrCreate({
        where: { trip_id: data.trip_id, stop_order: data.stop_order },
        defaults: data as any,
      });
    }
  }

  // Register a participant for Trip 1
  const users = await User.findAll({ limit: 3 });
  for (const user of users) {
    await TripParticipant.findOrCreate({
      where: { trip_id: trip1.id, user_id: user.id },
      defaults: {
        trip_id: trip1.id,
        user_id: user.id,
        status: 'registered',
        role: user.id === adminUser.id ? 'organizer' : 'participant',
        registered_at: new Date(),
      } as any,
    });
  }

  console.log('✅ Trips, Stops, and Participants seeded');
}