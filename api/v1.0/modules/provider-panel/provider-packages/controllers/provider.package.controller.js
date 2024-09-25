import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import ProviderPackage from '../models/provider.package.model.js';

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
  const imageKey = `provider-packages/${uuidv4()}${fileExtension}`;

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
    Key: imageKey.split('/').pop(), // Extract the image key
  };

  await s3.deleteObject(s3Params).promise();
};

const packageController = {
  createPackage: async (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      try {
        const { providerId, packageName, priceRs,  discountPlatformCom, comments, noOfJobOffers, validity } = req.body;

        if (!providerId || !packageName || !priceRs  || !discountPlatformCom || !comments || !noOfJobOffers || !req.file || !validity) {
          return res.status(400).json({ message: "Please provide all required fields and upload an image" });
        }

        // Upload the image to AWS S3
        const imageKey = await uploadImageToS3(req.file);

        // Create a new package object with the image key
        const newPackage = new ProviderPackage({
          providerId,
          packageName,
          priceRs,
          discountPlatformCom,
          comments,
          noOfJobOffers,
          image: imageKey,
          validity // Store the validity directly
        });

        // Save the package object to the database
        const savedPackage = await newPackage.save();

        // Respond with the created package object
        res.status(201).json(savedPackage);
      } catch (error) {
        console.error("Error creating package:", error);
        res.status(500).json({ error: error.message });
      }
    });
  },

  getAllPackages: async (req, res) => {
    try {
      const packages = await ProviderPackage.find();
      res.status(200).json(packages);
    } catch (error) {
      console.error("Error retrieving packages:", error);
      res.status(500).json({ error: "Failed to get all the data" });
    }
  },

  getPackageByProviderId: async (req, res) => {
    try {
      const { providerId } = req.params;

      if (!providerId) {
        return res.status(400).json({ message: "Provider ID not provided!" });
      }

      const packageData = await ProviderPackage.find({ providerId });

      if (packageData.length === 0) {
        return res.status(404).json({ message: "No packages found for this provider ID!" });
      }

      res.status(200).json(packageData);
    } catch (error) {
      console.error("Error retrieving packages by provider ID:", error);
      res.status(500).json({ error: "Failed to get data for provider ID!", details: error });
    }
  },

  updatePackage: async (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      try {
        const { id } = req.params;
        const updates = req.body;

        // Handle image update
        if (req.file) {
          const newImageKey = await uploadImageToS3(req.file);
          updates.image = newImageKey;

          // Delete the old image from S3 if it exists
          const packageData = await ProviderPackage.findById(id);
          if (packageData && packageData.image) {
            await deleteImageFromS3(packageData.image);
          }
        }

        const updatedPackage = await ProviderPackage.findByIdAndUpdate(id, updates, {
          new: true,
          runValidators: true,
        });

        if (!updatedPackage) {
          return res.status(404).json({ message: "Package not found!" });
        }

        res.status(200).json(updatedPackage);
      } catch (error) {
        console.error("Error updating package:", error);
        res.status(500).json({ error: "Failed to update package!", details: error });
      }
    });
  },

  deletePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const removedPackage = await ProviderPackage.findByIdAndDelete(id);

      if (!removedPackage) {
        return res.status(404).json({ message: "Package ID not found!" });
      }

      // Delete the image from S3 if it exists
      if (removedPackage.image) {
        await deleteImageFromS3(removedPackage.image);
      }

      res.status(200).json({ message: "Package deleted successfully!", removedPackage });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ error: "Failed to delete package!" });
    }
  }
};

export default packageController;
