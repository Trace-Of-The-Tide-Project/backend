import { Book } from '../knowledge/models/book.model';
import { KnowledgeArticle } from '../knowledge/models/knowledge-article.model';
import { Adventure } from '../knowledge/models/adventure.model';
import { Location } from '../knowledge/models/location.model';
import { User } from '../users/models/user.model';

export async function seedKnowledge(adminUser: User, locations: Location[]) {
  console.log('🚀 Starting Knowledge seeding...');

  // Books — extended with new fields
  const booksData = [
    {
      title: 'Memory and Resistance',
      author: 'Edward Said',
      publisher: 'Vintage Books',
      year: 1994,
      summary: 'Exploring cultural identity and displacement in Palestine.',
      cover_image: null,
      genre: 'Non-fiction',
      language: 'en',
      page_count: 352,
      price: null, // free
      created_by: adminUser.id,
    },
    {
      title: 'Voices of the Land',
      author: 'Lila Abu-Lughod',
      publisher: 'Columbia University Press',
      year: 2005,
      summary: 'Anthology of oral heritage and traditions from the Arab world.',
      cover_image: null,
      genre: 'Non-fiction',
      language: 'en',
      page_count: 280,
      price: 12.99,
      created_by: adminUser.id,
    },
    {
      title: 'The Great Adventure',
      author: 'Sarah Williams',
      publisher: 'Horizon Press',
      year: 2025,
      summary:
        'A thrilling tale of courage and discovery that takes readers on an unforgettable journey through uncharted territories.',
      cover_image: null,
      genre: 'Adventure',
      language: 'en',
      page_count: 200,
      price: null,
      rating_average: 4.5,
      rating_count: 128,
      created_by: adminUser.id,
    },
    {
      title: 'فلسفة الجمال',
      author: 'Ahmad Al-Khalil',
      publisher: 'دار الفكر',
      year: 2022,
      summary: 'دراسة في مفاهيم الجمال عبر الفلسفة العربية والغربية.',
      cover_image: null,
      genre: 'Philosophy',
      language: 'ar',
      page_count: 190,
      price: 8.99,
      created_by: adminUser.id,
    },
    {
      title: 'The Silence Between Words',
      author: 'Nour Hassan',
      publisher: 'Eastlight Publishing',
      year: 2024,
      summary: 'A meditation on language, translation, and what resists being said.',
      cover_image: null,
      genre: 'Philosophy',
      language: 'en',
      page_count: 168,
      price: null,
      created_by: adminUser.id,
    },
    {
      title: 'Roots & Routes',
      author: 'Mariam Tahir',
      publisher: 'Meridian Books',
      year: 2023,
      summary: 'Essays on migration, belonging, and the cultures we carry with us.',
      cover_image: null,
      genre: 'Biography',
      language: 'en',
      page_count: 240,
      price: 14.99,
      created_by: adminUser.id,
    },
  ];

  for (const data of booksData) {
    await Book.findOrCreate({
      where: { title: data.title },
      defaults: data as any,
    });
  }

  // Knowledge Articles
  const articlesData = [
    {
      title: 'Preserving Oral Histories Digitally',
      content:
        'An overview of best practices for archiving oral testimonies using digital tools.',
      author_id: adminUser.id,
    },
    {
      title: 'Traditional Architecture of Gaza',
      content:
        'Examining historical construction techniques and their cultural meanings.',
      author_id: adminUser.id,
    },
  ];

  for (const data of articlesData) {
    await KnowledgeArticle.findOrCreate({
      where: { title: data.title },
      defaults: data as any,
    });
  }

  // Adventures
  const adventuresData = [
    {
      title: 'Journey Through Old Gaza',
      description:
        'A cultural tour documenting stories from old neighborhoods.',
      start_date: new Date('2025-01-10'),
      end_date: new Date('2025-01-15'),
      created_by: adminUser.id,
    },
    {
      title: 'Discovering Northern Villages',
      description: 'Collecting oral histories from northern Palestine.',
      start_date: new Date('2025-02-01'),
      end_date: new Date('2025-02-10'),
      created_by: adminUser.id,
    },
  ];

  for (const data of adventuresData) {
    await Adventure.findOrCreate({
      where: { title: data.title },
      defaults: data as any,
    });
  }

  console.log('✅ Knowledge (Books, Articles, Adventures) seeded');
}
