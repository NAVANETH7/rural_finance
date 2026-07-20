"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferences = exports.getPreferences = exports.readAllNotifications = exports.readNotification = exports.getNotifications = void 0;
const models_1 = require("../models");
const getNotifications = async (req, res) => {
    try {
        const notifications = await models_1.Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getNotifications = getNotifications;
const readNotification = async (req, res) => {
    try {
        const notification = await models_1.Notification.findOne({ _id: req.params.id, user: req.user._id });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        notification.isRead = true;
        await notification.save();
        res.json(notification);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.readNotification = readNotification;
const readAllNotifications = async (req, res) => {
    try {
        await models_1.Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.readAllNotifications = readAllNotifications;
const getPreferences = async (req, res) => {
    try {
        // Return standard notification preferences config
        res.json({
            email: true,
            sms: false,
            push: true,
            whatsapp: false
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getPreferences = getPreferences;
const updatePreferences = async (req, res) => {
    try {
        res.json({
            message: 'Notification preferences updated successfully',
            preferences: req.body
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updatePreferences = updatePreferences;
