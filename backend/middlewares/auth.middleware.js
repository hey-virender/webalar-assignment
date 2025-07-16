import { verifyToken } from "../utils/jwt.js";

// Authenticate Token and set user in request

export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  req.user = user; 
  next();
};
