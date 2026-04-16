import { Role } from '../roles/models/role.model';
import { seedRoles } from './seedRoles';
import { seedUsers } from './seedUsers';
import { seedUserProfiles } from './seedUserProfiles';
import { seedUserRoles } from './seedUserRoles';
import { seedAuthorDashboard } from './seedAuthorDashboard';
import { seedCollections } from './seedCollections';
import { seedContributionTypes } from './seedContributionTypes';
import { seedContributions } from './seedContributions';
import { seedFiles } from './seedFiles';
import { seedCollectionContributions } from './seedCollectionContributions';
import { seedOpenCallsAndParticipants } from './seedOpenCallsAndParticipants';
import { seedDiscussions } from './seedDiscussions';
import { seedComments } from './seedComments';
import { seedReactions } from './seedReactions';
import { seedGroupsAndCollectives } from './seedGroupsAndCollectives';
import { seedLocations } from './seedLocations';
import { seedPeople } from './seedPeople';
import { seedKnowledge } from './seedKnowledge';
import { seedTagsAndReferences } from './seedTagsAndReferences';
import { seedModerationAndNotifications } from './seedModerationAndNotifications';
import { seedPartnersAndDonations } from './seedPartnersAndDonations';
import { seedTrips } from './seedTrips';
import { seedArticles } from './seedArticles';
import { seedCms } from './seedCms';
import { seedSystemSettings } from './seedSystemSettings';
import { seedFinance } from './seedFinance';
import { seedMessaging } from './seedMessaging';
import { seedLogsAndAudits } from './seedLogsAndAudits';
import { seedFollows } from './seedFollows';
import { seedTasks } from './seedTasks';
import { seedPhases } from './seedPhases';
import { seedBoards } from './seedBoards';
import { seedMagazine } from './seedMagazine';

async function cleanDatabase() {
  console.log('🧹 Cleaning database before seeding...');
  const tables = [
    'logs',
    'audit_trails',
    'board_comments',
    'board_chats',
    'board_connectors',
    'board_elements',
    'board_pages',
    'board_members',
    'boards',
    'board_templates',
    'follows',
    'tasks',
    'phases',
    'invoices',
    'fraud_flags',
    'payouts',
    'messages',
    'broadcasts',
    'message_templates',
    'conversations',
    'moderation_logs',
    'notifications',
    'user_badges',
    'reactions',
    'comments',
    'discussions',
    'contribution_tags',
    'references',
    'files',
    'collection_contributions',
    'participants',
    'article_tags',
    'article_blocks',
    'article_contributors',
    'articles',
    'trip_participants',
    'trip_stops',
    'trips',
    'group_members',
    'groups',
    'collective_members',
    'collectives',
    'adventures',
    'knowledge_articles',
    'books',
    'timeline_events',
    'life_events',
    'biographical_cards',
    'person_profiles',
    'locations',
    'partners',
    'donations',
    'page_sections',
    'pages',
    'site_settings',
    'badges',
    'email_templates',
    'open_calls',
    'contributions',
    'contribution_types',
    'collections',
    'user_settings',
    'user_profiles',
    'refresh_tokens',
    'user_roles',
    'users',
    'roles',
    'tags',
    // Magazine feature tables
    'book_reviews',
    'book_club_selections',
    'newsletter_subscribers',
    'issue_pledges',
    'magazine_issues',
    'writer_profiles',
    'magazines',
  ];

  const sequelize = Role.sequelize!;
  for (const table of tables) {
    try {
      await sequelize.query(
        `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`,
      );
    } catch {
      // Table may not exist yet on first run — skip silently
    }
  }
  console.log('✅ Database cleaned\n');
}

export async function seed() {
  try {
    console.log('\n🌱 Starting Database Seeding...\n');

    // ── Phase 0: Clean existing data ───────────────
    await cleanDatabase();

    // ── Phase 1: Core Identity ──────────────────────
    const roles = await seedRoles();
    const users = await seedUsers();
    await seedUserProfiles(users);
    await seedUserRoles(users, roles);
    await seedAuthorDashboard();

    // ── Phase 2: Content Foundation ─────────────────
    const collections = await seedCollections(users[0]);
    const contributionTypes = await seedContributionTypes();
    const contributions = await seedContributions(users[0], contributionTypes);
    await seedFiles(users[0], contributions);
    await seedCollectionContributions(collections, contributions);

    // ── Phase 3: Community Features ─────────────────
    await seedOpenCallsAndParticipants();
    const discussions = await seedDiscussions(users[0], contributions);
    await seedComments(users[0], discussions);
    await seedReactions();
    await seedGroupsAndCollectives();
    await seedFollows();

    // ── Phase 4: Knowledge & Geography ──────────────
    const locations = await seedLocations();
    await seedPeople(locations);
    await seedKnowledge(users[0], locations);

    // ── Phase 5: Metadata & Moderation ──────────────
    await seedTagsAndReferences();
    await seedModerationAndNotifications();
    await seedPartnersAndDonations();

    // ── Phase 6: Feature Modules ────────────────────
    await seedTrips();
    await seedArticles();
    await seedCms();
    await seedMagazine(users[0]);
    await seedSystemSettings();
    await seedTasks();
    await seedPhases();
    await seedBoards();

    // ── Phase 7: Transactional Data ─────────────────
    await seedFinance();
    await seedMessaging();

    // ── Phase 8: Audit Trail (always last) ──────────
    await seedLogsAndAudits();

    console.log('\n🌟 Database seeded successfully — all relations intact.\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  }
}
