import { PersonProfile } from '../person/models/person-profile.model';
import { BiographicalCard } from '../person/models/biographical-card.model';
import { LifeEvent } from '../person/models/life-event.model';
import { TimelineEvent } from '../person/models/timeline-event.model';
import { User } from '../users/models/user.model';
import { Contribution } from '../contributions/models/contribution.model';
import { Location } from '../knowledge/models/location.model';

export async function seedPeople(locations: Location[] = []) {
  const adminUser = await User.findOne({
    where: { email: 'admin@example.com' },
  });
  if (!adminUser) {
    console.error('❌ No admin user found. Please seed users first.');
    return;
  }

  const contribution = await Contribution.findOne();
  if (!contribution) {
    console.error('❌ No contribution found. Please seed contributions first.');
    return;
  }

  // Create profile
  const [profile] = await PersonProfile.findOrCreate({
    where: { full_name: 'Ghassan Kanafani' },
    defaults: {
      full_name: 'Ghassan Kanafani',
      birth_date: new Date('1936-04-09'),
      death_date: new Date('1972-07-08'),
      biography:
        'Palestinian writer, political activist, and leading member of the PFLP.',
      created_by: adminUser.id,
    } as any,
  });

  // Create biographical card
  await BiographicalCard.findOrCreate({
    where: { person_profile_id: profile.id },
    defaults: {
      person_profile_id: profile.id,
      summary: 'Revolutionary writer and voice of resistance.',
      image: 'kanafani.jpg',
      created_by: adminUser.id,
    } as any,
  });

  const acre = locations.find((l) => l.name === 'Acre');
  const beirut = locations.find((l) => l.name === 'Beirut');

  // Create life events
  const lifeEventsData = [
    {
      person_profile_id: profile.id,
      title: 'Birth in Acre',
      description: 'Born in Acre, Palestine.',
      event_date: new Date('1936-04-09'),
      location_id: acre?.id || null,
      created_by: adminUser.id,
    },
    {
      person_profile_id: profile.id,
      title: 'Assassination',
      description: 'Killed in Beirut by a car bomb.',
      event_date: new Date('1972-07-08'),
      location_id: beirut?.id || null,
      created_by: adminUser.id,
    },
  ];

  for (const data of lifeEventsData) {
    await LifeEvent.findOrCreate({
      where: { person_profile_id: data.person_profile_id, title: data.title },
      defaults: data as any,
    });
  }

  // Create timeline event
  await TimelineEvent.findOrCreate({
    where: {
      title: 'Publication of "Men in the Sun"',
      related_person_id: profile.id,
    },
    defaults: {
      title: 'Publication of "Men in the Sun"',
      description: 'Published his iconic novel in 1963.',
      event_date: new Date('1963-01-01'),
      related_person_id: profile.id,
      related_contribution_id: contribution?.id || null,
      created_by: adminUser.id,
    } as any,
  });

  console.log(
    '✅ People, Biographical Cards, Life Events, and Timeline Events seeded',
  );
}
