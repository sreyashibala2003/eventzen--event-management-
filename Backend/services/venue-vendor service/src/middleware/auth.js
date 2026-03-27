import jwt from 'jsonwebtoken';
import config from '../config/index.js';

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

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_TOKEN_MISSING',
        message: 'JWT token is required'
      });
    }

    // Verify JWT token
    let decoded;

    // Development bypass for testing
    if (config.jwt.skipVerification && token.endsWith('mock_signature')) {
      console.log('🔧 DEV MODE: Bypassing JWT signature verification for test token');
      try {
        // Parse the token payload directly without signature verification
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('🔧 DEV MODE: Decoded test token payload:', decoded);
      } catch (parseError) {
        console.error('🚨 DEV MODE: Failed to parse test token:', parseError);
        throw parseError;
      }
    } else {
      // Normal JWT verification with RSA public key
      const publicKey = `-----BEGIN PUBLIC KEY-----\n${config.jwt.publicKey}\n-----END PUBLIC KEY-----`;
      decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    }

    // Extract user information from token
    // Auth service uses 'sub' for user ID and 'roles' (array) for roles
    const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
    const primaryRole = roles.length > 0 ? roles[0] : null;

    req.user = {
      userId: decoded.sub || decoded.userId || decoded.user_id,
      email: decoded.email,
      role: primaryRole, // Extract first role from roles array
      roles: roles, // Keep full roles array for reference
      permissions: decoded.permissions || [],
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();
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
      // No token provided, proceed without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify JWT token if present
    let decoded;

    // Development bypass for testing
    if (config.jwt.skipVerification && token.endsWith('mock_signature')) {
      console.log('🔧 DEV MODE: Bypassing JWT signature verification for test token (optional auth)');
      try {
        // Parse the token payload directly without signature verification
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      } catch (parseError) {
        console.error('🚨 DEV MODE: Failed to parse test token:', parseError);
        req.user = null;
        return next();
      }
    } else {
      // Normal JWT verification with RSA public key
      const publicKey = `-----BEGIN PUBLIC KEY-----\n${config.jwt.publicKey}\n-----END PUBLIC KEY-----`;
      decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    }

    // Extract user information from token
    // Auth service uses 'sub' for user ID and 'roles' (array) for roles
    const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
    const primaryRole = roles.length > 0 ? roles[0] : null;

    req.user = {
      userId: decoded.sub || decoded.userId || decoded.user_id,
      email: decoded.email,
      role: primaryRole, // Extract first role from roles array
      roles: roles, // Keep full roles array for reference
      permissions: decoded.permissions || [],
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();
  } catch (error) {
    // If token is invalid, proceed without authentication
    req.user = null;
    next();
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

    // Check if user has any of the required roles (case insensitive)
    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = roles.map(role => role.toLowerCase());
    const hasRequiredRole = roles.length === 0 || normalizedRoles.includes(userRole);

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        userRole: req.user.role
      });
    }

    next();
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

    // Check if user has all required permissions
    const hasAllPermissions = permissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Required permissions: ${permissions.join(', ')}`,
        userPermissions: userPermissions
      });
    }

    next();
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

    // Admins can access any resource (case insensitive)
    const userRole = req.user.role?.toLowerCase();
    if (['admin', 'super_admin'].includes(userRole)) {
      return next();
    }

    // Check if user owns the resource (will be validated in the controller)
    req.requireOwnershipCheck = {
      userId: req.user.userId,
      field: resourceUserIdField
    };

    next();
  };
};

/**
 * Rate Limiting by User Role
 * Different rate limits for different user roles
 */
export const getRateLimitByRole = (user) => {
  if (!user) {
    return { max: 100, windowMs: 15 * 60 * 1000 }; // Anonymous users: 100 req/15min
  }

  switch (user.role?.toLowerCase()) {
    case 'admin':
    case 'super_admin':
      return { max: 5000, windowMs: 15 * 60 * 1000 }; // Admin: 5000 req/15min
    case 'organizer':
      return { max: 2000, windowMs: 15 * 60 * 1000 }; // Organizer: 2000 req/15min
    case 'vendor':
      return { max: 1500, windowMs: 15 * 60 * 1000 }; // Vendor: 1500 req/15min
    default:
      return { max: 1000, windowMs: 15 * 60 * 1000 }; // Regular users: 1000 req/15min
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

    // Validate API key (in production, this should be more secure)
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_API_KEY',
        message: 'Invalid API key provided'
      });
    }

    // Set service information
    req.service = {
      apiKey: apiKey,
      type: 'internal_service'
    };

    next();
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
    let decoded;

    // Development bypass for testing
    if (config.jwt.skipVerification && token.endsWith('mock_signature')) {
      console.log('🔧 DEV MODE: Bypassing JWT signature verification for test token (validation)');
      try {
        // Parse the token payload directly without signature verification
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      } catch (parseError) {
        return {
          valid: false,
          error: 'Invalid test token format: ' + parseError.message
        };
      }
    } else {
      // Normal JWT verification with RSA public key
      const publicKey = `-----BEGIN PUBLIC KEY-----\n${config.jwt.publicKey}\n-----END PUBLIC KEY-----`;
      decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    }

    // Extract user information from token
    // Auth service uses 'sub' for user ID and 'roles' (array) for roles
    const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
    const primaryRole = roles.length > 0 ? roles[0] : null;

    return {
      valid: true,
      user: {
        userId: decoded.sub || decoded.userId || decoded.user_id,
        email: decoded.email,
        role: primaryRole,
        roles: roles,
        permissions: decoded.permissions || []
      }
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