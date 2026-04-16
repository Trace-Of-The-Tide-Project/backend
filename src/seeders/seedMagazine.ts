import { Magazine } from '../magazine/models/magazine.model';
import { MagazineIssue } from '../magazine-issue/models/magazine-issue.model';
import { WriterProfile } from '../writer-profile/models/writer-profile.model';
import { BookClubSelection } from '../book-club/models/book-club-selection.model';
import { Article } from '../articles/models/article.model';
import { User } from '../users/models/user.model';

export async function seedMagazine(adminUser: User) {
  console.log('📰 Seeding Magazine (Trace of the Tide)...');

  // ── Magazine ──────────────────────────────────────────────────
  const [magazine] = await Magazine.findOrCreate({
    where: { slug: 'trace-of-the-tide' },
    defaults: {
      slug: 'trace-of-the-tide',
      name: 'Trace of the Tide',
      tagline: 'Stories shaping modern culture',
      description:
        'We believe culture is not a spectacle to be consumed, but a living conversation that shapes how we see, feel, and become. Trace of the Tide is a cultural magazine dedicated to long-form storytelling, diverse voices, and the art of deep inquiry.',
      cover_image: null,
      default_currency: 'USD',
      status: 'live',
      created_by: adminUser.id,
    } as any,
  });

  console.log('  ✓ Magazine created:', magazine.slug);

  // ── Writer Profiles ────────────────────────────────────────────
  const writers = await User.findAll({ limit: 4 });

  const writerData = [
    {
      headline: 'Cultural critic and essayist',
      bio_long: 'Writing at the intersection of memory, politics, and aesthetics for over a decade.',
      featured: true,
      social_links: { twitter: '@writer1' },
    },
    {
      headline: 'Documentary filmmaker and journalist',
      bio_long: 'Covering stories from the margins — voices that resist erasure.',
      featured: true,
      social_links: { instagram: '@writer2' },
    },
    {
      headline: 'Poet and translator',
      bio_long: 'Translating between Arabic and English, and between silence and speech.',
      featured: true,
      social_links: {},
    },
    {
      headline: 'Visual artist and art critic',
      bio_long: 'Exploring how images carry history and how history imagines itself.',
      featured: false,
      social_links: {},
    },
  ];

  for (let i = 0; i < Math.min(writers.length, writerData.length); i++) {
    await WriterProfile.findOrCreate({
      where: { user_id: writers[i].id },
      defaults: {
        user_id: writers[i].id,
        ...writerData[i],
      } as any,
    });
  }

  console.log('  ✓ Writer profiles seeded');

  // ── Magazine Issues ────────────────────────────────────────────

  // Editorial issue (no funding)
  const [editorialIssue] = await MagazineIssue.findOrCreate({
    where: { slug: 'the-quiet-revolution' },
    defaults: {
      magazine_id: magazine.id,
      edition_number: 1,
      title: 'The Quiet Revolution',
      subtitle: 'How culture reshapes the world in silence',
      slug: 'the-quiet-revolution',
      description:
        'An exploration of subtle yet profound shifts in cultural consciousness — the movements that change everything without making noise.',
      kind: 'editorial',
      status: 'published',
      funding_goal: null,
      funding_raised: 0,
      created_by: adminUser.id,
      published_at: new Date('2025-03-01'),
    } as any,
  });

  // Crowdfunded issues
  const crowdfundedIssues = [
    {
      edition_number: 9,
      title: 'Issue 09: Identity & Borders',
      subtitle: 'Identity & Borders',
      slug: 'issue-09-identity-borders',
      description:
        'Exploring the fluid boundaries of belonging, displacement, and cultural memory across communities.',
      funding_goal: 5000,
      funding_raised: 4320,
      status: 'funding',
    },
    {
      edition_number: 10,
      title: 'Issue 10: The Archive',
      subtitle: 'Memory, Documentation & Loss',
      slug: 'issue-10-the-archive',
      description:
        'What does it mean to preserve the past? Who decides what is worth remembering?',
      funding_goal: 4000,
      funding_raised: 3200,
      status: 'funding',
    },
    {
      edition_number: 11,
      title: 'Issue 11: Vernacular',
      subtitle: 'Language as resistance',
      slug: 'issue-11-vernacular',
      description:
        'Dialects, slang, and mother tongues as acts of cultural preservation and political resistance.',
      funding_goal: 3500,
      funding_raised: 900,
      status: 'funding',
    },
    {
      edition_number: 12,
      title: 'Issue 12: The Body Politic',
      subtitle: 'Bodies, power, and visibility',
      slug: 'issue-12-body-politic',
      description:
        'How bodies become sites of political struggle — from representation in media to physical space.',
      funding_goal: 6000,
      funding_raised: 5950,
      status: 'funding',
    },
    {
      edition_number: 8,
      title: 'Issue 08: Sound & Silence',
      subtitle: 'Music, noise, and what goes unheard',
      slug: 'issue-08-sound-silence',
      description:
        'A deep listen to the sonic cultures of displacement — what music carries, what silence protects.',
      funding_goal: 4500,
      funding_raised: 4500,
      status: 'funded',
    },
    {
      edition_number: 7,
      title: 'Issue 07: Craft',
      subtitle: 'Making as a form of knowing',
      slug: 'issue-07-craft',
      description:
        'From weaving to woodwork — the knowledge embedded in traditional craft and its transmission.',
      funding_goal: 3000,
      funding_raised: 3000,
      status: 'funded',
    },
  ];

  for (const issueData of crowdfundedIssues) {
    await MagazineIssue.findOrCreate({
      where: { slug: issueData.slug },
      defaults: {
        magazine_id: magazine.id,
        kind: 'crowdfunded',
        created_by: adminUser.id,
        funding_deadline: new Date('2025-12-31'),
        ...issueData,
      } as any,
    });
  }

  console.log('  ✓ Magazine issues seeded');

  // ── Tag articles with magazine ────────────────────────────────
  const existingArticles = await Article.findAll({ limit: 6 });
  for (let i = 0; i < existingArticles.length; i++) {
    await existingArticles[i].update({
      magazine_id: magazine.id,
      issue_id: editorialIssue.id,
      is_featured: i === 0, // first article is the featured spotlight
    });
  }

  if (existingArticles.length > 0) {
    console.log(`  ✓ Tagged ${existingArticles.length} existing articles with magazine`);
  }

  // ── Book Club Selections ──────────────────────────────────────
  const bookClubData = [
    {
      title: 'Orientalism',
      author_name: 'Edward Said',
      year: 1978,
      blurb: 'A foundational critique of how the West constructs the "Orient" — essential reading for anyone thinking about culture and power.',
      sort_order: 1,
      active: true,
    },
    {
      title: 'Ways of Seeing',
      author_name: 'John Berger',
      year: 1972,
      blurb: 'Seven essays that changed how we look at images, art, and the gaze — still radical 50 years later.',
      sort_order: 2,
      active: true,
    },
    {
      title: 'The Wretched of the Earth',
      author_name: 'Frantz Fanon',
      year: 1961,
      blurb: 'On colonialism, violence, and the psychological dimensions of liberation.',
      sort_order: 3,
      active: true,
    },
    {
      title: 'I Know Why the Caged Bird Sings',
      author_name: 'Maya Angelou',
      year: 1969,
      blurb: 'A memoir about identity, trauma, and the transformative power of literature.',
      sort_order: 4,
      active: true,
    },
  ];

  for (const bookData of bookClubData) {
    await BookClubSelection.findOrCreate({
      where: { magazine_id: magazine.id, title: bookData.title },
      defaults: {
        magazine_id: magazine.id,
        ...bookData,
      } as any,
    });
  }

  console.log('  ✓ Book club selections seeded');
  console.log('✅ Magazine seeding complete\n');

  return magazine;
}
