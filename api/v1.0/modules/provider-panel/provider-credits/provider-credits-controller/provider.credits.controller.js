// controllers/provider-credits.controller.js
import Credits from '../provider-credits-model/provider.credits.model.js';

const providerCreditsController = {
  addCredits: async (req, res) => {
    try {
      const { providerId, amount } = req.body;

      if (!providerId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid input data" });
      }

      // Calculate credits (1 credit per 10 rupees)
      const credits = Math.floor(amount / 10);

      // Find the provider's credit record
      let userCredits = await Credits.findOne({ providerId });

      if (userCredits) {
        // Update existing credits and amount
        userCredits.credits += credits;
        userCredits.amount += amount;
        await userCredits.save();
      } else {
        // Create new credits entry
        userCredits = new Credits({
          providerId,
          credits,
          amount,
        });
        await userCredits.save();
      }

      res.status(200).json({ message: "Credits recharged successfully", userCredits });
    } catch (error) {
      console.error("Error recharging credits:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  applyPenalty: async (req, res) => {
    try {
      const { providerId, penaltyAmount, reason } = req.body;

      if (!providerId || !penaltyAmount || penaltyAmount <= 0 || !reason) {
        return res.status(400).json({ message: "Invalid input data" });
      }

      // Find the provider's credit record
      let userCredits = await Credits.findOne({ providerId });

      if (!userCredits) {
        return res.status(404).json({ message: "Provider not found" });
      }

      // Calculate credit deduction for penalty (1 credit = 10 rupees)
      const creditsDeduction = Math.floor(penaltyAmount / 10);

      // Check if the provider has enough credits
      if (userCredits.credits < creditsDeduction) {
        return res.status(400).json({ message: "Insufficient credits to apply penalty" });
      }

      // Apply the penalty
      userCredits.credits -= creditsDeduction;
      userCredits.amount -= penaltyAmount;
      userCredits.penalties = userCredits.penalties || [];
      userCredits.penalties.push({ penaltyAmount, reason, date: new Date() });

      await userCredits.save();

      res.status(200).json({ message: "Penalty applied successfully", userCredits });
    } catch (error) {
      console.error("Error applying penalty:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  addExpense: async (req, res) => {
    try {
      const { providerId, amount, description } = req.body;

      if (!providerId || !amount || amount <= 0 || !description) {
        return res.status(400).json({ message: "Invalid input data" });
      }

      // Find the provider's credit record
      let userCredits = await Credits.findOne({ providerId });

      if (!userCredits) {
        return res.status(404).json({ message: "Provider not found" });
      }

      // Record the expense
      userCredits.expenses = userCredits.expenses || [];
      userCredits.expenses.push({ amount, description });

      // Deduct the expense from the credits
      const creditsDeduction = Math.floor(amount / 10);
      if (userCredits.credits < creditsDeduction) {
        return res.status(400).json({ message: "Insufficient credits to cover expense" });
      }
      userCredits.credits -= creditsDeduction;
      userCredits.amount -= amount;

      await userCredits.save();

      res.status(200).json({ message: "Expense added successfully", userCredits });
    } catch (error) {
      console.error("Error adding expense:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getProviderCredits: async (req, res) => {
    try {
      const { providerId } = req.params;
      const credits = await Credits.findOne({ providerId });
      if (!credits) {
        return res.status(404).json({ message: "Credits not found!" });
      }
      res.status(200).json(credits);
    } catch (error) {
      console.error("Error fetching provider credits:", error);
      res.status(500).json({ message: "Failed to get credits" });
    }
  },

  deleteProviderCredits: async (req, res) => {
    try {
      const { providerId } = req.params;
      const credits = await Credits.findOneAndDelete({ providerId });
      if (!credits) {
        return res.status(404).json({ message: "Credits not found!" });
      }
      res.status(200).json({ message: "Credits deleted successfully", deletedCredits: credits._id });
    } catch (error) {
      console.error("Error deleting credits:", error);
      res.status(500).json({ message: "Failed to delete credits" });
    }
  },
  getProviderCredits: async (req, res) => {
    try {
      const { providerId } = req.params;
      const credits = await Credits.findOne({ providerId });

      if (!credits) {
        return res.status(404).json({ message: "Credits not found!" });
      }

      const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date(date));
      };

      const formattedCredits = {
        creditBalance: credits.credits,
        amountBalance: credits.amount,
        transactions: [
          ...credits.penalties.map(p => ({
            type: 'Penalty',
            amount: -Math.floor(p.penaltyAmount / 10), // Penalty amount in credits
            description: p.reason,
            date: formatDate(p.date),
            details: `Penalty: ${p.reason}`,
          })),
          ...credits.expenses.map(e => ({
            type: 'Expense',
            amount: -Math.floor(e.amount / 10), // Expense amount in credits
            description: e.description,
            date: formatDate(e.date),
            details: `Expense: ${e.description}`,
          })),
          {
            type: 'Recharge',
            amount: credits.credits,
            description: 'Credits recharge',
            date: formatDate(credits.updatedAt || credits.createdAt),
            details: 'Credits recharge',
          },
        ],
      };

      res.status(200).json(formattedCredits);
    } catch (error) {
      console.error("Error fetching provider credits:", error);
      res.status(500).json({ message: "Failed to get credits" });
    }
  },
};

export default providerCreditsController;
