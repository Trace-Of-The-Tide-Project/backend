import { Conversation } from '../messaging/models/conversation.model';
import { Message } from '../messaging/models/message.model';
import { Broadcast } from '../messaging/models/broadcast.model';
import { MessageTemplate } from '../messaging/models/message-template.model';
import { User } from '../users/models/user.model';

export async function seedMessaging() {
  console.log('💬 Seeding messaging data...');

  const admin = await User.findOne({ where: { email: 'admin@example.com' } });
  const author = await User.findOne({ where: { email: 'author@example.com' } });
  const editor = await User.findOne({
    where: { email: 'editor1@example.com' },
  });

  if (!admin || !author) {
    console.log('⚠️  Skipping messaging seeder: required users not found');
    return;
  }

  // ─── TEMPLATES ────────────────────────────────────

  const templatesData = [
    {
      name: 'Welcome Message',
      category: 'onboarding',
      subject: 'Welcome to Trace of the Tide',
      body: 'Hello {{name}},\n\nWelcome to Trace of the Tide! We are thrilled to have you join our community of heritage storytellers.\n\nYour account has been created with the email {{email}}. You can start contributing stories, participating in open calls, and connecting with fellow community members.\n\nBest regards,\nThe Trace of the Tide Team',
    },
    {
      name: 'Payment Confirmation',
      category: 'payment',
      subject: 'Payment Confirmation',
      body: "Hello {{name}},\n\nThis is to confirm that your payment has been processed successfully on {{date}}.\n\nIf you have any questions about this transaction, please don't hesitate to reach out.\n\nBest regards,\nThe Trace of the Tide Team",
    },
    {
      name: 'Content Approved',
      category: 'moderation',
      subject: 'Your Content Has Been Approved',
      body: 'Hello {{name}},\n\nGreat news! Your submitted content has been reviewed and approved by our editorial team.\n\nYour contribution is now live and visible to the community. Thank you for sharing your story!\n\nBest regards,\nThe Trace of the Tide Team',
    },
    {
      name: 'Account Warning',
      category: 'moderation',
      subject: 'Account Notice',
      body: 'Hello {{name}},\n\nWe noticed some activity on your account that may violate our community guidelines.\n\nPlease review our Terms of Service and ensure your contributions comply with our standards. If you believe this notice was sent in error, please contact our support team.\n\nBest regards,\nThe Trace of the Tide Team',
    },
    {
      name: 'Feature Announcement',
      category: 'broadcast',
      subject: 'New Feature Available',
      body: "Hello {{name}},\n\nWe are excited to announce a new feature on Trace of the Tide!\n\nAs a {{role}}, you now have access to enhanced tools for storytelling and heritage preservation.\n\nLog in to explore what's new.\n\nBest regards,\nThe Trace of the Tide Team",
    },
  ];

  for (const t of templatesData) {
    await MessageTemplate.findOrCreate({
      where: { name: t.name },
      defaults: { ...t, created_by: admin.id } as any,
    });
  }

  // ─── CONVERSATIONS ───────────────────────────────

  const [conversation1] = await Conversation.findOrCreate({
    where: {
      subject: 'Question about payment processing',
      user_id: author.id,
    },
    defaults: {
      subject: 'Question about payment processing',
      category: 'payment',
      priority: 'high',
      status: 'open',
      user_id: author.id,
      last_message_at: new Date('2024-03-15T14:15:00'),
      unread_count: 0,
    } as any,
  });

  // Seed messages for conversation
  const messagesData = [
    {
      conversation_id: conversation1.id,
      sender_id: author.id,
      content:
        "Hi, I'm having trouble receiving my latest payout. The status shows pending...",
      message_type: 'text',
      is_read: true,
      createdAt: new Date('2024-03-15T10:30:00'),
    },
    {
      conversation_id: conversation1.id,
      sender_id: admin.id,
      content:
        "Thank you for reaching out. I see that your latest payout is currently marked as pending. Payouts sometimes take a little time to process depending on banking or payment provider schedules.\nCould you please allow 24-48 hours for the status to update? If it's still pending after that, let us know, and we'll investigate it further to ensure you receive your payment promptly.\nWe appreciate your patience!",
      message_type: 'text',
      is_read: true,
      createdAt: new Date('2024-03-15T14:15:00'),
    },
  ];

  for (const m of messagesData) {
    const existing = await Message.findOne({
      where: {
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        content: m.content.substring(0, 100),
      },
    });
    if (!existing) {
      await Message.create(m as any);
    }
  }

  // More sample conversations for inbox list
  if (editor) {
    const subjects = [
      'British Restrict Jewish Immigration policy review',
      'Content editing guidelines question',
      'Request for new collection category',
      'Timeline contribution feedback',
      'Translation help needed',
    ];

    for (const subject of subjects) {
      await Conversation.findOrCreate({
        where: { subject, user_id: editor.id },
        defaults: {
          subject,
          category: 'content',
          priority: 'normal',
          status: 'open',
          user_id: editor.id,
          last_message_at: new Date(),
          unread_count: 1,
        } as any,
      });
    }
  }

  // ─── BROADCASTS ───────────────────────────────────

  await Broadcast.findOrCreate({
    where: { subject: 'Welcome to the new platform update!' },
    defaults: {
      subject: 'Welcome to the new platform update!',
      message:
        'We are excited to announce several new features on Trace of the Tide. Check out the new Trips feature and enhanced content management tools.',
      target_audience: 'all_users',
      priority: 'normal',
      status: 'sent',
      recipients_count: 156,
      sent_at: new Date('2024-03-01'),
      created_by: admin.id,
    } as any,
  });

  console.log('✅ Messaging data seeded');
}
