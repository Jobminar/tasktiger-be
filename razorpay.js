import express from "express";
import Razorpay from "razorpay";
import dotenv from "dotenv";
  
dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

// Create a router
const router = express.Router();

// Create an order endpoint
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    const options = {
      amount: amount * 100, // amount in smallest unit (e.g., paise for INR)
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Process a refund endpoint
router.post("/refund", async (req, res) => {
  try {
    const { payment_id, amount } = req.body;

    const refundOptions = {
      amount: amount * 100, // amount in smallest unit
    };

    const refund = await razorpay.payments.refund(payment_id, refundOptions);
    res.status(200).json(refund);
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ error: "Failed to process refund" });
  }
});

// Capture a payment endpoint (Placeholder)
router.post("/capture-payment", async (req, res) => {
  try {
    const { payment_id, amount } = req.body;

    // Razorpay capture payment logic here
    const captureResponse = await razorpay.payments.capture(
      payment_id,
      amount * 100,
    ); // Capture the amount in smallest unit (paise)
    res.status(200).json(captureResponse);
  } catch (error) {
    console.error("Error capturing payment:", error);
    res.status(500).json({ error: "Failed to capture payment" });
  }
});

export default router;
