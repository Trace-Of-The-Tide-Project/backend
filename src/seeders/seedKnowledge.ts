import { Book } from '../knowledge/models/book.model';
import { KnowledgeArticle } from '../knowledge/models/knowledge-article.model';
import { Adventure } from '../knowledge/models/adventure.model';
import { Location } from '../knowledge/models/location.model';
import { User } from '../users/models/user.model';

export async function seedKnowledge(adminUser: User, locations: Location[]) {
  console.log('🚀 Starting Knowledge seeding...');

  // Books
  const booksData = [
    { title: 'Memory and Resistance', author: 'Edward Said', summary: 'Exploring cultural identity and displacement in Palestine.', cover_image: 'memory_resistance.jpg', created_by: adminUser.id },
    { title: 'Voices of the Land', author: 'Lila Abu-Lughod', summary: 'Anthology of oral heritage and traditions.', cover_image: 'voices_land.jpg', created_by: adminUser.id },
  ];

  for (const data of booksData) {
    await Book.findOrCreate({
      where: { title: data.title },
      defaults: data as any,
    });
  }

  // Knowledge Articles
  const articlesData = [
    { title: 'Preserving Oral Histories Digitally', content: 'An overview of best practices for archiving oral testimonies using digital tools.', author_id: adminUser.id },
    { title: 'Traditional Architecture of Gaza', content: 'Examining historical construction techniques and their cultural meanings.', author_id: adminUser.id },
  ];

  for (const data of articlesData) {
    await KnowledgeArticle.findOrCreate({
      where: { title: data.title },
      defaults: data as any,
    });
  }

  // Adventures
  const adventuresData = [
    { title: 'Journey Through Old Gaza', description: 'A cultural tour documenting stories from old neighborhoods.', start_date: new Date('2025-01-10'), end_date: new Date('2025-01-15'), created_by: adminUser.id },
    { title: 'Discovering Northern Villages', description: 'Collecting oral histories from northern Palestine.', start_date: new Date('2025-02-01'), end_date: new Date('2025-02-10'), created_by: adminUser.id },
  ];

  for (const data of adventuresData) {
    await Adventure.findOrCreate({
      where: { title: data.title },
      defaults: data as any,
    });
  }


  console.log('✅ Knowledge (Books, Articles, Adventures) seeded');
}