import { Payout } from '../finance/models/payout.model';
import { Invoice } from '../finance/models/invoice.model';
import { FraudFlag } from '../finance/models/fraud-flag.model';
import { User } from '../users/models/user.model';

export async function seedFinance() {
  console.log('🏦 Seeding finance data...');

  // FIX: Use correct emails matching seedUsers
  const admin = await User.findOne({ where: { email: 'admin@example.com' } });
  const author = await User.findOne({ where: { email: 'author@example.com' } });
  const editor = await User.findOne({
    where: { email: 'editor1@example.com' },
  });

  if (!admin || !author) {
    console.log('⚠️  Skipping finance seeder: required users not found');
    return;
  }

  // ─── PAYOUTS ──────────────────────────────────────

  const payoutsData = [
    {
      creator_id: author.id,
      amount: 1250,
      currency: 'USD',
      payment_method: 'bank_transfer',
      payment_details: 'Bank of Palestine - ****4521',
      status: 'pending',
    },
    {
      creator_id: author.id,
      amount: 1250,
      currency: 'USD',
      payment_method: 'paypal',
      payment_details: 'author@email.com',
      status: 'pending',
    },
    {
      creator_id: author.id,
      amount: 1250,
      currency: 'USD',
      payment_method: 'bank_transfer',
      payment_details: 'Bank of Palestine - ****4521',
      status: 'under_review',
      reviewed_by: admin.id,
    },
  ];

  for (const p of payoutsData) {
    await Payout.findOrCreate({
      where: {
        creator_id: p.creator_id,
        amount: p.amount,
        status: p.status,
        payment_method: p.payment_method,
      },
      defaults: p as any,
    });
  }

  // ─── INVOICES ─────────────────────────────────────

  const invoicesData = [
    {
      invoice_number: 'INV-20240115-001',
      type: 'donation',
      payer_id: editor?.id,
      payee_id: author.id,
      amount: 500,
      platform_fee: 50,
      net_amount: 450,
      currency: 'USD',
      status: 'paid',
      issued_at: new Date('2024-01-15'),
      paid_at: new Date('2024-01-15'),
    },
    {
      invoice_number: 'INV-20240115-002',
      type: 'donation',
      payer_id: admin.id,
      payee_id: author.id,
      amount: 250,
      platform_fee: 25,
      net_amount: 225,
      currency: 'USD',
      status: 'issued',
      issued_at: new Date('2024-01-15'),
    },
    {
      invoice_number: 'INV-20240116-001',
      type: 'payout',
      payee_id: author.id,
      amount: 1000,
      platform_fee: 0,
      net_amount: 1000,
      currency: 'USD',
      status: 'issued',
      issued_at: new Date('2024-01-16'),
    },
  ];

  for (const inv of invoicesData) {
    await Invoice.findOrCreate({
      where: { invoice_number: inv.invoice_number },
      defaults: inv as any,
    });
  }

  // ─── FRAUD FLAGS ──────────────────────────────────

  const flagsData = [
    {
      flag_type: 'multiple_failed_payments',
      description:
        'Multiple failed payments detected - 5 failed attempts in the last hour',
      user_id: editor?.id,
      amount: 500,
      severity: 'high',
      status: 'open',
    },
    {
      flag_type: 'multiple_failed_payments',
      description:
        'Multiple failed payments detected - 3 failed attempts in the last hour',
      user_id: editor?.id,
      amount: 500,
      severity: 'high',
      status: 'open',
    },
  ];

  for (const f of flagsData) {
    await FraudFlag.findOrCreate({
      where: {
        flag_type: f.flag_type,
        user_id: f.user_id,
        description: f.description,
      },
      defaults: f as any,
    });
  }

  console.log('✅ Finance data seeded');
}
