import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { introspectAccessToken } from '../services/authClient.js';

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

const buildUserFromIntrospection = (payload) => buildUser({
  sub: payload.sub,
  email: payload.email,
  role: payload.roles?.[0] || null,
  roles: payload.roles || [],
  permissions: payload.permissions || [],
  iat: payload.iat ?? (
    payload.issuedAt ? Math.floor(new Date(payload.issuedAt).getTime() / 1000) : undefined
  ),
  exp: payload.exp ?? (
    payload.expiresAt ? Math.floor(new Date(payload.expiresAt).getTime() / 1000) : undefined
  )
});

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

const verifyJwtLocally = (token) => {
  if (config.jwt.skipVerification) {
    return decodeDevToken(token);
  }

  const publicKey = formatPublicKey(config.jwt.publicKey);
  if (!publicKey) {
    throw new jwt.JsonWebTokenError('JWT public key is not configured');
  }

  return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
};

const verifyJwt = async (token) => {
  try {
    return buildUser(verifyJwtLocally(token));
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw error;
    }

    try {
      const introspection = await introspectAccessToken(token);
      if (introspection?.active) {
        return buildUserFromIntrospection(introspection);
      }
    } catch (introspectionError) {
      if (introspectionError.response?.status === 401) {
        throw error;
      }
    }

    throw error;
  }
};

export const authenticate = async (req, res, next) => {
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
    req.user = await verifyJwt(token);
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'JWT token has expired'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid JWT token'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    req.user = await verifyJwt(authHeader.substring(7));
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};

export const requireOwnershipOrAdmin = (ownerField = 'created_by') => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required for this endpoint'
    });
  }

  const role = req.user.role?.toLowerCase();
  if (role === 'admin' || role === 'super_admin') {
    return next();
  }

  req.requireOwnershipCheck = {
    userId: req.user.userId,
    field: ownerField
  };

  return next();
};

export const requireAdmin = (req, res, next) => {
  const roles = [req.user?.role, ...(req.user?.roles || [])]
    .filter(Boolean)
    .map((role) => String(role).toLowerCase().replace(/^role_/, ''));

  if (roles.includes('admin') || roles.includes('super_admin')) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'INSUFFICIENT_PERMISSIONS',
    message: 'Admin access is required'
  });
};
