import UserPromotion from "../models/user-promotion.model.js";

// Create a new user promotion
const userPromotionController = {
  createUserPromotion: async (req, res) => {
    try {
      const { promoName, userType, offerPercentage, validFrom, validTill, notifyUsers, serviceType } = req.body;
      
      if (!Array.isArray(userType) || userType.length === 0) {
        return res.status(400).send({ error: "userType must be a non-empty array" });
      }

      const promotion = new UserPromotion({ promoName, userType, offerPercentage, validFrom, validTill, notifyUsers, serviceType });
      await promotion.save();
      res.status(201).send(promotion);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  // Get all user promotions
  getUserPromotions: async (req, res) => {
    try {
      const promotions = await UserPromotion.find();
      res.send(promotions);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  // Delete a user promotion
  deleteUserPromotion: async (req, res) => {
    try {
      const { id } = req.params;
      const promotion = await UserPromotion.findByIdAndDelete(id);
      if (!promotion) {
        return res.status(404).send({ error: "Promotion not found" });
      }
      res.send(promotion);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  // Update a user promotion
  updateUserPromotion: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (updates.userType && (!Array.isArray(updates.userType) || updates.userType.length === 0)) {
        return res.status(400).send({ error: "userType must be a non-empty array" });
      }

      const promotion = await UserPromotion.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!promotion) {
        return res.status(404).send({ error: "Promotion not found" });
      }
      res.send(promotion);
    } catch (error) {
      res.status(400).send(error);
    }
  }
};

export default userPromotionController;
