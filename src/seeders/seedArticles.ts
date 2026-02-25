import { Article } from '../articles/models/article.model';
import { ArticleBlock } from '../articles/models/article-block.model';
import { ArticleContributor } from '../articles/models/article-contributor.model';
import { ArticleTag } from '../articles/models/article-tag.model';
import { User } from '../users/models/user.model';
import { Tag } from '../tags/models/tag.model';

export async function seedArticles() {
  const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
  const editorUser = await User.findOne({ where: { email: 'editor1@example.com' } });
  if (!adminUser) return console.error('❌ No admin user found.');

  const tags = await Tag.findAll();

  // Article 1 — Published article
  const [article1] = await Article.findOrCreate({
    where: { slug: 'british-restrict-jewish-immigration-to-palestine' },
    defaults: {
      title: 'British Restrict Jewish Immigration to Palestine',
      slug: 'british-restrict-jewish-immigration-to-palestine',
      content_type: 'article',
      excerpt: 'As Great Britain launched the Palestine campaign of 1917, a pivotal moment in the history of the region unfolded.',
      cover_image: 'british_mandate.jpg',
      status: 'published',
      category: 'Documentary',
      language: 'en',
      visibility: 'public',
      reading_time: 15,
      view_count: 1456,
      seo_title: 'British Restrict Jewish Immigration to Palestine - Trace of the Tides',
      meta_description: 'A deep dive into the British Mandate era and its impact on Palestinian history.',
      published_at: new Date('2025-01-22'),
      author_id: adminUser.id,
    } as any,
  });

  // Article 2 — Draft article
  const [article2] = await Article.findOrCreate({
    where: { slug: 'the-future-of-sustainable-technology' },
    defaults: {
      title: 'The Future of Sustainable Technology',
      slug: 'the-future-of-sustainable-technology',
      content_type: 'article',
      excerpt: 'In an era where climate change and technological advancement intersect, sustainable technology emerges as our beacon of hope.',
      cover_image: 'sustainable_tech.jpg',
      status: 'draft',
      category: 'Essay',
      language: 'en',
      visibility: 'private',
      reading_time: 12,
      view_count: 0,
      author_id: adminUser.id,
    } as any,
  });

  // Article 3 — Scheduled
  const [article3] = await Article.findOrCreate({
    where: { slug: 'palestinian-cuisine-heritage' },
    defaults: {
      title: 'Palestinian Cuisine & Food Heritage',
      slug: 'palestinian-cuisine-heritage',
      content_type: 'article',
      excerpt: 'Exploring the rich culinary traditions passed down through generations.',
      cover_image: 'cuisine.jpg',
      status: 'scheduled',
      category: 'Documentary',
      language: 'en',
      visibility: 'public',
      reading_time: 8,
      scheduled_at: new Date('2026-04-01'),
      author_id: adminUser.id,
    } as any,
  });

  // Blocks for Article 1
  const blocksData = [
    { article_id: article1.id, block_order: 1, block_type: 'paragraph', content: 'As Great Britain launched the Palestine campaign of 1917 during World War I and its forces were close to conquering Jerusalem, it issued the Balfour Declaration that expressed its support for the establishment of a Jewish National Home in Palestine.' },
    { article_id: article1.id, block_order: 2, block_type: 'quote', content: 'The Dawn of a Sustainable Revolution', metadata: '{"attribution":"Historical Archives"}' },
    { article_id: article1.id, block_order: 3, block_type: 'image', content: '', metadata: '{"url":"mandate_era.jpg","alt":"British Mandate era photograph","caption":"Modern renewable energy infrastructure combining wind and solar technology"}' },
    { article_id: article1.id, block_order: 4, block_type: 'paragraph', content: 'Jewish immigration, though uneven, significantly increased Palestine\'s Jewish population, and Zionist institutions grew stronger and increasingly entrenched within the Mandate\'s governing structures.' },
    { article_id: article1.id, block_order: 5, block_type: 'callout', content: 'Energy Storage: Solving the Intermittency Challenge' },
    { article_id: article1.id, block_order: 6, block_type: 'paragraph', content: 'Transportation accounts for approximately 24% of global CO2 emissions, making it a critical area for sustainable innovation.' },
  ];

  for (const block of blocksData) {
    await ArticleBlock.findOrCreate({
      where: { article_id: block.article_id, block_order: block.block_order },
      defaults: block as any,
    });
  }

  // Contributors
  if (editorUser) {
    await ArticleContributor.findOrCreate({
      where: { article_id: article1.id, user_id: editorUser.id },
      defaults: {
        article_id: article1.id,
        user_id: editorUser.id,
        role: 'main_contributor',
        added_at: new Date(),
      } as any,
    });
  }

  // Article Tags
  if (tags.length > 0) {
    for (let i = 0; i < Math.min(tags.length, 2); i++) {
      await ArticleTag.findOrCreate({
        where: { article_id: article1.id, tag_id: tags[i].id },
        defaults: { article_id: article1.id, tag_id: tags[i].id } as any,
      });
    }
  }

  console.log('✅ Articles, Blocks, Contributors, and Tags seeded');
}