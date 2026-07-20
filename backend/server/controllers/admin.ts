import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { User, Log } from '../models';
import os from 'os';
import mongoose from 'mongoose';

export const listUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      filter.email = { $regex: req.query.search, $options: 'i' };
    }

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      data: users,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    await Log.create({
      user: req.user._id,
      action: 'ADMIN_ROLE_CHANGE',
      details: `Changed role of user ${user.email} to ${role}.`,
      severity: 'warning'
    });

    res.json({ message: 'User role updated successfully', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await Log.find({})
      .populate('user', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Log.countDocuments({});

    res.json({
      data: logs,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSystemHealth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uptime = os.uptime();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const cpuUsage = os.loadavg();
    const dbState = mongoose.connection.readyState; // 1 = connected

    res.json({
      platform: os.platform(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        free: `${Math.round(freeMem / 1024 / 1024)} MB`,
        total: `${Math.round(totalMem / 1024 / 1024)} MB`,
        percentageUsed: `${Math.round(((totalMem - freeMem) / totalMem) * 100)}%`
      },
      cpu: cpuUsage,
      database: {
        status: dbState === 1 ? 'Connected' : 'Offline',
        name: mongoose.connection.name
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
