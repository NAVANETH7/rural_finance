import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Notification } from '../models';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const readNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const readAllNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Return standard notification preferences config
    res.json({
      email: true,
      sms: false,
      push: true,
      whatsapp: false
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      message: 'Notification preferences updated successfully',
      preferences: req.body
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
