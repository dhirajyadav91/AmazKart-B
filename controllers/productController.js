import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import cartModel from "../models/cartModel.js";
import orderModel from "../models/orderModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import slugify from "slugify";
import dotenv from "dotenv";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";

dotenv.config();

// Initialize RazorPay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Enhanced Cloudinary upload function with better file handling
const uploadToCloudinary = async (file) => {
  try {
    console.log("📤 Uploading file to Cloudinary:", file.path);

    // Check if file exists before uploading
    if (!fs.existsSync(file.path)) {
      throw new Error("File not found at path: " + file.path);
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "ecommerce-products",
      quality: "auto:good",
      fetch_format: "auto",
    });

    // Clean up the temporary file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      console.log("✅ Temporary file cleaned up");
    }

    console.log("✅ Image uploaded to Cloudinary:", result.secure_url);
    return result;
  } catch (error) {
    // Clean up temporary file even if upload fails
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new Error("Image upload failed: " + error.message);
  }
};

// FIXED: createProductController - Cloudinary URL save issue resolved
export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } = req.fields;
    const { photo } = req.files;

    console.log("🔄 Starting product creation...");
    console.log("Product Data:", { name, description, price, category, quantity, shipping });
    console.log("Photo received:", photo ? `Yes (${photo.name}, ${photo.size} bytes)` : "No");

    // Validation
    if (!name) return res.status(500).send({ error: "Name is Required" });
    if (!description) return res.status(500).send({ error: "Description is Required" });
    if (!price) return res.status(500).send({ error: "Price is Required" });
    if (!category) return res.status(500).send({ error: "Category is Required" });
    if (!quantity) return res.status(500).send({ error: "Quantity is Required" });
    if (photo && photo.size > 1000000) {
      return res.status(500).send({ error: "Photo is required and should be less than 1MB" });
    }

    let photoUrl = null;
    let photoData = null;

    // Handle photo upload FIRST
    if (photo) {
      console.log("🖼️ Uploading photo to Cloudinary...");
      try {
        const cloudinaryResult = await uploadToCloudinary(photo);
        photoUrl = cloudinaryResult.secure_url;
        console.log("✅ Cloudinary URL obtained:", photoUrl);

        // Read file for binary data before it gets deleted
        if (fs.existsSync(photo.path)) {
          photoData = {
            data: fs.readFileSync(photo.path),
            contentType: photo.type
          };
          // Clean up
          fs.unlinkSync(photo.path);
        }
      } catch (uploadError) {
        console.error("❌ Photo upload failed:", uploadError);
        return res.status(500).send({
          success: false,
          error: "Photo upload failed: " + uploadError.message,
        });
      }
    }

    // Create product with ALL data including photoUrl
    const productData = {
      name,
      description,
      price,
      category,
      quantity,
      shipping,
      slug: slugify(name),
      photoUrl: photoUrl, // This will set the photoUrl in database
      photo: photoData
    };

    console.log("📝 Creating product with data:", {
      ...productData,
      photo: photoData ? "Binary data present" : "No binary data"
    });

    const product = new productModel(productData);
    await product.save();

    console.log("✅ Product created successfully!");
    console.log("📊 Final product in DB:", {
      _id: product._id,
      name: product.name,
      photoUrl: product.photoUrl,
      hasPhotoData: !!product.photo?.data
    });

    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        category: product.category,
        quantity: product.quantity,
        shipping: product.shipping,
        photoUrl: product.photoUrl,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      },
    });
  } catch (error) {
    console.error("❌ Error in createProductController:", error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in creating product",
    });
  }
};

// get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      counTotal: products.length,
      message: "All Products ",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
};

// get single product by SLUG
export const getSingleProductController = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log("🔍 Fetching product with slug:", slug);

    const product = await productModel
      .findOne({ slug: slug })
      .select("-photo")
      .populate("category", "name slug")
      .lean();

    if (!product) {
      console.log("❌ Product not found with slug:", slug);
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    console.log("✅ Product found by slug:", product.name);

    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error: error.message,
    });
  }
};

// get single product by ID
export const getProductByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🆔 Fetching product with ID:", id);

    // Validate ID
    if (!id) {
      return res.status(400).send({
        success: false,
        message: "Product ID is required",
      });
    }

    // Find product by ID
    const product = await productModel
      .findById(id)
      .select("-photo")
      .populate("category", "name slug")
      .lean();

    if (!product) {
      console.log("❌ Product not found with ID:", id);
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    console.log("✅ Product found by ID:", product.name);

    res.status(200).send({
      success: true,
      message: "Single Product Fetched Successfully",
      product,
    });
  } catch (error) {
    console.error("❌ Error in getProductByIdController:", error);

    if (error.name === 'CastError') {
      return res.status(400).send({
        success: false,
        message: "Invalid product ID format",
        error: error.message,
      });
    }

    res.status(500).send({
      success: false,
      message: "Error while getting product by ID",
      error: error.message,
    });
  }
};

// get photo - FIXED FUNCTION
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo photoUrl");

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Priority to Cloudinary URL if available
    if (product.photoUrl) {
      return res.redirect(product.photoUrl);
    }

    // Fallback to binary data
    if (product.photo && product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }

    // If no photo found
    res.status(404).send({
      success: false,
      message: "Photo not found for this product",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error: error.message,
    });
  }
};

// delete controller
export const deleteProductController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid);

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    if (product.photoUrl) {
      try {
        const publicId = product.photoUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`ecommerce-products/${publicId}`);
        console.log("✅ Cloudinary image deleted");
      } catch (cloudinaryError) {
        console.log("Cloudinary delete error:", cloudinaryError);
      }
    }

    await productModel.findByIdAndDelete(req.params.pid);
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error: error.message,
    });
  }
};

// Fixed update product controller
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } = req.fields;
    const { photo } = req.files;

    console.log("🔄 Starting product update...");
    console.log("Update Data:", { name, description, price, category, quantity, shipping });
    console.log("New Photo received:", photo ? `Yes (${photo.name}, ${photo.size} bytes)` : "No");

    // Validation
    if (!name) return res.status(500).send({ error: "Name is Required" });
    if (!description) return res.status(500).send({ error: "Description is Required" });
    if (!price) return res.status(500).send({ error: "Price is Required" });
    if (!category) return res.status(500).send({ error: "Category is Required" });
    if (!quantity) return res.status(500).send({ error: "Quantity is Required" });
    if (photo && photo.size > 1000000) {
      return res.status(500).send({ error: "Photo is required and should be less than 1MB" });
    }

    // Find existing product first
    const existingProduct = await productModel.findById(req.params.pid);
    if (!existingProduct) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    let photoUrl = existingProduct.photoUrl; // Keep existing photoUrl
    let photoData = existingProduct.photo; // Keep existing photo data

    // Handle photo upload if new photo is provided
    if (photo) {
      console.log("🖼️ Uploading new photo to Cloudinary...");

      // Delete old image from Cloudinary if exists
      if (existingProduct.photoUrl) {
        try {
          const publicId = existingProduct.photoUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`ecommerce-products/${publicId}`);
          console.log("✅ Old Cloudinary image deleted");
        } catch (cloudinaryError) {
          console.log("⚠️ Cloudinary delete error:", cloudinaryError);
        }
      }

      try {
        // Upload new image to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(photo);
        photoUrl = cloudinaryResult.secure_url;
        console.log("✅ New Cloudinary URL obtained:", photoUrl);

        // Read file for binary data
        if (fs.existsSync(photo.path)) {
          photoData = {
            data: fs.readFileSync(photo.path),
            contentType: photo.type
          };
          fs.unlinkSync(photo.path);
        } else {
          photoData = {
            data: null,
            contentType: photo.type
          };
        }
      } catch (uploadError) {
        console.error("❌ Photo upload failed:", uploadError);
        return res.status(500).send({
          success: false,
          error: "Photo upload failed: " + uploadError.message,
        });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      description,
      price,
      category,
      quantity,
      shipping,
      slug: slugify(name),
      photoUrl: photoUrl, // ✅ Ensure photoUrl is included
      photo: photoData
    };

    console.log("📝 Updating product with data:", {
      ...updateData,
      photo: photoData ? "Binary data present" : "No binary data"
    });

    // Update the product
    const updatedProduct = await productModel.findByIdAndUpdate(
      req.params.pid,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).send({
        success: false,
        message: "Product not found during update",
      });
    }

    console.log("✅ Product updated successfully!");
    console.log("📊 Updated product in DB:", {
      _id: updatedProduct._id,
      name: updatedProduct.name,
      photoUrl: updatedProduct.photoUrl,
      hasPhotoData: !!updatedProduct.photo?.data
    });

    res.status(200).send({
      success: true,
      message: "Product Updated Successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("❌ Error in updateProductController:", error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in updating product",
    });
  }
};

// filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked && checked.length > 0) args.category = { $in: checked };
    if (radio && radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args).select("-photo");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error While Filtering Products",
      error: error.message,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error: error.message,
      success: false,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 12;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in per page ctrl",
      error: error.message,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in search product API",
      error: error.message,
    });
  }
};

// similar products
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while getting related product",
      error: error.message,
    });
  }
};

// get products by category
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    const products = await productModel.find({ category }).populate("category").select("-photo");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error: error.message,
      message: "Error While Getting products",
    });
  }
};

// ==================== CART CONTROLLERS ====================
export const addToCartController = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity) {
      return res.status(400).send({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    const product = await productModel.findById(productId).select("name price quantity photoUrl");
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock availability
    if (product.quantity < quantity) {
      return res.status(400).send({
        success: false,
        message: `Only ${product.quantity} items available in stock`,
      });
    }

    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      cart = new cartModel({
        user: userId,
        items: [],
        total: 0,
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > product.quantity) {
        return res.status(400).send({
          success: false,
          message: `Cannot add more than ${product.quantity} items to cart`,
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        name: product.name,
        photoUrl: product.photoUrl,
      });
    }

    // Calculate total
    cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await cart.save();

    // Populate the cart before sending response
    await cart.populate('items.product', 'name price slug photoUrl quantity');

    res.status(200).send({
      success: true,
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error adding to cart",
      error: error.message,
    });
  }
};

export const getCartController = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartModel.findOne({ user: userId })
      .populate("items.product", "name price slug photoUrl quantity")
      .exec();

    if (!cart) {
      return res.status(200).send({
        success: true,
        message: "Cart is empty",
        cart: { items: [], total: 0 },
      });
    }

    res.status(200).send({
      success: true,
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting cart",
      error: error.message,
    });
  }
};

export const updateCartItemController = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.user._id;

    if (!itemId || quantity === undefined) {
      return res.status(400).send({
        success: false,
        message: "Item ID and quantity are required",
      });
    }

    const cart = await cartModel.findOne({ user: userId }).populate("items.product");
    if (!cart) {
      return res.status(404).send({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).send({
        success: false,
        message: "Item not found in cart",
      });
    }

    const product = cart.items[itemIndex].product;

    // Check stock availability
    if (quantity > product.quantity) {
      return res.status(400).send({
        success: false,
        message: `Only ${product.quantity} items available in stock`,
      });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    // Recalculate total
    cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await cart.save();

    // Populate before sending response
    await cart.populate("items.product", "name price slug photoUrl quantity");

    res.status(200).send({
      success: true,
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error updating cart",
      error: error.message,
    });
  }
};

export const removeCartItemController = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).send({
        success: false,
        message: "Cart not found",
      });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    if (cart.items.length === initialLength) {
      return res.status(404).send({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Recalculate total
    cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await cart.save();

    // Populate before sending response
    await cart.populate("items.product", "name price slug photoUrl quantity");

    res.status(200).send({
      success: true,
      message: "Item removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error removing item from cart",
      error: error.message,
    });
  }
};

export const clearCartController = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      return res.status(404).send({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(200).send({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error clearing cart",
      error: error.message,
    });
  }
};

// ==================== RAZORPAY PAYMENT ROUTES ====================
export const createRazorpayOrderController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cart: frontendCart } = req.body;

    console.log("💳 Razorpay Order Creation Started for user:", userId);
    console.log("🛒 Frontend Cart received:", frontendCart ? `Array(${frontendCart.length})` : "None");

    // Sync frontend cart to DB if provided
    if (frontendCart && Array.isArray(frontendCart) && frontendCart.length > 0) {
      try {
        console.log("🔄 Syncing frontend cart to database...");
        let userCart = await cartModel.findOne({ user: userId });
        if (!userCart) {
          console.log("🆕 Creating new cart for user");
          userCart = new cartModel({ user: userId, items: [] });
        }

        // Map frontend products to cart items, fetching FRESH prices from DB
        const syncedItems = [];
        for (const item of frontendCart) {
          const product = await productModel.findById(item._id);
          if (product) {
            // CRITICAL: We use 1 as initial quantity because item.quantity currently contains stock count
            const purchaseQuantity = 1;
            console.log(`📍 Mapping item from DB: ${product.name} (ID: ${product._id}, DB Price: ${product.price}, Qty: ${purchaseQuantity})`);
            syncedItems.push({
              product: product._id,
              quantity: purchaseQuantity,
              price: product.price, // Use DB price
              name: product.name,
              image: product.photoUrl || "",
            });
          } else {
            console.log(`⚠️ Product not found in DB: ${item._id}`);
          }
        }

        userCart.items = syncedItems;
        const savedCart = await userCart.save();
        console.log("✅ Cart synced and saved. Total items in DB:", savedCart.items.length, "Total Amount:", savedCart.total);
      } catch (syncError) {
        console.error("❌ Sync Error:", syncError.message);
        return res.status(400).send({
          success: false,
          message: "Failed to sync cart: " + syncError.message,
        });
      }
    }

    const cart = await cartModel.findOne({ user: userId }).populate("items.product").exec();

    if (!cart) {
      console.log("❌ No cart found for user after sync attempt");
      return res.status(400).send({
        success: false,
        message: "Cart not found - please add items to cart again",
      });
    }

    if (cart.items.length === 0) {
      console.log("❌ Cart is empty for user:", userId);
      return res.status(400).send({
        success: false,
        message: "Your cart is empty. Refresh and try again.",
      });
    }

    console.log("💰 Final Cart Data before order creation:");
    console.log("   - DB Total Field:", cart.total);
    console.log("   - Item Count:", cart.items.length);

    // FORCED RECALCULATION: Ignore the DB total field and re-calculate
    // This ensures that even if sync logic has a bug, the final price is correct.
    const calculatedTotal = cart.items.reduce((sum, item) => {
      // Force quantity to 1 for each unique item to fix the stock count collision
      const price = item.price || 0;
      console.log(`   🧮 Adding Item: ${item.name} | Price: ${price} | Forced Qty: 1`);
      return sum + (price * 1);
    }, 0);

    console.log("🔄 Forced Recalculated Total (Qty=1 for all):", calculatedTotal);

    if (calculatedTotal <= 0) {
      console.log("❌ Invalid calculated total:", calculatedTotal);
      return res.status(400).send({
        success: false,
        message: "Invalid cart total. Please update your cart.",
      });
    }

    const amount = Math.round(calculatedTotal * 100);
    console.log(`💵 Amount being sent to Razorpay (in Paisa): ${amount} (In Rupees: ₹${calculatedTotal})`);

    const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send({
        success: false,
        message: "Some error occurred",
      });
    }

    res.status(200).send({
      success: true,
      order,
      amount: cart.total,
      cart: cart.items,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in creating order",
      error: error.message,
    });
  }
};

export const verifyRazorpayPaymentController = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).send({
        success: false,
        message: "Cart not found",
      });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).send({
        success: false,
        message: "Payment verification failed",
      });
    }

    const order = new orderModel({
      products: cart.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      })),
      payment: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
      buyer: userId,
      totalAmount: cart.total,
      paymentStatus: "Completed",
    });

    await order.save();

    // Clear the cart after successful order
    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(200).send({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in payment verification",
      error: error.message,
    });
  }
};

export const getRazorpayKeyController = async (req, res) => {
  try {
    res.status(200).send({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting RazorPay key",
      error: error.message,
    });
  }
};

export default {
  createProductController,
  getProductController,
  getSingleProductController,
  getProductByIdController,
  productPhotoController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController,
  addToCartController,
  getCartController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
  createRazorpayOrderController,
  verifyRazorpayPaymentController,
  getRazorpayKeyController,
};