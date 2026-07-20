"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dns_1 = __importDefault(require("dns"));
const connectDB = async () => {
    try {
        // Force Node to use Google's DNS servers to resolve MongoDB Atlas SRV records correctly
        try {
            dns_1.default.setServers(['8.8.8.8', '8.8.4.4']);
            console.log('Configured custom Google DNS servers for Atlas resolution.');
        }
        catch (dnsErr) {
            console.warn('Failed to set custom DNS servers. Falling back to system resolver.');
        }
        const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/ruralfinance';
        await mongoose_1.default.connect(connStr);
        console.log('MongoDB Connected successfully.');
        // Auto-seed default roles if database user collection is empty
        const count = await User_1.User.countDocuments({});
        if (count === 0) {
            console.log('Database is empty. Auto-seeding default credentials...');
            const hashedPassword = bcryptjs_1.default.hashSync('password123', 10);
            const defaultUsers = [
                {
                    _id: new mongoose_1.default.Types.ObjectId('60c72b2f9b1d8b22a84d2d4f'),
                    email: 'test_new_user@test.com',
                    password: hashedPassword,
                    role: 'Business Owner',
                    isVerified: true,
                    profile: { firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543210' }
                },
                {
                    _id: new mongoose_1.default.Types.ObjectId('60c72b2f9b1d8b22a84d2d50'),
                    email: 'officer@example.com',
                    password: hashedPassword,
                    role: 'Bank Officer',
                    isVerified: true,
                    profile: { firstName: 'Amit', lastName: 'Sharma', phone: '9876543211' }
                },
                {
                    _id: new mongoose_1.default.Types.ObjectId('60c72b2f9b1d8b22a84d2d51'),
                    email: 'admin@example.com',
                    password: hashedPassword,
                    role: 'Admin',
                    isVerified: true,
                    profile: { firstName: 'Sanjay', lastName: 'Verma', phone: '9876543212' }
                }
            ];
            await User_1.User.insertMany(defaultUsers);
            console.log('Successfully seeded default credentials on remote database.');
        }
    }
    catch (error) {
        console.warn('Database Connection Failed. Operating in local Mock DB Mode.', error);
    }
};
exports.connectDB = connectDB;
