import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

export const requireSignIn = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({ message: "No token provided" });
    }

    // Handle both "Bearer <token>" and "<token>"
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    const decode = JWT.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({ message: "Invalid token" });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (user.role !== 1) {
      return res.status(403).send({ message: "Admin access denied" });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({ message: "Auth error" });
  }
};
