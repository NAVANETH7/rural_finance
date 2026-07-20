"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforairuralfinanceplatform2026');
            req.user = await models_1.User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'User not found. Authorization failed.' });
            }
            return next();
        }
        catch (error) {
            console.error('JWT Token Verification Error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided.' });
    }
};
exports.protect = protect;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user credentials missing.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Role '${req.user.role}' is not authorized for this resource.` });
        }
        next();
    };
};
exports.requireRole = requireRole;
