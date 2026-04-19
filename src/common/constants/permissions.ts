export const Permissions = {
  // Content
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_DELETE: 'content.delete',
  CONTENT_FEATURE: 'content.feature',

  // Moderation
  MODERATION_APPROVE: 'moderation.approve',
  MODERATION_REJECT: 'moderation.reject',
  MODERATION_FLAG: 'moderation.flag',

  // Finance
  FINANCE_VIEW: 'finance.view',
  FINANCE_APPROVE_PAYOUT: 'finance.approve_payout',

  // Users
  USERS_MANAGE: 'users.manage',
  USERS_SUSPEND: 'users.suspend',

  // Open Calls
  OPEN_CALLS_MANAGE: 'open_calls.manage',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',

  // Messaging
  MESSAGING_BROADCAST: 'messaging.broadcast',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
