import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";
import serverless from "serverless-http"; // Serverless adapter

// configure env
dotenv.config();

// database config
connectDB();

// rest object
const app = express();

// Global CORS fix for Vercel
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_BASE_URL || "http://localhost:3000"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// middlewares
app.use(express.json());
app.use(morgan("dev"));

// Normal CORS (still needed)
app.use(
  cors({
    origin: process.env.FRONTEND_BASE_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://amaz-kart-f.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(200).end();
});

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

// ❌ NO app.listen for Vercel

// ✅ EXPORT SERVERLESS HANDLER FOR VERCEL
export const handler = serverless(app);
