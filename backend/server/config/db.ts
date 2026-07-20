import mongoose from 'mongoose';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import dns from 'dns';

export const connectDB = async (): Promise<void> => {
  try {
    // Force Node to use Google's DNS servers to resolve MongoDB Atlas SRV records correctly
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
      console.log('Configured custom Google DNS servers for Atlas resolution.');
    } catch (dnsErr) {
      console.warn('Failed to set custom DNS servers. Falling back to system resolver.');
    }

    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/ruralfinance';
    await mongoose.connect(connStr);
    console.log('MongoDB Connected successfully.');

    // Auto-seed default roles if database user collection is empty
    const count = await User.countDocuments({});
    if (count === 0) {
      console.log('Database is empty. Auto-seeding default credentials...');
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
      console.log('Successfully seeded default credentials on remote database.');
    }
  } catch (error) {
    console.warn('Database Connection Failed. Operating in local Mock DB Mode.', error);
  }
};
