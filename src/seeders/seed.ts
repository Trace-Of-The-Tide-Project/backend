import { seedRoles } from './seedRoles';
import { seedUsers } from './seedUsers';
import { seedUserProfiles } from './seedUserProfiles';
import { seedUserRoles } from './seedUserRoles';
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
import { seedPeople } from './seedPeople';
import { seedLocations } from './seedLocations';
import { seedKnowledge } from './seedKnowledge';
import { seedTagsAndReferences } from './seedTagsAndReferences';
import { seedModerationAndNotifications } from './seedModerationAndNotifications';
import { seedPartnersAndDonations } from './seedPartnersAndDonations';
import { seedLogsAndAudits } from './seedLogsAndAudits';
import { seedTrips } from './seedTrips';
import { seedArticles } from './seedArticles';
import { seedCms } from './seedCms';
import { seedFinance } from './seedFinance';
import { seedMessaging } from './seedMessaging';
import {seedAuthorDashboard} from './seedAuthorDashboard';

export async function seed() {
  try {
    console.log('\n🌱 Starting Database Seeding...\n');

    // 1. Roles
    const roles = await seedRoles();

    // 2. Users
    const users = await seedUsers();

    // 3. Profiles
    await seedUserProfiles(users);

    // 4. User-Role assignments
    await seedUserRoles(users, roles);
    
    await seedAuthorDashboard();

    // 5. Collections
    const collections = await seedCollections(users[0]);

    // 6. Contribution Types
    const contributionTypes = await seedContributionTypes();

    // 7. Contributions
    const contributions = await seedContributions(users[0], contributionTypes);

    // 8. Files
    await seedFiles(users[0], contributions);

    // 9. Collection-Contribution links
    await seedCollectionContributions(collections, contributions);

    // 10. Open Calls & Participants
    await seedOpenCallsAndParticipants();

    // 11. Discussions
    const discussions = await seedDiscussions(users[0], contributions);

    // 12. Comments
    await seedComments(users[0], discussions);

    // 13. Reactions
    await seedReactions();

    // 14. Groups & Collectives
    await seedGroupsAndCollectives();

    // 15. Locations
    const locations = await seedLocations();

    // 16. People
    await seedPeople(locations);

    // 17. Knowledge
    await seedKnowledge(users[0], locations);

    // 18. Tags & References
    await seedTagsAndReferences();

    // 19. Moderation & Notifications
    await seedModerationAndNotifications();

    // 20. Partners & Donations
    await seedPartnersAndDonations();

    // 21. Trips, Stops, and Participants
    await seedTrips();

    // 22. Articles, Blocks, Contributors, and Tags
    await seedArticles();

    // 23. CMS Pages and Sections
    await seedCms();

      // 24. Finance: Invoices, Payouts, and Fraud Flags
    await seedFinance();

      // 25. Messaging: Conversations, Messages, Broadcasts, and Templates
    await seedMessaging();

    // 26. Logs & Audits
    await seedLogsAndAudits();

    console.log('\n🌟 Database seeded successfully — all relations intact.\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  }
}