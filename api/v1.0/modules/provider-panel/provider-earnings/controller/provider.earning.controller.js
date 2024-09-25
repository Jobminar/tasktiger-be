import Earnings from '../model/provider.earning.model.js';

const providerEarningController = {

  createEarnings: async (req, res) => {
    try {
      const { providerId, date, amount } = req.body;

      // Check for all required fields
      if (!providerId || !date || amount === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const newEarnings = new Earnings({ providerId, date, amount });
      await newEarnings.save();

      res.status(201).json(newEarnings);
    } catch (err) {
      res.status(500).send(err);
    }
  },

  getEarningsById: async (req, res) => {
    try {
      const id = req.params.id;
      const earnings = await Earnings.findById(id);
      if (!earnings) {
        return res.status(404).json({ message: 'Earnings not found' });
      }
      res.json(earnings);
    } catch (err) {
      res.status(500).json({ error: "Failed to get earnings", details: err });
    }
  },

  getByProviderId: async (req, res) => {
    try {
      const { id: providerId } = req.params; // Use `id` from req.params as providerId

      if (!providerId) {
        return res.status(400).json({ message: 'Missing required field: providerId' });
      }

      const earnings = await Earnings.find({ providerId }); // Find all entries with matching providerId

      if (!earnings.length) {
        return res.status(404).json({ message: 'No earnings found for this user' });
      }

      res.status(200).json(earnings);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get earnings', error: error.message });
    }
  },

};

export default providerEarningController;
