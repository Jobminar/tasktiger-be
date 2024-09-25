import express from "express";
import cartController from "../controllers/user.cart.controller.js";

const router = express.Router();

router.post("/create-cart", cartController.createCart);
router.get("/:userId", cartController.getCart);
router.delete("/:userId/:itemId", cartController.deleteCartItem);
router.delete("/:userId",cartController.deleteAllCartItems)
router.put("/:userId/:itemId", cartController.updateCartItem);



export default router;
