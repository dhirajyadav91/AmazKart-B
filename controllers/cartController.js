import cartModel from "../models/cartModel.js";

// Add to cart
export const addToCartController = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id; 

    // Validate input
    if (!productId || !quantity) {
      return res.status(400).send({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    // Get product details
    const product = await productModel.findById(productId).select("name price photo");
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Find user's cart or create new one
    let cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      cart = new cartModel({
        user: userId,
        items: [],
        total: 0,
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if product exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        name: product.name,
        image: product.photo ? `/api/v1/product/product-photo/${product._id}` : null,
      });
    }

    // Save cart
    await cart.save();

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

// Get user cart
export const getCartController = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await cartModel
      .findOne({ user: userId })
      .populate("items.product", "name price slug")
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

// Update cart item quantity
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

    const cart = await cartModel.findOne({ user: userId });
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

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

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

// Remove item from cart
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
    cart.items = cart.items.filter(
      (item) => item._id.toString() !== itemId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).send({
        success: false,
        message: "Item not found in cart",
      });
    }

    await cart.save();

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

// Clear cart
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