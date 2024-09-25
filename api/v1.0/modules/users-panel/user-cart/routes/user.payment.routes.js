import express from "express";
import paymentController from "../controllers/user.payment.controller.js";
import { authenticateJWT } from "../../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateJWT, paymentController.createPayment);
router.get("/:paymentId", authenticateJWT, paymentController.getPayment);

export default router;
