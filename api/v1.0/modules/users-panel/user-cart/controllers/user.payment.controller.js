import Payment from "../models/user.payment.model.js";

const paymentController = {
  createPayment: async (req, res) => {
    const { orderId, amount } = req.body;

    try {
      const payment = new Payment({ orderId, amount });
      await payment.save();
      res
        .status(201)
        .json({ message: "Payment created successfully", payment });
    } catch (error) {
      res.status(500).json({ message: "Error creating payment", error });
    }
  },

  getPayment: async (req, res) => {
    const { paymentId } = req.params;

    try {
      const payment = await Payment.findById(paymentId).populate("orderId");
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.status(200).json({ payment });
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment", error });
    }
  },
};

export default paymentController;
