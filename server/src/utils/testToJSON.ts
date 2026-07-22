import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getUserModel } from '../models/User.js';

dotenv.config();

const uri = process.env.MONGODB_URI;

async function check() {
  if (!uri) {
    console.error('MONGODB_URI not found');
    return;
  }
  await mongoose.connect(uri);
  const User = getUserModel();
  
  const email = 'mumbai.admin@maharashtra.gov.in';
  const user = await User.findOne({ email });
  if (user) {
    console.log('toObject():', user.toObject());
    console.log('toJSON():', user.toJSON());
  } else {
    console.log('User not found');
  }

  await mongoose.disconnect();
}

check().catch(console.error);
