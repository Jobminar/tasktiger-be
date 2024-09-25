import AdminUserPackage from "../admin-user-package-model/admin.user.package.model.js";

const adminUserPackageController = {

  createAdminUserPackage: async (req, res) => {
    try {
     
      const { packageName, priceRs, validity, discount, comments, description } = req.body;

      if (!packageName || !priceRs || !validity || !discount || !comments || !description) {
        return res.status(400).json({ message: "Required fields are missing" });
      };

      const newPackage = new AdminUserPackage({
        packageName,
        priceRs,
        validity,
        discount,
        comments,
        description,
      });

      const savedPackage = await newPackage.save();
      res.status(201).json(savedPackage);
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Internal server error", error });
    }
  },

  // Get all admin user packages
  getAllAdminUserPackage: async (req, res) => {
    try {
      const getData = await AdminUserPackage.find();
      res.status(200).json(getData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get the data", error });
    }
  },

  // Delete an admin user package by ID
  deleteAdminUserPackage: async (req, res) => {
    try {
      const { id } = req.params;
      const removedPackage = await AdminUserPackage.findByIdAndDelete(id);

      if (!removedPackage) {
        return res.status(404).json({ message: "Item ID not found" });
      }

      res.status(200).json({message:"admin user package deleted"});
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete', error });
    }
  },

  // Update an admin user package by ID
  updateAdminUserPackage: async (req, res) => {
    try {
      const { id } = req.params;
      const { packageName, priceRs, validity, discount, comments, description } = req.body;
   
      const packageToUpdate = await AdminUserPackage.findById(id);
      if (!packageToUpdate) {
        return res.status(404).json({ message: "Package not found" });
      }

        // Prepare updates
      const updates = {
        packageName,
        priceRs,
        validity,
        discount,
        comments,
        description
      };

      const updatedPackage = await AdminUserPackage.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      res.status(200).json(updatedPackage);
    } catch (error) {
      res.status(500).json({ message: "Failed to update package", error });
    }
  },
  
  getAdminUserPackage: async (req, res) => {
    try {
      const { id } = req.params;
      const getData = await AdminUserPackage.findById(id);
      res.status(200).json(getData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get the data", error });
    }
  },
};

export default adminUserPackageController;
