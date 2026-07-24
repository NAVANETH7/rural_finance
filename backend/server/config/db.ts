import mongoose from 'mongoose';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import dns from 'dns';

// Override Windows local DNS with Google & Cloudflare DNS for Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log('Configured custom Google & Cloudflare DNS (8.8.8.8 / 1.1.1.1) for Atlas resolution.');
} catch (dnsErr) {
  console.warn('DNS override skipped:', dnsErr);
}

export const connectDB = async (): Promise<void> => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ruralfinance';
  const localUri = 'mongodb://127.0.0.1:27017/ruralfinance';

  try {
    console.log('Connecting to MongoDB Atlas Database...');
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 6000 });
    console.log('MongoDB Atlas Connected Successfully!');
  } catch (error) {
    console.warn('Primary Atlas Connection failed. Falling back to local MongoDB instance...', error);
    try {
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
      console.log('MongoDB Connected to local instance.');
    } catch (localErr) {
      console.warn('Database Connection Failed. Operating in resilient local Mock DB Mode.');
      return;
    }
  }

  // Auto-seed default roles if database user collection is empty
  try {
    const count = await User.countDocuments({});
    if (count === 0) {
      console.log('Database empty. Seeding default admin & officer credentials...');
      const hashedPassword = bcrypt.hashSync('password123', 10);
      const defaultUsers = [
        {
          _id: new mongoose.Types.ObjectId('60c72b2f9b1d8b22a84d2d4f'),
          email: 'test_new_user@test.com',
          password: hashedPassword,
          role: 'Business Owner',
          isVerified: true,
          profile: { firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543210' }
        },
        {
          _id: new mongoose.Types.ObjectId('60c72b2f9b1d8b22a84d2d50'),
          email: 'officer@example.com',
          password: hashedPassword,
          role: 'Bank Officer',
          isVerified: true,
          profile: { firstName: 'Amit', lastName: 'Sharma', phone: '9876543211' }
        },
        {
          _id: new mongoose.Types.ObjectId('60c72b2f9b1d8b22a84d2d51'),
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'Admin',
          isVerified: true,
          profile: { firstName: 'Sanjay', lastName: 'Verma', phone: '9876543212' }
        }
      ];
      await User.insertMany(defaultUsers);
      console.log('Successfully seeded default users to MongoDB Atlas.');
    }
  } catch (seedErr) {
    console.warn('Seeding skipped:', seedErr);
  }
};
