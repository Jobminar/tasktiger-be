import express from "express";
import orderController from "../controllers/user.order.controller.js";

const router = express.Router();

router.post("/create-order", orderController.createOrder);

router.get("/",orderController.getAllOrder)
  
router.get("/:userId",orderController.getOrderByUserId)

router.delete("/:id",orderController.deleteOrder)

router.delete("/delete/orders",orderController.deleteAllOrders)

export default router;
