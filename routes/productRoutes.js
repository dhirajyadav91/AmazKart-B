import express from "express";
import {
  createProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  productPhotoController,
  realtedProductController,
  searchProductController,
  updateProductController,
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
  getRazorpayKeyController,
  addToCartController,
  getCartController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
} from "../controllers/productController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import formidable from "express-formidable";
import productModel from "../models/productModel.js";

const router = express.Router();

// ==================== DEBUG ROUTES ====================
router.get("/debug-all-products", async (req, res) => {
  try {
    const products = await productModel.find({}, {name: 1, slug: 1, _id: 1, category: 1});
    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/debug-product/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    console.log("🔧 Debug - Checking slug:", slug);
    
    const product = await productModel.findOne({ slug: slug });
    
    if (!product) {
      const availableSlugs = await productModel.distinct("slug");
      return res.status(404).json({
        success: false,
        message: `Product with slug '${slug}' not found in database`,
        availableSlugs: availableSlugs
      });
    }
    
    res.json({
      success: true,
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        price: product.price,
        description: product.description
      }
    });
  } catch (error) {
    console.error("🔧 Debug Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== PRODUCT ROUTES ====================
// Create product
router.post(
  "/create-product",
  requireSignIn,
  isAdmin,
  formidable(),
  createProductController
);

// Update product
router.put(
  "/update-product/:pid",
  requireSignIn,
  isAdmin,
  formidable(),
  updateProductController
);

// Get all products
router.get("/get-product", getProductController);

// Get single product by slug
router.get("/get-product/:slug", getSingleProductController);

// Get product photo
router.get("/product-photo/:pid", productPhotoController);

// Delete product
router.delete(
  "/delete-product/:pid", 
  requireSignIn, 
  isAdmin, 
  deleteProductController
);

// Filter products
router.post("/product-filters", productFiltersController);

// Product count
router.get("/product-count", productCountController);

// Product list with pagination
router.get("/product-list/:page", productListController);

// Search products
router.get("/search/:keyword", searchProductController);

// Similar products
router.get("/related-product/:pid/:cid", realtedProductController);

// Category wise products
router.get("/product-category/:slug", productCategoryController);

// ==================== RAZORPAY PAYMENT ROUTES ====================
router.post(
  "/create-razorpay-order", 
  requireSignIn, 
  createRazorpayOrderController
);

router.post(
  "/verify-razorpay-payment", 
  requireSignIn, 
  verifyRazorpayPaymentController
);

router.get("/get-razorpay-key", getRazorpayKeyController);

// ==================== CART ROUTES ====================
router.post("/cart/add", requireSignIn, addToCartController);
router.get("/cart", requireSignIn, getCartController);
router.put("/cart/update", requireSignIn, updateCartItemController);
router.delete("/cart/remove/:itemId", requireSignIn, removeCartItemController);
router.delete("/cart/clear", requireSignIn, clearCartController);

export default router;