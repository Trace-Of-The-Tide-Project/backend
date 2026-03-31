import { OpenCall } from '../open call/models/open-call.model';
import { Participant } from '../open call/models/participant.model';
import { Contribution } from '../contributions/models/contribution.model';
import { User } from '../users/models/user.model';

export async function seedOpenCallsAndParticipants() {
  console.log('🚀 Starting Open Calls seeding...');

  const adminUser = await User.findOne({
    where: { email: 'admin@example.com' },
  });

  if (!adminUser) {
    console.error('❌ No admin user found. Please seed users first.');
    return;
  }

  const openCallsData = [
    {
      title: 'Oral History of 1967',
      description: 'Collecting testimonies and documents from the 1967 war.',
      category: 'historical',
      timeline_start: new Date('2025-01-01'),
      timeline_end: new Date('2026-12-31'),
      created_by: adminUser.id,
      status: 'open',
      language: 'ar',
      visibility: 'public',
      tags: ['history', '1967', 'oral-history'],
      content_blocks: [
        { type: 'paragraph', value: 'We invite you to share your stories and testimonies from the 1967 war. Your voice matters.', order: 1 },
        { type: 'image', value: 'https://example.com/1967-banner.jpg', order: 2 },
        { type: 'quote', value: 'History belongs to those who tell it.', order: 3 },
        { type: 'callout', value: 'Submissions accepted in Arabic, English, and French.', order: 4 },
        { type: 'paragraph', value: 'All contributions will be archived and preserved for future generations.', order: 5 },
      ],
      main_media: { type: 'image', url: 'https://example.com/1967-cover.jpg', size_mb: 3 },
      application_form: {
        fields: [
          { name: 'first_name', type: 'text', required: true },
          { name: 'last_name', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          { name: 'phone', type: 'phone', required: true },
          { name: 'experience_field', type: 'select', required: true, options: ['Researcher', 'Witness', 'Family Member', 'Historian'] },
          { name: 'about', type: 'textarea', required: true },
          { name: 'country', type: 'select', required: true },
          { name: 'city', type: 'select', required: true },
          { name: 'files', type: 'file_multiple', required: false, max_files: 5, allowed_types: ['jpg', 'png', 'pdf', 'mp3', 'mp4'], max_size_mb: 20 },
          { name: 'terms_agreement', type: 'checkbox', required: true },
        ],
      },
      seo: {
        title: 'Oral History of 1967 — Trace of the Tide',
        meta_description: 'Share your testimonies and documents from the 1967 war. Help preserve Palestinian oral history.',
      },
      published_at: new Date('2025-01-01'),
    },
    {
      title: 'Women in Heritage',
      description: 'Celebrating stories of women preserving cultural traditions across generations.',
      category: 'cultural',
      timeline_start: new Date('2025-03-01'),
      timeline_end: new Date('2026-09-30'),
      created_by: adminUser.id,
      status: 'open',
      language: 'en',
      visibility: 'public',
      tags: ['women', 'heritage', 'culture', 'tradition'],
      content_blocks: [
        { type: 'paragraph', value: 'Women have always been the backbone of cultural preservation — from embroidery to storytelling.', order: 1 },
        { type: 'image', value: 'https://example.com/women-heritage.jpg', order: 2 },
        { type: 'quote', value: 'When a grandmother tells a story, a whole world is saved.', order: 3 },
        { type: 'divider', value: '', order: 4 },
        { type: 'paragraph', value: 'We are looking for photographers, writers, and filmmakers to document these stories.', order: 5 },
        { type: 'callout', value: 'Selected works will be exhibited at the Palestine Museum in 2026.', order: 6 },
      ],
      main_media: { type: 'image', url: 'https://example.com/women-cover.jpg', size_mb: 4 },
      application_form: {
        fields: [
          { name: 'first_name', type: 'text', required: true },
          { name: 'last_name', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          { name: 'phone', type: 'phone', required: true },
          { name: 'experience_field', type: 'select', required: true, options: ['Photography', 'Writing', 'Film', 'Embroidery', 'Music', 'Other'] },
          { name: 'about', type: 'textarea', required: true },
          { name: 'country', type: 'select', required: true },
          { name: 'city', type: 'select', required: true },
          { name: 'portfolio_link', type: 'text', required: false },
          { name: 'files', type: 'file_multiple', required: false, max_files: 10, allowed_types: ['jpg', 'png', 'pdf', 'mp4', 'doc'], max_size_mb: 20 },
          { name: 'terms_agreement', type: 'checkbox', required: true },
        ],
      },
      seo: {
        title: 'Women in Heritage — Open Call',
        meta_description: 'Submit your work celebrating women who preserve cultural traditions across Palestine.',
      },
      published_at: new Date('2025-03-01'),
    },
    {
      title: 'Palestinian Photography Archive 2026',
      description: 'Building a comprehensive photographic archive of daily life in Palestine.',
      category: 'photography',
      timeline_start: new Date('2026-06-01'),
      timeline_end: new Date('2026-12-31'),
      created_by: adminUser.id,
      status: 'draft',
      language: 'en',
      visibility: 'private',
      tags: ['photography', 'archive', 'daily-life'],
      content_blocks: [
        { type: 'paragraph', value: 'We are building the largest open-access photographic archive of Palestinian daily life.', order: 1 },
        { type: 'gallery', value: ['https://example.com/sample1.jpg', 'https://example.com/sample2.jpg', 'https://example.com/sample3.jpg'], order: 2 },
        { type: 'author_note', value: 'This open call is still in draft and will be published soon.', order: 3 },
      ],
      main_media: { type: 'image', url: 'https://example.com/photo-archive-cover.jpg', size_mb: 5 },
      application_form: {
        fields: [
          { name: 'first_name', type: 'text', required: true },
          { name: 'last_name', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          { name: 'about', type: 'textarea', required: true },
          { name: 'files', type: 'file_multiple', required: true, max_files: 20, allowed_types: ['jpg', 'png'], max_size_mb: 20 },
          { name: 'terms_agreement', type: 'checkbox', required: true },
        ],
      },
      seo: {
        title: 'Palestinian Photography Archive 2026',
        meta_description: 'Contribute to the largest photographic archive of Palestinian daily life.',
      },
    },
  ];

  for (const data of openCallsData) {
    await OpenCall.findOrCreate({
      where: { title: data.title },
      defaults: data as any,
    });
  }

  const openCalls = await OpenCall.findAll({
    where: { title: openCallsData.map((d) => d.title) },
  });

  const contributions = await Contribution.findAll({ limit: 2 });

  // Seed participants with dynamic form_answers
  const participantsData = [
    {
      user_id: adminUser.id,
      open_call_id: openCalls[0]?.id,
      role: 'contributor',
      contribution_id: contributions[0]?.id || null,
      join_date: new Date(),
      status: 'active',
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@example.com',
      phone_number: '+970599000001',
      experience_field: 'Historian',
      about: 'Platform administrator contributing to oral history preservation.',
      country: 'Palestine',
      city: 'Ramallah',
      terms_agreed: true,
      form_answers: {
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@example.com',
        phone: '+970599000001',
        experience_field: 'Historian',
        about: 'Platform administrator contributing to oral history preservation.',
        country: 'Palestine',
        city: 'Ramallah',
      },
    },
    {
      user_id: adminUser.id,
      open_call_id: openCalls[1]?.id,
      role: 'reviewer',
      contribution_id: contributions[1]?.id || null,
      join_date: new Date(),
      status: 'active',
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@example.com',
      phone_number: '+970599000001',
      experience_field: 'Photography',
      about: 'Reviewing submissions for the Women in Heritage call.',
      country: 'Palestine',
      city: 'Ramallah',
      terms_agreed: true,
      form_answers: {
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@example.com',
        phone: '+970599000001',
        experience_field: 'Photography',
        about: 'Reviewing submissions for the Women in Heritage call.',
        country: 'Palestine',
        city: 'Ramallah',
      },
    },
  ];

  for (const data of participantsData) {
    if (data.open_call_id) {
      await Participant.findOrCreate({
        where: { open_call_id: data.open_call_id, email: data.email },
        defaults: data as any,
      });
    }
  }

  console.log('✅ Open Calls and Participants seeded successfully');
}
