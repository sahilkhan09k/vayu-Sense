/**
 * One-time script to seed a State Authority account.
 *
 * Usage:
 *   npx tsx scripts/seedStateAuthority.ts --state Maharashtra --email state@maharashtra.gov.in --password yourpassword --name "Maharashtra State Authority"
 *
 * Requires MONGODB_URI and JWT_SECRET in server/.env (or environment).
 * Does NOT start the Express server — connects to MongoDB directly.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SALT_ROUNDS = 10;

function parseArgs(): { state: string; email: string; password: string; name: string } {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const state = get('--state');
  const email = get('--email');
  const password = get('--password');
  const name = get('--name') ?? `${state} State Authority`;

  if (!state || !email || !password) {
    console.error(`
Usage:
  npx tsx scripts/seedStateAuthority.ts --state <StateName> --email <email> --password <password> [--name "Display Name"]

Example:
  npx tsx scripts/seedStateAuthority.ts --state Maharashtra --email state@maharashtra.gov.in --password SecurePass123 --name "Maharashtra State Authority"
`);
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: password must be at least 8 characters.');
    process.exit(1);
  }

  return { state, email, password, name };
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  passwordHash: String,
  role: { type: String, enum: ['citizen', 'city_authority', 'state_authority'] },
  city: { type: String, default: null },
  state: { type: String, default: null },
  isCredentialGenerated: { type: Boolean, default: false },
  tempPasswordChanged: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
  const { state, email, password, name } = parseArgs();
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('Error: MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`Error: An account with email "${email}" already exists (role: ${existing.role}).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'state_authority',
    city: null,
    state,
    isCredentialGenerated: false,
    tempPasswordChanged: true,
    createdBy: null,
  });

  console.log('\n✅ State Authority created successfully');
  console.log(`   ID:    ${user._id}`);
  console.log(`   Name:  ${name}`);
  console.log(`   Email: ${email.toLowerCase()}`);
  console.log(`   State: ${state}`);
  console.log(`   Role:  state_authority\n`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
