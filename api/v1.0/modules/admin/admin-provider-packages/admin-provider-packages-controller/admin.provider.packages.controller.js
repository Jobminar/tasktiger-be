import AdminProviderPackage from "../admin-provider-packages-model/admin.provider.packages.model.js";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Multer configuration for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

// Function to upload image to Azure Blob Storage
const uploadImageToAzure = async (file) => {
  const blobName = `admin-provider-packages/${uuidv4()}${path.extname(file.originalname)}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload file buffer to Azure Blob
  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype, // Set the content type to the file's mimetype
    },
  });

  return blockBlobClient.url; // Return the URL to the uploaded image
};

// Function to delete image from Azure Blob Storage
const deleteImageFromAzure = async (imageUrl) => {
  const blobName = imageUrl.split("/").pop(); // Extract the blob name from the URL
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.deleteIfExists(); // Delete the image if it exists
};

// Error handling for multer
const handleMulterError = (err, res) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(500).json({ message: "Server error during file upload" });
  }
};

// Admin Provider Package Controller
const adminProviderPackageController = {
  // Create a new Admin Provider Package
  createAdminProviderPackage: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) return handleMulterError(err, res);

      const { packageName, priceRs, discountPlatformCom, comments, noOfJobOffers } = req.body;
      if (!req.file) return res.status(400).json({ error: "Image is required" });

      try {
        const imageUrl = await uploadImageToAzure(req.file);
        const newPackage = new AdminProviderPackage({
          image: imageUrl,
          packageName,
          priceRs,
          discountPlatformCom,
          comments,
          noOfJobOffers,
        });
        await newPackage.save();

        res.status(201).json({
          message: "Admin Provider Package created successfully",
          data: newPackage,
        });
      } catch (error) {
        console.error("Error creating admin provider package:", error);
        res.status(500).json({ error: "Failed to create package" });
      }
    });
  },

  // Get all Admin Provider Packages
  getAllAdminProviderPackages: async (req, res) => {
    try {
      const packages = await AdminProviderPackage.find();
      res.status(200).json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ error: "Failed to retrieve packages" });
    }
  },

  // Update an Admin Provider Package by ID
  updateAdminProviderPackage: async (req, res) => {
    const { id } = req.params;
    const { packageName, priceRs, discountPlatformCom, comments, noOfJobOffers } = req.body;

    upload(req, res, async (err) => {
      if (err) return handleMulterError(err, res);

      try {
        const packageToUpdate = await AdminProviderPackage.findById(id);
        if (!packageToUpdate) return res.status(404).json({ error: "Package not found" });

        let updatedImageUrl = packageToUpdate.image; // Keep the existing image URL if not replaced
        if (req.file) {
          await deleteImageFromAzure(packageToUpdate.image); // Delete old image
          updatedImageUrl = await uploadImageToAzure(req.file); // Upload new image
        }

        // Update the package fields
        packageToUpdate.set({
          packageName: packageName || packageToUpdate.packageName,
          priceRs: priceRs || packageToUpdate.priceRs,
          discountPlatformCom: discountPlatformCom || packageToUpdate.discountPlatformCom,
          comments: comments || packageToUpdate.comments,
          noOfJobOffers: noOfJobOffers || packageToUpdate.noOfJobOffers,
          image: updatedImageUrl,
        });

        await packageToUpdate.save();
        res.status(200).json({
          message: "Package updated successfully",
          data: packageToUpdate,
        });
      } catch (error) {
        console.error("Error updating package:", error);
        res.status(500).json({ error: "Failed to update package" });
      }
    });
  },

  // Delete an Admin Provider Package by ID
  deleteAdminProviderPackage: async (req, res) => {
    const { id } = req.params;

    try {
      const packageToDelete = await AdminProviderPackage.findById(id);
      if (!packageToDelete) return res.status(404).json({ error: "Package not found" });

      await deleteImageFromAzure(packageToDelete.image); // Delete associated image
      await AdminProviderPackage.findByIdAndDelete(id);

      res.status(200).json({
        message: "Package deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ error: "Failed to delete package" });
    }
  },
};

export default adminProviderPackageController;
