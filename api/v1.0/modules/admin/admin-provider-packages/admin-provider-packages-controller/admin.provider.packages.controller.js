import AdminProviderPackage from "../admin-provider-packages-model/admin.provider.packages.model.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("image");

// Function to upload image to S3
const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `admin-provider-packages/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return uploadResult.Location; // Return the S3 object URL
};

// Function to delete image from S3
const deleteImageFromS3 = async (imageKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
  };

  await s3.deleteObject(s3Params).promise();
};
const adminProviderPackageController = {
  // Create a new Admin Provider Package
  createAdminProviderPackage: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: "Image upload failed" });

      const { packageName, priceRs, discountPlatformCom, comments, noOfJobOffers } = req.body;
      if (!req.file) return res.status(400).json({ error: "Image is required" });

      try {
        const imageUrl = await uploadImageToS3(req.file);
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

    try {
      const packageToUpdate = await AdminProviderPackage.findById(id);
      if (!packageToUpdate) return res.status(404).json({ error: "Package not found" });

      let updatedImageUrl = packageToUpdate.image; // Keep the existing image URL
      if (req.file) {
        await deleteImageFromS3(packageToUpdate.image);
        updatedImageUrl = await uploadImageToS3(req.file);
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
  },

  // Delete an Admin Provider Package by ID
  deleteAdminProviderPackage: async (req, res) => {
    const { id } = req.params;

    try {
      const packageToDelete = await AdminProviderPackage.findById(id);
      if (!packageToDelete) return res.status(404).json({ error: "Package not found" });

      await deleteImageFromS3(packageToDelete.image);
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
