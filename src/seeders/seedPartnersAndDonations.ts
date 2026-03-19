import { Partner } from '../partners/models/partner.model';
import { Donation } from '../donations/models/donation.model';
import { User } from '../users/models/user.model';

export async function seedPartnersAndDonations() {
  const adminUser = await User.findOne({
    where: { email: 'admin@example.com' },
  });
  if (!adminUser) {
    console.error('❌ No admin user found for seeding donations.');
    return;
  }

  const partners = await Partner.bulkCreate(
    [
      {
        name: 'Heritage Foundation',
        description: 'Supports preservation of oral and written heritage.',
        contact_info: 'foundation@heritage.org',
      },
      {
        name: 'Culture Aid International',
        description: 'Promotes regional storytelling and history archiving.',
        contact_info: 'contact@cultureaid.org',
      },
    ] as any[],
    { ignoreDuplicates: true },
  );

  await Donation.bulkCreate([
    {
      user_id: adminUser.id,
      partner_id: partners[0].id,
      amount: 500.0,
      type: 'one-time',
      status: 'completed',
    },
    {
      user_id: adminUser.id,
      partner_id: partners[1].id,
      amount: 100.0,
      type: 'monthly',
      status: 'pending',
    },
  ] as any[]);

  console.log('✅ Partners and Donations seeded successfully');
}
