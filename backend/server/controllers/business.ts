import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Business } from '../models';

export const createBusiness = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, monthlyIncome, monthlyExpenses, businessAge, location, bankDetails } = req.body;

    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
    const parsedBankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;

    // Handle document upload if file exists
    const documents = [];
    if (req.file) {
      documents.push({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype
      });
    }

    const business = await Business.create({
      owner: req.user._id,
      name,
      category,
      monthlyIncome: Number(monthlyIncome),
      monthlyExpenses: Number(monthlyExpenses),
      businessAge: Number(businessAge),
      location: parsedLocation,
      bankDetails: parsedBankDetails,
      documents
    });

    res.status(201).json(business);
  } catch (error: any) {
    console.error('Create Business Error:', error);
    res.status(500).json({ message: error.message || 'Server error during business profile creation' });
  }
};

export const getBusiness = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const business = await Business.findById(req.params.id).populate('owner', 'email profile');
    if (!business) {
      return res.status(404).json({ message: 'Business profile not found' });
    }

    // Role verification
    if (req.user.role === 'Business Owner' && business.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You do not own this business profile.' });
    }

    res.json(business);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBusiness = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business profile not found' });
    }

    if (req.user.role === 'Business Owner' && business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { name, category, monthlyIncome, monthlyExpenses, businessAge, location, bankDetails } = req.body;

    if (name) business.name = name;
    if (category) business.category = category;
    if (monthlyIncome !== undefined) business.monthlyIncome = Number(monthlyIncome);
    if (monthlyExpenses !== undefined) business.monthlyExpenses = Number(monthlyExpenses);
    if (businessAge !== undefined) business.businessAge = Number(businessAge);
    if (location) business.location = typeof location === 'string' ? JSON.parse(location) : location;
    if (bankDetails) business.bankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;

    if (req.file) {
      business.documents.push({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype
      });
    }

    const updated = await business.save();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBusiness = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (req.user.role !== 'Admin' && business.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await business.deleteOne();
    res.json({ message: 'Business profile removed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listBusinesses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter: any = {};

    if (req.user.role === 'Business Owner') {
      filter.owner = req.user._id;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const businesses = await Business.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Business.countDocuments(filter);

    res.json({
      data: businesses,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
