import UserPackage from '../user-packages-model/user.packages.model.js';
import moment from 'moment';

const userPackageController = {

  // Create a new user package
  createUserPackage: async (req, res) => {
    try {
      const { userId, packageName, priceRs, validity, discount, comments, description, paymentId } = req.body;

      // Validate required fields
      if (!userId || !packageName || !priceRs || !validity || !discount || !comments || !description || !paymentId) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      const newUserPackage = new UserPackage({
        userId,
        packageName,
        priceRs,
        validity,
        discount,
        comments,
        description,
        paymentId,
      });

      const savedPackage = await newUserPackage.save();
      res.status(201).json(savedPackage);
    } catch (error) {
        console.log(error)
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  // Get all user packages with expiry status update
  getAllUserPackages: async (req, res) => {
    try {
      const allPackages = await UserPackage.find();
      const currentDate = moment();

      // Check expiry and update status if necessary
      allPackages.forEach(async (pkg) => {
        if (pkg.expiryDate && moment(pkg.expiryDate).isBefore(currentDate)) {
          if (pkg.status !== "expired") {
            pkg.status = "expired";
            await pkg.save();
          }
        }
      });

      res.status(200).json(allPackages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch packages", error });
    }
  },

  // Delete a user package by ID
  deleteUserPackage: async (req, res) => {
    try {
      const { id } = req.params;
      const userPackage = await UserPackage.findByIdAndDelete(id);

      if (!userPackage) {
        return res.status(404).json({ message: "User package not found" });
      }

      res.status(200).json({ message: "User package deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete package", error });
    }
  },

  // Get a single user package by userId and check expiry
  getUserPackageByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      const userPackage = await UserPackage.findOne({ userId });

      if (!userPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      const currentDate = moment();
      if (userPackage.expiryDate && moment(userPackage.expiryDate).isBefore(currentDate)) {
        if (userPackage.status !== "expired") {
          userPackage.status = "expired";
          await userPackage.save();
        }
      }

      res.status(200).json(userPackage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch package", error });
    }
  },

};

export default userPackageController;
