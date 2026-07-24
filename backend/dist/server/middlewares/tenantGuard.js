"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantGuard = void 0;
const tenantGuard = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized: No user session found' });
        }
        // Platform Admins can see all tenants
        if (req.user.role === 'Admin') {
            req.tenantId = req.headers['x-tenant-id'] || req.user.tenantId || null;
            return next();
        }
        // Bank Officers and Tenant Admins are locked to their own tenantId
        if (req.user.tenantId) {
            req.tenantId = req.user.tenantId;
        }
        else {
            req.tenantId = null;
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Tenant isolation check failed: ' + error.message });
    }
};
exports.tenantGuard = tenantGuard;
