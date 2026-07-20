import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Log } from '../models';

const generateAccessToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforairuralfinanceplatform2026', {
    expiresIn: '1d'
  });
};

const generateRefreshToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforairuralfinanceplatform2026', {
    expiresIn: '7d'
  });
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      otpCode,
      otpExpires,
      profile: { firstName, lastName, phone }
    });

    console.log(`[OTP Verification] User: ${email}, OTP: ${otpCode}`);

    await Log.create({
      user: user._id,
      action: 'USER_SIGNUP',
      details: `User registered successfully. Role: ${role}. OTP generated.`,
      severity: 'info'
    });

    res.status(201).json({
      message: 'Registration successful. Verify using the OTP code sent.',
      email: user.email
    });
  } catch (error: any) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: error.message || 'Server error during signup' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please verify OTP first.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    await Log.create({
      user: user._id,
      action: 'USER_LOGIN',
      details: 'User authenticated successfully.',
      severity: 'info'
    });

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otpCode } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (user.otpCode !== otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      const isConnected = require('mongoose').connection.readyState === 1;
      if (!isConnected && otpCode === '123456') {
        // Accept 123456 bypass in mock mode
      } else {
        return res.status(400).json({ message: 'Invalid or expired OTP code' });
      }
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    await Log.create({
      user: user._id,
      action: 'OTP_VERIFICATION',
      details: 'User successfully completed OTP verification.',
      severity: 'info'
    });

    res.json({ message: 'Account verified successfully. You can now login.' });
  } catch (error: any) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ message: error.message || 'Server error during OTP verification' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otpCode;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    console.log(`[Password Reset OTP] User: ${email}, OTP: ${otpCode}`);

    res.json({ message: 'Password reset verification code generated.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.otpCode !== otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    await Log.create({
      user: user._id,
      action: 'PASSWORD_RESET',
      details: 'User password was reset successfully.',
      severity: 'info'
    });

    res.json({ message: 'Password reset successful.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
