import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";
import serverless from "serverless-http"; // ✅ Added

// configure env
dotenv.config();

// database config
connectDB();

// rest object
const app = express();

// middlewares
app.use(express.json());
app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.FRONTEND_BASE_URL || "http://localhost:3000",
    methods: "GET,POST,PUT,PATCH,DELETE",
    allowedHeaders: "Content-Type, Authorization",
  })
);

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

// ❌ REMOVE app.listen (Vercel does NOT allow running servers)
// app.listen(PORT, () => {
//   console.log(
//     `✅ Server Running in ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
//       .white
//   );
// });

// ✅ EXPORT SERVERLESS HANDLER FOR VERCEL
export const handler = serverless(app);
