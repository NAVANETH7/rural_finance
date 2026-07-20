"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const db_1 = require("../config/db");
const redis_1 = require("../config/redis");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const runVerification = async () => {
    console.log('--- STARTING INTEGRATION VERIFICATION ---');
    try {
        // 1. Establish Database connections
        console.log('Connecting to database...');
        await (0, db_1.connectDB)();
        console.log('Connecting to Redis Cache...');
        await (0, redis_1.connectRedis)();
        // Clean test records if exists
        console.log('Cleaning existing test records...');
        await models_1.User.deleteMany({ email: 'integration_test_user@example.com' });
        // 2. Create User
        console.log('Inserting test User...');
        const user = await models_1.User.create({
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
        const business = await models_1.Business.create({
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
        const t1 = await models_1.Transaction.create({
            business: business._id,
            type: 'Income',
            category: 'Sales',
            amount: 45000,
            paymentMethod: 'UPI',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        });
        const t2 = await models_1.Transaction.create({
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
        const health = await axios_1.default.get(`${FASTAPI_URL}/health`);
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
        const riskResponse = await axios_1.default.post(`${FASTAPI_URL}/risk-score`, payload);
        console.log('FastAPI Risk Assessment Response:', riskResponse.data);
        const savedRisk = await models_1.RiskScore.create({
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
        await models_1.Transaction.deleteMany({ business: business._id });
        await models_1.Business.deleteOne({ _id: business._id });
        await models_1.User.deleteOne({ _id: user._id });
        await models_1.RiskScore.deleteMany({ business: business._id });
        // Close sockets/clients
        await redis_1.redisClient.disconnect();
        await mongoose_1.default.connection.close();
        console.log('--- INTEGRATION VERIFICATION COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    }
    catch (error) {
        console.error('--- INTEGRATION VERIFICATION FAILED ---');
        console.error(error.message || error);
        process.exit(1);
    }
};
runVerification();
