// controllers/provider.controller.js
import ServiceProvider from "../model/provider.model.js";
import Target from "../../provider-target/model/provider-target.model.js";

const providerController = {
  createServiceProvider: async (req, res) => {
    try {
      const {
        phoneNo,
        aadharNo,
        fullName,
        workDetails,
        pincode,
        experienceStatus,
        age,
        workExperience,
      } = req.body;
      const serviceProvider = new ServiceProvider({
        phoneNo,
        aadharNo,
        fullName,
        workDetails,
        pincode,
        experienceStatus,
        age,
        workExperience,
      });
      await serviceProvider.save();
      res.status(201).json(serviceProvider);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getAllServiceProviders: async (req, res) => {
    try {
      const serviceProviders = await ServiceProvider.find();
      res.status(200).json(serviceProviders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getServiceProviderById: async (req, res) => {
    try {
      const serviceProvider = await ServiceProvider.findById(req.params.id);
      if (!serviceProvider) {
        return res.status(404).json({ error: "Service provider not found" });
      }
      res.status(200).json(serviceProvider);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateServiceProvider: async (req, res) => {
    try {
      const serviceProvider = await ServiceProvider.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!serviceProvider) {
        return res.status(404).json({ error: "Service provider not found" });
      }
      res.status(200).json(serviceProvider);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteServiceProvider: async (req, res) => {
    try {
      const serviceProvider = await ServiceProvider.findByIdAndDelete(
        req.params.id
      );
      if (!serviceProvider) {
        return res
          .status(404)
          .json({ error: "Service provider not found" });
      }
      res
        .status(200)
        .json({ message: "Service provider deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateCredits: async (req, res) => {
    try {
      const serviceProviderId = req.params.id;
      const { creditsToAdd } = req.body;

      const updatedTarget = await Target.findOneAndUpdate(
        { serviceProvider: serviceProviderId },
        { $inc: { credits: creditsToAdd } },
        { new: true }
      );

      if (!updatedTarget) {
        return res.status(404).json({ error: "Service provider not found" });
      }

      res.status(200).json(updatedTarget);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

export default providerController;
