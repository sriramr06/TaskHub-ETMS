import mongoose from 'mongoose';
import { connectDB } from '@/config/database';
import { User } from '@/models/User';
import { UserRole, UserStatus } from '@/constants/enums/user';
import { logger } from '@/utils/logger';

/**
 * Seeds one demo account per role for local development and manual QA —
 * e.g. trying out the app as a Guest without registering a real account.
 * Safe to re-run: existing accounts are left untouched. Never run this
 * against a production database.
 */
export const DEMO_PASSWORD = 'Demo1234!';

export const DEMO_USERS: { email: string; firstName: string; role: UserRole }[] = [
  { email: 'demo-admin@taskhub.local', firstName: 'Demo Admin', role: UserRole.ADMIN },
  { email: 'demo-manager@taskhub.local', firstName: 'Demo Manager', role: UserRole.MANAGER },
  { email: 'demo-teamlead@taskhub.local', firstName: 'Demo Teamlead', role: UserRole.TEAMLEAD },
  { email: 'demo-member@taskhub.local', firstName: 'Demo Member', role: UserRole.MEMBER },
  { email: 'demo-guest@taskhub.local', firstName: 'Demo Guest', role: UserRole.GUEST },
];

const seed = async (): Promise<void> => {
  await connectDB();

  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email });
    if (existing) {
      logger.info(`Skipping ${demo.email} (already exists).`);
      continue;
    }

    await User.create({
      email: demo.email,
      password: DEMO_PASSWORD,
      firstName: demo.firstName,
      lastName: 'User',
      role: demo.role,
      status: UserStatus.ACTIVE,
    });
    logger.info(`Created ${demo.email} (${demo.role}).`);
  }

  await mongoose.disconnect();
};

seed().catch((error: unknown) => {
  logger.error(`Seeding failed: ${error instanceof Error ? error.stack : String(error)}`);
  process.exit(1);
});
