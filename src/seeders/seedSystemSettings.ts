import { Badge } from '../system-settings/models/badge.model';
import { EmailTemplate } from '../system-settings/models/email-template.model';
import { SiteSettings } from '../cms/models/site-settings.model';

export async function seedSystemSettings() {
  console.log('🔧 Seeding system settings...');

  // ── Badges ──
  const badges = [
    { name: 'Top Contributor', description: '100+ contributions', icon: 'trophy', criteria_type: 'contributions', criteria_value: 100, awarded_count: 23 },
    { name: 'Rising Star', description: 'First 10 published works', icon: 'star', criteria_type: 'published', criteria_value: 10, awarded_count: 87 },
    { name: 'Community Helper', description: '50+ helpful comments', icon: 'heart', criteria_type: 'comments', criteria_value: 50, awarded_count: 45 },
    { name: 'Verified Creator', description: 'Identity verified', icon: 'check', criteria_type: 'verification', criteria_value: 1, awarded_count: 312 },
  ];

  for (const badge of badges) {
    await Badge.findOrCreate({
      where: { name: badge.name },
      defaults: badge as any,
    });
  }

  // ── Email Templates ──
  const templates = [
    { name: 'Welcome Email', category: 'onboarding', subject: 'Welcome to Trace of the Tides', body: 'Hello {{name}},\n\nWelcome to Trace of the Tides! We are excited to have you join our community of heritage storytellers.\n\nBest regards,\nThe Trace of the Tides Team' },
    { name: 'Password Reset', category: 'security', subject: 'Reset Your Password', body: 'Hello {{name}},\n\nWe received a request to reset your password. Click the link below to set a new password.\n\nIf you did not request this, please ignore this email.\n\nBest regards' },
    { name: 'Content Approved', category: 'content', subject: 'Your Content Has Been Approved', body: 'Hello {{name}},\n\nGreat news! Your submission has been reviewed and approved. It is now live on the platform.\n\nThank you for your contribution!' },
    { name: 'Payout Confirmation', category: 'payment', subject: 'Payout Processed Successfully', body: 'Hello {{name}},\n\nYour payout has been processed successfully on {{date}}. Please check your payment method for the funds.\n\nBest regards' },
    { name: 'Account Warning', category: 'moderation', subject: 'Account Warning Notice', body: 'Hello {{name}},\n\nThis is a warning regarding your account activity. Please review our community guidelines to ensure compliance.\n\nIf you have questions, please contact our support team.' },
  ];

  for (const template of templates) {
    await EmailTemplate.findOrCreate({
      where: { name: template.name },
      defaults: template as any,
    });
  }

  // ── Localisation Defaults ──
  // FIX: SiteSettings has NO `group` column — only key + value
  const localisationDefaults = [
    { key: 'default_language', value: 'English' },
    { key: 'timezone', value: 'UTC' },
    { key: 'date_format', value: 'MM/DD/YYYY' },
    { key: 'enable_multi_language', value: 'true' },
  ];

  for (const setting of localisationDefaults) {
    await SiteSettings.findOrCreate({
      where: { key: setting.key },
      defaults: setting as any,
    });
  }

  // ── Guidelines Defaults ──
  const guidelinesDefaults = [
    { key: 'community_guidelines', value: '1. Be respectful to all community members\n2. No hate speech or discrimination\n3. Original content only - no plagiarism\n4. Credit sources when applicable\n5. No spam or self-promotion' },
    { key: 'content_policy', value: 'All content must be original or properly licensed. Copyrighted material without permission will be removed. Adult content must be properly tagged.' },
    { key: 'enable_multi_language_guidelines', value: 'false' },
  ];

  for (const setting of guidelinesDefaults) {
    await SiteSettings.findOrCreate({
      where: { key: setting.key },
      defaults: setting as any,
    });
  }

  console.log('✅ System settings seeded');
}