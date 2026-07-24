import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  user?: any;
  tenantId?: string | null;
}

export const tenantGuard = (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No user session found' });
    }

    // Platform Admins can see all tenants
    if (req.user.role === 'Admin') {
      req.tenantId = (req.headers['x-tenant-id'] as string) || req.user.tenantId || null;
      return next();
    }

    // Bank Officers and Tenant Admins are locked to their own tenantId
    if (req.user.tenantId) {
      req.tenantId = req.user.tenantId;
    } else {
      req.tenantId = null;
    }

    next();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Tenant isolation check failed: ' + error.message });
  }
};
