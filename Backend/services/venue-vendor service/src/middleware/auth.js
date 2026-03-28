import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const decodeDevToken = (token) => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  return JSON.parse(Buffer.from(parts[1], 'base64').toString());
};

const formatPublicKey = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes('BEGIN PUBLIC KEY')) {
    return trimmed.replace(/\\n/g, '\n');
  }

  return `-----BEGIN PUBLIC KEY-----\n${trimmed}\n-----END PUBLIC KEY-----`;
};

const buildUser = (decoded) => {
  const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
  const primaryRole = roles.length > 0 ? roles[0] : null;

  return {
    userId: decoded.sub || decoded.userId || decoded.user_id,
    email: decoded.email,
    role: primaryRole,
    roles,
    permissions: decoded.permissions || [],
    iat: decoded.iat,
    exp: decoded.exp
  };
};

const verifyJwt = (token) => {
  if (config.jwt.skipVerification) {
    return decodeDevToken(token);
  }

  const publicKey = formatPublicKey(config.jwt.publicKey);
  if (!publicKey) {
    throw new jwt.JsonWebTokenError('JWT public key is not configured');
  }

  return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
};

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and extracts user information
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_TOKEN_MISSING',
        message: 'Authorization header is required'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_AUTH_FORMAT',
        message: 'Authorization header must start with "Bearer "'
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_TOKEN_MISSING',
        message: 'JWT token is required'
      });
    }

    req.user = buildUser(verifyJwt(token));
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'JWT token has expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid JWT token'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Internal authentication error'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Validates JWT token if present, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    req.user = buildUser(verifyJwt(token));
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required for this endpoint'
      });
    }

    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        error: 'ROLE_MISSING',
        message: 'User role information is missing'
      });
    }

    const userRoles = [req.user.role, ...(req.user.roles || [])]
      .filter(Boolean)
      .map((role) => String(role).toLowerCase().replace(/^role_/, ''));

    const normalizedRoles = roles.map((role) =>
      String(role).toLowerCase().replace(/^role_/, '')
    );

    const hasRequiredRole =
      roles.length === 0 || normalizedRoles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        userRole: req.user.role
      });
    }

    return next();
  };
};

/**
 * Permission-based Authorization Middleware
 * Checks if user has specific permissions
 */
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required for this endpoint'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = permissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Required permissions: ${permissions.join(', ')}`,
        userPermissions
      });
    }

    return next();
  };
};

/**
 * Admin Authorization Middleware
 * Shorthand for admin role requirement (case insensitive)
 */
export const requireAdmin = authorize('admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN');

/**
 * Organizer Authorization Middleware
 * Allows organizers and admins
 */
export const requireOrganizer = authorize('organizer', 'admin', 'super_admin');

/**
 * Vendor Authorization Middleware
 * Allows vendors and admins to access vendor-related endpoints
 */
export const requireVendor = authorize('vendor', 'admin', 'super_admin');

/**
 * Resource Owner Authorization Middleware
 * Checks if user owns the resource or is an admin
 */
export const requireOwnershipOrAdmin = (resourceUserIdField = 'created_by') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required for this endpoint'
      });
    }

    const userRole = req.user.role?.toLowerCase();
    if (['admin', 'super_admin'].includes(userRole)) {
      return next();
    }

    req.requireOwnershipCheck = {
      userId: req.user.userId,
      field: resourceUserIdField
    };

    return next();
  };
};

/**
 * Rate Limiting by User Role
 * Different rate limits for different user roles
 */
export const getRateLimitByRole = (user) => {
  if (!user) {
    return { max: 100, windowMs: 15 * 60 * 1000 };
  }

  switch (user.role?.toLowerCase()) {
    case 'admin':
    case 'super_admin':
      return { max: 5000, windowMs: 15 * 60 * 1000 };
    case 'organizer':
      return { max: 2000, windowMs: 15 * 60 * 1000 };
    case 'vendor':
      return { max: 1500, windowMs: 15 * 60 * 1000 };
    default:
      return { max: 1000, windowMs: 15 * 60 * 1000 };
  }
};

/**
 * API Key Authentication Middleware
 * For service-to-service communication
 */
export const authenticateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API_KEY_MISSING',
        message: 'API key is required for service-to-service communication'
      });
    }

    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_API_KEY',
        message: 'Invalid API key provided'
      });
    }

    req.service = {
      apiKey,
      type: 'internal_service'
    };

    return next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Internal authentication error'
    });
  }
};

/**
 * Validate Token Utility Function
 * For manual token validation in controllers
 */
export const validateToken = (token) => {
  try {
    return {
      valid: true,
      user: buildUser(verifyJwt(token))
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

export default {
  authenticate,
  optionalAuth,
  authorize,
  requirePermission,
  requireAdmin,
  requireOrganizer,
  requireVendor,
  requireOwnershipOrAdmin,
  getRateLimitByRole,
  authenticateApiKey,
  validateToken
};
