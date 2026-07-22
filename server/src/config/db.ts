import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in server/.env');
    console.error('   Set your Atlas connection string. Mock DB is disabled when you want real MongoDB.');
    process.env.USE_MOCK_DB = 'true';
    return;
  }

  // Warn if pointing at localhost without a running local MongoDB instance
  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    console.warn('⚠️  MONGODB_URI points to localhost. Ensure MongoDB is installed and running,');
    console.warn('   or use your MongoDB Atlas connection string instead.');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✅ MongoDB connected — database: ${mongoose.connection.name}`);
    process.env.USE_MOCK_DB = 'false';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ MongoDB connection failed:', message);
    console.error('   Check: (1) .env is saved, (2) Atlas IP whitelist allows your IP,');
    console.error('         (3) username/password are correct, (4) URI includes /vayusense');
    console.warn('⚠️  Falling back to In-Memory Mock Database (data will NOT persist).');
    process.env.USE_MOCK_DB = 'true';
  }
}
