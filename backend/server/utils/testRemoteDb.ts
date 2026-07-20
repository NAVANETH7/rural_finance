import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const testDb = async () => {
  console.log('--- STARTING REMOTE DB DIAGNOSTIC ---');
  const uri = process.env.MONGO_URI;
  console.log('MONGO_URI is:', uri);

  try {
    console.log('Attempting mongoose.connect...');
    await mongoose.connect(uri || '');
    console.log('Connected successfully!');

    console.log('Checking User count...');
    const count = await User.countDocuments({});
    console.log('User count in remote database:', count);

    const usersList = await User.find({});
    console.log('Users in remote database:', usersList.map(u => ({ email: u.email, role: u.role, isVerified: u.isVerified })));

    if (count === 0) {
      console.log('Auto-seeding default credentials manually...');
      const defaultUsers = [
        {
          _id: new mongoose.Types.ObjectId('60c72b2f9b1d8b22a84d2d4f'),
          email: 'test_new_user@test.com',
          password: '$2a$10$vK3t/0qYn9rW3Mv9hM4Ueu7cpeqPZ.O3PzT9MwqK7m4hE07L91V6y', // password123
          role: 'Business Owner',
          isVerified: true,
          profile: { firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543210' }
        },
        {
          _id: new mongoose.Types.ObjectId('60c72b2f9b1d8b22a84d2d50'),
          email: 'officer@example.com',
          password: '$2a$10$vK3t/0qYn9rW3Mv9hM4Ueu7cpeqPZ.O3PzT9MwqK7m4hE07L91V6y', // password123
          role: 'Bank Officer',
          isVerified: true,
          profile: { firstName: 'Amit', lastName: 'Sharma', phone: '9876543211' }
        },
        {
          _id: new mongoose.Types.ObjectId('60c72b2f9b1d8b22a84d2d51'),
          email: 'admin@example.com',
          password: '$2a$10$vK3t/0qYn9rW3Mv9hM4Ueu7cpeqPZ.O3PzT9MwqK7m4hE07L91V6y', // password123
          role: 'Admin',
          isVerified: true,
          profile: { firstName: 'Sanjay', lastName: 'Verma', phone: '9876543212' }
        }
      ];
      await User.insertMany(defaultUsers);
      console.log('Seeding complete!');
    }

  } catch (err: any) {
    console.error('Diagnostic error:', err.message || err);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

testDb();
