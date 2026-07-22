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
  
  // Find mumbai.new@maharashtra.gov.in
  const email = 'mumbai.new@maharashtra.gov.in';
  let user = await User.findOne({ email });
  console.log('BEFORE UPDATE:', JSON.stringify({
    _id: user._id,
    email: user.get('email'),
    isCredentialGenerated: user.get('isCredentialGenerated'),
    tempPasswordChanged: user.get('tempPasswordChanged'),
  }, null, 2));

  // Run update
  user = await User.findByIdAndUpdate(
    user._id,
    {
      tempPasswordChanged: true,
    },
    { new: true }
  );

  console.log('AFTER UPDATE:', JSON.stringify({
    _id: user._id,
    email: user.get('email'),
    isCredentialGenerated: user.get('isCredentialGenerated'),
    tempPasswordChanged: user.get('tempPasswordChanged'),
  }, null, 2));

  // Query again from DB to verify persistence
  const reQuery = await User.findOne({ email });
  console.log('RE-QUERIED FROM DB:', JSON.stringify({
    _id: reQuery._id,
    email: reQuery.get('email'),
    isCredentialGenerated: reQuery.get('isCredentialGenerated'),
    tempPasswordChanged: reQuery.get('tempPasswordChanged'),
  }, null, 2));

  // Reset it back to false so the user can keep testing
  await User.findByIdAndUpdate(user._id, { tempPasswordChanged: false });

  await mongoose.disconnect();
}

check().catch(console.error);
