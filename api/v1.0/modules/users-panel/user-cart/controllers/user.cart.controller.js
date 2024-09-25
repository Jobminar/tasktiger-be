import Cart from "../models/user.cart.model.js";
import Service from "../../../_core/service-categories/models/services.model.js";
import Subcategory from "../../../_core/service-categories/models/sub.categories.model.js";
import Category from "../../../_core/service-categories/models/categories.model.js";

const cartController = {

  createCart: async (req, res) => {
    const { userId, items } = req.body;

    try {
      let cart = await Cart.findOne({ userId });

      if (cart) {
        // Validate item data before pushing
        items.forEach(item => {
          if (!item.categoryId || !item.subCategoryId || !item.serviceId || !item.quantity) {
            throw new Error("Missing required fields for item.");
          }
        });

        // If the cart exists, add the new items to the existing items array
        cart.items.push(...items);
      } else {
        // If the cart does not exist, create a new one
        cart = new Cart({
          userId,
          items,
        });
      }

      await cart.save();

      res.status(201).json({
        message: cart.isNew ? "Cart created successfully" : "Cart updated successfully",
        cart,
      });
    } catch (error) {
      console.error("Error creating or updating cart:", error);
      res.status(400).json({
        message: "Error creating or updating cart",
        error: error.message,
      });
    }
  },  

  deleteCartItem: async (req, res) => {
    const { userId, itemId } = req.params;

    try {
      const cart = await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { _id: itemId } } },
        { new: true }
      );

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      res.status(200).json({ message: "Cart item deleted successfully", cart });
    } catch (error) {
      console.error("Error deleting cart item:", error);
      res
        .status(500)
        .json({ message: "Error deleting cart item", error: error.message });
    }
  },

  getCart: async (req, res) => {
    try {
      const { userId } = req.params;

      const cartItems = await Cart.find({ userId })
        .populate({
          path: "items.serviceId",
          model: Service,
          populate: {
            path: "subCategoryId",
            model: Subcategory,
            populate: {
              path: "categoryId",
              model: Category,
            },
          },
        })
        .populate("items.categoryId")
        .populate("items.subCategoryId");

      if (!cartItems || cartItems.length === 0) {
        return res.status(404).json({ error: "No carts found for this user" });
      }

      res.status(200).json(cartItems);
    } catch (error) {
      console.error("Error retrieving cart:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  updateCartItem: async (req, res) => {
    const { userId, itemId } = req.params;
    const { categoryId, subCategoryId, serviceId, quantity, price, image } = req.body;

    try {
      // Find the user's cart
      const cart = await Cart.findOne({ userId });

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      // Find the item to be updated
      const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);

      if (itemIndex === -1) {
        return res.status(404).json({ message: "Item not found in cart" });
      }

      // Update the fields of the found item
      if (categoryId) cart.items[itemIndex].categoryId = categoryId;
      if (subCategoryId) cart.items[itemIndex].subCategoryId = subCategoryId;
      if (serviceId) cart.items[itemIndex].serviceId = serviceId;
      if (quantity !== undefined) cart.items[itemIndex].quantity = quantity;
      if (price !== undefined) cart.items[itemIndex].price = price;
      if (image) cart.items[itemIndex].image = image;

      // Save the updated cart
      await cart.save();

      res.status(200).json({ message: "Cart item updated successfully", cart });
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Error updating cart item", error: error.message });
    }
  },
  deleteAllCartItems: async (req, res) => {
    const { userId } = req.params;

    try {
      const cart = await Cart.findOne({ userId });

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      cart.items = [];
      cart.updatedAt = Date.now();

      await cart.save();

      res.status(200).json({ message: "All cart items deleted successfully", cart });
    } catch (error) {
      // console.error("Error deleting all cart items:", error);
      res.status(500).json({ message: "Error deleting all cart items", error: error.message });
    }
  },
};

export default cartController;
                              