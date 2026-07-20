import mongoose from 'mongoose';
import { User, Business, Transaction, RiskScore } from '../models';
import { connectDB } from '../config/db';
import { connectRedis, redisClient } from '../config/redis';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

const runVerification = async () => {
  console.log('--- STARTING INTEGRATION VERIFICATION ---');

  try {
    // 1. Establish Database connections
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Connecting to Redis Cache...');
    await connectRedis();

    // Clean test records if exists
    console.log('Cleaning existing test records...');
    await User.deleteMany({ email: 'integration_test_user@example.com' });
    
    // 2. Create User
    console.log('Inserting test User...');
    const user = await User.create({
      email: 'integration_test_user@example.com',
      password: 'password123',
      role: 'Business Owner',
      isVerified: true,
      profile: {
        firstName: 'Integration',
        lastName: 'Tester',
        phone: '1234567890'
      }
    });
    console.log(`User created: ${user.email} (ID: ${user._id})`);

    // 3. Create Business
    console.log('Inserting test Business profile...');
    const business = await Business.create({
      owner: user._id,
      name: 'Integration Test Agri Farm',
      category: 'Agriculture',
      monthlyIncome: 65000,
      monthlyExpenses: 25000,
      businessAge: 18,
      location: {
        village: 'Greenvillage',
        district: 'AgriDistrict',
        state: 'AgriState'
      },
      bankDetails: {
        bankName: 'Agri Bank of India',
        accountNumber: '123498765432',
        ifscCode: 'AGRI0009876'
      }
    });
    console.log(`Business created: ${business.name} (ID: ${business._id})`);

    // 4. Create Transactions
    console.log('Inserting mock transactions ledger...');
    const t1 = await Transaction.create({
      business: business._id,
      type: 'Income',
      category: 'Sales',
      amount: 45000,
      paymentMethod: 'UPI',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    const t2 = await Transaction.create({
      business: business._id,
      type: 'Expense',
      category: 'Inventory',
      amount: 15000,
      paymentMethod: 'Cash',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    console.log(`Transactions inserted: 1 Income (Rs. ${t1.amount}), 1 Expense (Rs. ${t2.amount})`);

    // 5. FastAPI Connectivity Check
    console.log(`Pinging FastAPI health check at ${FASTAPI_URL}/health ...`);
    const health = await axios.get(`${FASTAPI_URL}/health`);
    console.log(`FastAPI Health Response:`, health.data);

    // 6. Evaluate Risk Score via FastAPI
    console.log('Requesting FastAPI risk rating evaluation...');
    const transactions = [t1, t2];
    const payload = {
      business_id: business._id.toString(),
      category: business.category,
      monthly_income: business.monthlyIncome,
      monthly_expenses: business.monthlyExpenses,
      business_age: business.businessAge,
      transactions: transactions.map(t => ({
        date: t.date.toISOString().split('T')[0],
        type: t.type,
        category: t.category,
        amount: t.amount,
        paymentMethod: t.paymentMethod
      }))
    };

    const riskResponse = await axios.post(`${FASTAPI_URL}/risk-score`, payload);
    console.log('FastAPI Risk Assessment Response:', riskResponse.data);

    const savedRisk = await RiskScore.create({
      business: business._id,
      score: riskResponse.data.score,
      color: riskResponse.data.color,
      severity: riskResponse.data.severity,
      triggeredFlags: riskResponse.data.triggered_flags,
      explainabilityData: riskResponse.data.explainability_data
    });
    console.log(`Saved RiskScore to DB: Score=${savedRisk.score}, Severity=${savedRisk.severity}`);

    // Clean up
    console.log('Cleaning up integration test user & records...');
    await Transaction.deleteMany({ business: business._id });
    await Business.deleteOne({ _id: business._id });
    await User.deleteOne({ _id: user._id });
    await RiskScore.deleteMany({ business: business._id });

    // Close sockets/clients
    await redisClient.disconnect();
    await mongoose.connection.close();
    console.log('--- INTEGRATION VERIFICATION COMPLETED SUCCESSFULLY ---');
    process.exit(0);

  } catch (error: any) {
    console.error('--- INTEGRATION VERIFICATION FAILED ---');
    console.error(error.message || error);
    process.exit(1);
  }
};

runVerification();
