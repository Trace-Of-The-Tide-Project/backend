import { Phase } from '../phases/models/phase.model';
import { Collective } from '../collectives/models/collective.model';

export async function seedPhases() {
  const collective = await Collective.findOne({
    where: { name: 'Palestinian Heritage Collective' },
  });

  if (!collective) {
    console.warn('⚠️ No collective found for phases seeding.');
    return;
  }

  const phasesData = [
    {
      collective_id: collective.id,
      name: 'Research & Planning',
      description: 'Initial research, interviews, and project planning.',
      status: 'completed',
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-03-31'),
      order: 1,
    },
    {
      collective_id: collective.id,
      name: 'Content Collection',
      description:
        'Gathering stories, photographs, and documents from community members.',
      status: 'active',
      start_date: new Date('2025-04-01'),
      end_date: new Date('2025-09-30'),
      order: 2,
    },
    {
      collective_id: collective.id,
      name: 'Curation & Review',
      description:
        'Reviewing, editing, and curating collected materials for publication.',
      status: 'planned',
      start_date: new Date('2025-10-01'),
      end_date: new Date('2026-01-31'),
      order: 3,
    },
    {
      collective_id: collective.id,
      name: 'Publication & Exhibition',
      description:
        'Publishing curated content online and organizing a physical exhibition.',
      status: 'planned',
      start_date: new Date('2026-02-01'),
      end_date: new Date('2026-06-30'),
      order: 4,
    },
  ];

  for (const data of phasesData) {
    await Phase.findOrCreate({
      where: { collective_id: data.collective_id, name: data.name },
      defaults: data as any,
    });
  }

  console.log('✅ Phases seeded successfully');
}
