import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";

// configure env
dotenv.config();

// database config
connectDB();

// rest object
const app = express();

// middlewares
app.use(express.json());
app.use(morgan("dev"));

const corsOptions = {
  origin: process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// test route
app.get("/api/test", (req, res) => {
  res.json({ message: "CORS setup working ✅" });
});

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// base route
app.get("/", (req, res) => {
  res.send("<h1>Server is running 🚀</h1>");
});

// ⭐ Normal Server - Required for Render & Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`.bgCyan.white);
});

export default app;
