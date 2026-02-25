import { Page } from '../cms/models/page.model';
import { PageSection } from '../cms/models/page-section.model';
import { SiteSettings } from '../cms/models/site-settings.model';
import { User } from '../users/models/user.model';

export async function seedCms() {
  const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
  if (!adminUser) return console.error('❌ No admin user found.');

  // ─── HOMEPAGE ─────────────────────────────────────────────

  const [homepage] = await Page.findOrCreate({
    where: { slug: 'home' },
    defaults: {
      title: 'Home',
      slug: 'home',
      page_type: 'homepage',
      status: 'published',
      updated_by: adminUser.id,
    } as any,
  });

  const homeSections = [
    {
      page_id: homepage.id, section_type: 'hero', title: 'Hero Section', section_order: 1, is_visible: true,
      config: JSON.stringify({ headline: 'Discover. Create. Inspire.', subheadline: 'Join a community of creators, authors, and editors sharing their passion with the world.', primary_cta: 'Contribute now', secondary_cta: 'Contribute now', background_image: 'hero_bg.jpg' }),
    },
    {
      page_id: homepage.id, section_type: 'featured', title: 'Featured', section_order: 2, is_visible: true,
      config: JSON.stringify({ limit: 6 }),
    },
    {
      page_id: homepage.id, section_type: 'categories', title: 'Categories', section_order: 3, is_visible: true,
      config: JSON.stringify({}),
    },
    {
      page_id: homepage.id, section_type: 'top_creators', title: 'Top Creators', section_order: 4, is_visible: true,
      config: JSON.stringify({ limit: 5 }),
    },
    {
      page_id: homepage.id, section_type: 'call_to_action', title: 'Call to Action', section_order: 5, is_visible: true,
      config: JSON.stringify({ text: 'Share your story', button_text: 'Contribute Now', button_url: '/contribute' }),
    },
  ];

  for (const section of homeSections) {
    await PageSection.findOrCreate({
      where: { page_id: section.page_id, section_order: section.section_order },
      defaults: section as any,
    });
  }

  // ─── STATIC PAGES ────────────────────────────────────────

  const staticPages = [
    { title: 'About Us', slug: 'about-us', content: '<h1>About Trace of the Tides</h1><p>Preserving Palestinian heritage through stories, testimonies, and cultural artifacts.</p>' },
    { title: 'FAQ', slug: 'faq', content: '<h1>Frequently Asked Questions</h1><p>Find answers to common questions about the platform.</p>' },
    { title: 'Terms of Service', slug: 'terms-of-service', content: '<h1>Terms of Service</h1><p>Please read these terms carefully before using our platform.</p>' },
    { title: 'Privacy Policy', slug: 'privacy-policy', content: '<h1>Privacy Policy</h1><p>Your privacy is important to us.</p>' },
    { title: 'Contact', slug: 'contact', content: '<h1>Contact Us</h1><p>Get in touch with our team.</p>' },
  ];

  for (const page of staticPages) {
    await Page.findOrCreate({
      where: { slug: page.slug },
      defaults: { ...page, page_type: 'static', status: 'published', updated_by: adminUser.id } as any,
    });
  }

  // ─── SITE SETTINGS ───────────────────────────────────────

  const settings = [
    {
      key: 'navigation',
      value: JSON.stringify({
        links: [
          { label: 'Fields', url: '/fields', order: 1, is_visible: true },
          { label: 'Be a neighbor', url: '/neighbor', order: 2, is_visible: true },
          { label: 'Gift a trace', url: '/gift', order: 3, is_visible: true },
          { label: 'Trace a story', url: '/trace', order: 4, is_visible: true },
        ],
      }),
    },
    {
      key: 'footer',
      value: JSON.stringify({
        text: '© 2025 Trace of the Tides. All rights reserved.',
        social_links: {
          twitter: 'https://twitter.com/traceofthetides',
          instagram: 'https://instagram.com/traceofthetides',
          linkedin: 'https://linkedin.com/company/traceofthetides',
          youtube: 'https://youtube.com/traceofthetides',
        },
        columns: [
          { title: 'Palestine (Architecture of stories)', items: ['Stone - Witness of life', 'Salt - Trace of time', 'Compass - Trace of place'] },
          { title: 'Fields (Mosaic of Ba\'il trails)', items: ['Harbour trails', 'Courtyard trails', 'Hill trails'] },
          { title: 'Contact', items: ['director@traceofthetides.org', 'Everywhere'] },
        ],
      }),
    },
    {
      key: 'branding',
      value: JSON.stringify({
        logo: 'logo.png',
        favicon: 'favicon.ico',
        primary_color: '#C4A962',
        site_name: 'Trace of The Tide',
      }),
    },
  ];

  for (const setting of settings) {
    await SiteSettings.findOrCreate({
      where: { key: setting.key },
      defaults: setting as any,
    });
  }

  console.log('✅ CMS seeded (Homepage, Static Pages, Navigation, Footer, Branding)');
}