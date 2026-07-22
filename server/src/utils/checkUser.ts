import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const uri = process.env.MONGODB_URI;

async function check() {
  if (!uri) {
    console.error('MONGODB_URI not found');
    return;
  }
  await mongoose.connect(uri);
  const userSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const users = await User.find({});
  console.log('--- USERS IN DATABASE ---');
  users.forEach((u: any) => {
    console.log(JSON.stringify({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isCredentialGenerated: u.get('isCredentialGenerated'),
      tempPasswordChanged: u.get('tempPasswordChanged'),
    }));
  });
  await mongoose.disconnect();
}

check().catch(console.error);
