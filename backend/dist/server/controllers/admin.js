"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemHealth = exports.getLogs = exports.updateUserRole = exports.listUsers = void 0;
const models_1 = require("../models");
const os_1 = __importDefault(require("os"));
const mongoose_1 = __importDefault(require("mongoose"));
const listUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const filter = {};
        if (req.query.role) {
            filter.role = req.query.role;
        }
        if (req.query.search) {
            filter.email = { $regex: req.query.search, $options: 'i' };
        }
        const users = await models_1.User.find(filter)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        const total = await models_1.User.countDocuments(filter);
        res.json({
            data: users,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listUsers = listUsers;
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.role = role;
        await user.save();
        await models_1.Log.create({
            user: req.user._id,
            action: 'ADMIN_ROLE_CHANGE',
            details: `Changed role of user ${user.email} to ${role}.`,
            severity: 'warning'
        });
        res.json({ message: 'User role updated successfully', user });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateUserRole = updateUserRole;
const getLogs = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const logs = await models_1.Log.find({})
            .populate('user', 'email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await models_1.Log.countDocuments({});
        res.json({
            data: logs,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getLogs = getLogs;
const getSystemHealth = async (req, res) => {
    try {
        const uptime = os_1.default.uptime();
        const freeMem = os_1.default.freemem();
        const totalMem = os_1.default.totalmem();
        const cpuUsage = os_1.default.loadavg();
        const dbState = mongoose_1.default.connection.readyState; // 1 = connected
        res.json({
            platform: os_1.default.platform(),
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
            memory: {
                free: `${Math.round(freeMem / 1024 / 1024)} MB`,
                total: `${Math.round(totalMem / 1024 / 1024)} MB`,
                percentageUsed: `${Math.round(((totalMem - freeMem) / totalMem) * 100)}%`
            },
            cpu: cpuUsage,
            database: {
                status: dbState === 1 ? 'Connected' : 'Offline',
                name: mongoose_1.default.connection.name
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getSystemHealth = getSystemHealth;
