import Target from "../model/provider-target.model.js";

const providerTargetController = {
  createServiceProviderTarget: async (req, res) => {
    try {
      const {
        providerId,
        serviceProvider,
        totalEarnings,
        upcomingEarnings,
        dailyEarnings,
        monthlyEarnings,
        credits,
        specialRating,
        responseRate,
        cancellationRate,
        totalWorkingHours,
      } = req.body;

      const serviceProviderTarget = new Target({
        providerId,
        serviceProvider,
        totalEarnings,
        upcomingEarnings,
        dailyEarnings,
        monthlyEarnings,
        credits,
        specialRating,
        responseRate,
        cancellationRate,
        totalWorkingHours,
      });

      // Calculate metrics
      await calculateMetrics(serviceProviderTarget);

      // Save the serviceProviderTarget after calculation
      await serviceProviderTarget.save();

      res.status(201).json(serviceProviderTarget);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  getAllServiceProviderTargets: async (req, res) => {
    try {
      const serviceProviderTargets = await Target.find();
      res.status(200).json(serviceProviderTargets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getServiceByProviderId: async (req, res) => {
    try {
      const { providerId } = req.params;

      const serviceProviderTarget = await Target.findOne({ providerId });
      if (!serviceProviderTarget) {
        return res
          .status(404)
          .json({ error: "Service provider target not found" });
      }
      res.status(200).json(serviceProviderTarget);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateServiceProviderTarget: async (req, res) => {
    try {
      const serviceProviderTarget = await Target.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!serviceProviderTarget) {
        return res
          .status(404)
          .json({ error: "Service provider target not found" });
      }
      // After updating, recalculate the metrics
      await calculateMetrics(serviceProviderTarget);
      res.status(200).json(serviceProviderTarget);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteServiceProviderTarget: async (req, res) => {
    try {
      const serviceProviderTarget = await Target.findByIdAndDelete(
        req.params.id
      );
      if (!serviceProviderTarget) {
        return res
          .status(404)
          .json({ error: "Service provider target not found" });
      }
      res
        .status(200)
        .json({ message: "Service provider target deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

// Function to calculate and update metrics
const calculateMetrics = async (serviceProviderTarget) => {
  // Example calculation functions (replace with your actual logic)
  serviceProviderTarget.totalEarnings = calculateTotalEarnings(
    serviceProviderTarget
  );
  serviceProviderTarget.upcomingEarnings = calculateUpcomingEarnings(
    serviceProviderTarget
  );
  serviceProviderTarget.specialRating = calculateRating(
    serviceProviderTarget
  );

  // Save the updated serviceProviderTarget
  await serviceProviderTarget.save();
};

// Example calculation functions (replace with your actual logic)
const calculateTotalEarnings = (serviceProviderTarget) => {
  // Calculation logic for total earnings
};

const calculateUpcomingEarnings = (serviceProviderTarget) => {
  // Calculation logic for upcoming earnings
};

const calculateRating = (serviceProviderTarget) => {
  // Calculation logic for rating
};

export default providerTargetController;
