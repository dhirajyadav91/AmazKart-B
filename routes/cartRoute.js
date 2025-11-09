// import express from "express";
// import {
//   // ... your existing imports ...
//   addToCartController,
//   getCartController,
//   updateCartItemController,
//   removeCartItemController,
//   clearCartController,
// } from "../controllers/productController.js";

// import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// // ... your existing routes ...

// // Cart routes
// router.post("/cart/add", requireSignIn, addToCartController);
// router.get("/cart", requireSignIn, getCartController);
// router.put("/cart/update", requireSignIn, updateCartItemController);
// router.delete("/cart/remove/:itemId", requireSignIn, removeCartItemController);
// router.delete("/cart/clear", requireSignIn, clearCartController);

// export default router;