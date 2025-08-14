import jwt from 'jsonwebtoken';
import User from '../data/users.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

export const canAccessDepartment = (req, res, next) => {
  const { department } = req.params;
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  // Super admin can access all departments
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Admin can access only their own department
  if (req.user.role === 'admin') {
    if (req.user.department === department) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Admin is not authorized to access this department'
    });
  }

  // Regular users can only access their own department
  if (req.user.department !== department) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this department'
    });
  }

  next();
}; 