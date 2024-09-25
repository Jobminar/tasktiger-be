import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  //  token from the request headers________//
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // Verify the token..
    const { userId } = jwt.verify(authorization, process.env.JWT_SECRET);

    // Attach the user ID from the token to the request object_________
    req.userId = userId;

    // next middleware_________
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
