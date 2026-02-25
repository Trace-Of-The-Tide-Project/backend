import { Book } from '../knowledge/models/book.model';
import { KnowledgeArticle } from '../knowledge/models/knowledge-article.model';
import { Adventure } from '../knowledge/models/adventure.model';
import { Location } from '../knowledge/models/location.model';
import { User } from '../users/models/user.model';

export async function seedKnowledge(adminUser: User, locations: Location[]) {
    console.log('🚀 Starting Knowledge seeding...');

    // 🔹 1. Books
    const books = await Book.bulkCreate(
        [
            {
                title: 'Memory and Resistance',
                author: 'Edward Said',
                summary: 'Exploring cultural identity and displacement in Palestine.',
                cover_image: 'memory_resistance.jpg',
                created_by: adminUser.id,
                created_at: new Date(),
            },
            {
                title: 'Voices of the Land',
                author: 'Lila Abu-Lughod',
                summary: 'Anthology of oral heritage and traditions.',
                cover_image: 'voices_land.jpg',
                created_by: adminUser.id,
                created_at: new Date(),
            },
        ] as any[],
        { ignoreDuplicates: true }
    );

    // 🔹 2. Knowledge Articles
    const articles = await KnowledgeArticle.bulkCreate(
        [
            {
                title: 'Preserving Oral Histories Digitally',
                content:
                    'An overview of best practices for archiving oral testimonies using digital tools.',
                author_id: adminUser.id,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                title: 'Traditional Architecture of Gaza',
                content:
                    'Examining historical construction techniques and their cultural meanings.',
                author_id: adminUser.id,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ] as any[],
        { ignoreDuplicates: true }
    );

    // 🔹 3. Adventures
    const adventures = await Adventure.bulkCreate(
        [
            {
                title: 'Journey Through Old Gaza',
                description: 'A cultural tour documenting stories from old neighborhoods.',
                start_date: new Date('2025-01-10'),
                end_date: new Date('2025-01-15'),
                created_by: adminUser.id,
                created_at: new Date(),
            },
            {
                title: 'Discovering Northern Villages',
                description: 'Collecting oral histories from northern Palestine.',
                start_date: new Date('2025-02-01'),
                end_date: new Date('2025-02-10'),
                created_by: adminUser.id,
                created_at: new Date(),
            },
        ] as any[],
        { ignoreDuplicates: true }
    );

    // 🔹 4. Link Adventures → Locations
    if (locations && locations.length && adventures.length) {
        const firstAdventure = adventures[0];
        const firstLocation = locations[0];

        if (firstAdventure && firstLocation) {
            // Assign the foreign key directly
            (firstAdventure as any).location_id = firstLocation.id;
            await firstAdventure.save();
        }
    }
    console.log('✅ Knowledge (Books, Articles, Adventures) seeded successfully.');
    return { books, articles, adventures };
}
