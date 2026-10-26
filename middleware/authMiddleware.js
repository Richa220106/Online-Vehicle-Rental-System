// Authentication middleware to protect endpoints that require customer login
function requireAuth(req, res, next) {
  if (req.session && req.session.customer) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Unauthorized. Please log in to perform this action.'
  });
}

module.exports = {
  requireAuth
};
