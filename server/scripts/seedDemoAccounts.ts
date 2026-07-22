/**
 * Seeds demo State Authority + City Authority accounts for local testing.
 *
 * Usage (from /server):
 *   npm run seed:demo
 *
 * Requires MONGODB_URI in .env. Skips accounts that already exist.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SALT_ROUNDS = 10;

const DEMO_ACCOUNTS = {
  state: {
    name: 'Maharashtra State Authority',
    email: 'state@maharashtra.gov.in',
    password: 'VayuState@2026',
    role: 'state_authority' as const,
    state: 'Maharashtra',
    city: null,
    isCredentialGenerated: false,
    tempPasswordChanged: true,
  },
  cityMumbai: {
    name: 'Mumbai City Administrator',
    email: 'mumbai.admin@maharashtra.gov.in',
    password: 'VayuCity@2026',
    role: 'city_authority' as const,
    state: 'Maharashtra',
    city: 'Mumbai',
    isCredentialGenerated: true,
    tempPasswordChanged: false,
  },
  cityMumbaiTemp: {
    name: 'Mumbai New Officer',
    email: 'mumbai.new@maharashtra.gov.in',
    password: 'TempMumbai2026',
    role: 'city_authority' as const,
    state: 'Maharashtra',
    city: 'Mumbai',
    isCredentialGenerated: true,
    tempPasswordChanged: false,
  },
  citizen: {
    name: 'Demo Citizen',
    email: 'citizen@demo.com',
    password: 'Citizen@2026',
    role: 'citizen' as const,
    state: null,
    city: 'Mumbai',
    isCredentialGenerated: false,
    tempPasswordChanged: true,
  },
};

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

async function upsertAccount(
  data: typeof DEMO_ACCOUNTS.state,
  createdBy: mongoose.Types.ObjectId | null = null,
) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  if (existing) {
    await User.findByIdAndUpdate(existing._id, {
      name: data.name,
      passwordHash,
      role: data.role,
      city: data.city,
      state: data.state,
      isCredentialGenerated: data.isCredentialGenerated,
      tempPasswordChanged: data.tempPasswordChanged,
      ...(createdBy ? { createdBy } : {}),
    });
    return { action: 'updated' as const, id: existing._id };
  }

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: data.role,
    city: data.city,
    state: data.state,
    isCredentialGenerated: data.isCredentialGenerated,
    tempPasswordChanged: data.tempPasswordChanged,
    createdBy,
  });
  return { action: 'created' as const, id: user._id };
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const stateResult = await upsertAccount(DEMO_ACCOUNTS.state);
  const stateId = stateResult.id as mongoose.Types.ObjectId;

  const cityResult = await upsertAccount(DEMO_ACCOUNTS.cityMumbai, stateId);
  const cityTempResult = await upsertAccount(DEMO_ACCOUNTS.cityMumbaiTemp, stateId);
  const citizenResult = await upsertAccount(DEMO_ACCOUNTS.citizen);

  console.log('Demo accounts ready:\n');
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ STATE AUTHORITY                                                 │');
  console.log(`│   Email:    ${DEMO_ACCOUNTS.state.email.padEnd(47)}│`);
  console.log(`│   Password: ${DEMO_ACCOUNTS.state.password.padEnd(47)}│`);
  console.log('│   → /dashboard (City Authorities panel)                         │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log('│ CITY AUTHORITY — Mumbai (ready to use)                          │');
  console.log(`│   Email:    ${DEMO_ACCOUNTS.cityMumbai.email.padEnd(47)}│`);
  console.log(`│   Password: ${DEMO_ACCOUNTS.cityMumbai.password.padEnd(47)}│`);
  console.log('│   → /dashboard, /map                                            │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log('│ CITY AUTHORITY — temp password flow                             │');
  console.log(`│   Email:    ${DEMO_ACCOUNTS.cityMumbaiTemp.email.padEnd(47)}│`);
  console.log(`│   Password: ${DEMO_ACCOUNTS.cityMumbaiTemp.password.padEnd(47)}│`);
  console.log('│   → forced to /change-password on first login                   │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log('│ CITIZEN                                                         │');
  console.log(`│   Email:    ${DEMO_ACCOUNTS.citizen.email.padEnd(47)}│`);
  console.log(`│   Password: ${DEMO_ACCOUNTS.citizen.password.padEnd(47)}│`);
  console.log('│   → /citizen                                                    │');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');

  console.log(`State: ${stateResult.action}, Mumbai admin: ${cityResult.action}, Mumbai temp: ${cityTempResult.action}, Citizen: ${citizenResult.action}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
