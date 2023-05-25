const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const validateToken = asyncHandler(async (req, res, next) => {
  let token;
  let authHeader = req.headers.Authorization || req.headers.authorization;
  if (!authHeader || authHeader == undefined) {
    res.status(401);
    throw new Error("Authorization token missing");
  } else if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        res.status(401);
        throw new Error("User is not authorized");
      }
      const currentUser = await User.findById(decoded.user.id);
      req.user = currentUser;
      next();
    });
    if (!token) {
      res.status(401);
      throw new Error("User is not authorized or token is missing");
    }
  }
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.some((element) => req.user.role.includes(element))) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

module.exports = { validateToken, restrictTo };
