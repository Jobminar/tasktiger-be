import ProviderAuth from "../models/provider.auth.model.js";
import crypto from "crypto";

// Function to generate a 4-digit OTP
const generateOtp = () => {
  return crypto.randomInt(1000, 10000);
};

// Helper function to check if a provider exists
const findProviderByPhone = async (phone) => {
  return await ProviderAuth.findOne({ phone });
};

const providerController = {
  signup: async (req, res) => {
    try {
      const { phone } = req.body;

      // Validate input
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Check if provider already exists and is verified
      let provider = await findProviderByPhone(phone);
      if (provider && provider.isVerified) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create or update provider and generate OTP
      const otp = generateOtp();
      if (!provider) {
        provider = new ProviderAuth({
          phone,
          isVerified: false,
          otp: otp,
          otpCreatedAt: new Date(),
        });
      } else {
        provider.otp = otp;
        provider.otpCreatedAt = new Date();
      }
      await provider.save();

      res
        .status(200)
        .json({ message: "Signup successful. OTP sent to phone.", otp: otp });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },

  login: async (req, res) => {
    try {
      const { phone } = req.body;

      // Validate input
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Check if provider exists
      let provider = await findProviderByPhone(phone);
      if (!provider) {
        // If provider does not exist, return error
        return res
          .status(400)
          .json({ message: "User does not exist. Please sign up first." });
      }

      const otp = generateOtp();
      provider.otp = otp;
      provider.otpCreatedAt = new Date();
      await provider.save();

      console.log(`OTP for phone ${phone} is ${otp}`);

      res.status(200).json({ message: "OTP sent to phone", otp: otp });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },

  verifyOtp: async (req, res) => {
    try {
      const { phone, otp } = req.body;

      // Validate input
      if (!phone || !otp) {
        return res
          .status(400)
          .json({ message: "Phone number and OTP are required" });
      }

      // Find the provider by phone number
      let provider = await findProviderByPhone(phone);
      if (!provider) {
        return res.status(400).json({ message: "Invalid phone number or OTP" });
      }

      // Check if OTP matches and is not expired
      const currentTime = new Date().getTime();
      const otpCreatedAt = new Date(provider.otpCreatedAt).getTime();
      const otpExpirationTime = 5 * 60 * 1000; // 5 minutes for testing

      console.log(
        `Current time: ${currentTime}, OTP created at: ${otpCreatedAt}, Time difference: ${
          currentTime - otpCreatedAt
        }`
      );

      if (provider.otp !== otp.toString()) {
        console.log(`Invalid OTP: expected ${provider.otp}, got ${otp}`);
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (currentTime - otpCreatedAt > otpExpirationTime) {
        console.log(
          `Expired OTP: time difference ${currentTime - otpCreatedAt}ms`
        );
        return res.status(400).json({ message: "Expired OTP" });
      }

      // Check if the OTP is being verified for the first time
      if (!provider.isVerified) {
        provider.isVerified = true;
        await provider.save();
        res
          .status(200)
          .json({
            message: "OTP verified successfully for the first time",
            providerId: provider._id,
          });
      } else {
        res
          .status(200)
          .json({
            message: "OTP verified successfully ",
            providerId: provider._id,
          });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getProviderByproviderId: async (req, res) => {
    try {
      const { id } = req.params;

      // Validate input
      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Find the provider by user ID
      const provider = await ProviderAuth.findById(id);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      // Return the provider's phone number
      res.status(200).json({ phone: provider.phone });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default providerController;
