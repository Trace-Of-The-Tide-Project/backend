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

export async function seed() {
  try {
    console.log('\n🌱 Starting Database Seeding...\n');

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
    await seedSystemSettings();

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