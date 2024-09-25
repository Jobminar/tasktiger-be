import ProviderPromotion from "../models/provider-promotion.model.js";

// Create a new provider promotion

const providerPromotions={
 createProviderPromotion:async (req, res) => {
  try {
    const promotion = new ProviderPromotion(req.body);
    await promotion.save();
    res.status(201).send(promotion);
  } catch (error) {
    res.status(400).send(error);
  }
 },
// Get all provider promotions
 getProviderPromotions : async (req, res) => {
  try {
    const promotions = await ProviderPromotion.find();
    res.send(promotions);
  } catch (error) {
    res.status(500).send(error);
  }
},
// Delete a provider promotion
 deleteProviderPromotion : async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await ProviderPromotion.findByIdAndDelete(id);
    if (!promotion) {
      return res.status(404).send({ error: "Promotion not found" });
    }
    res.send(promotion);
  } catch (error) {
    res.status(500).send(error);
  }
},
updateProviderPromotion: async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const promotion = await ProviderPromotion.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!promotion) {
      return res.status(404).send({ error: "Promotion not found" });
    }
    res.send(promotion);
  } catch (error) {
    res.status(400).send(error);
  }
}
}
export default providerPromotions
