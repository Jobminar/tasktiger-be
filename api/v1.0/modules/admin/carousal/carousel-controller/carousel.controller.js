import AWS from "aws-sdk";
import ProviderBanner from "../model/provider.banner.model.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

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
  const imageKey = `provider-banner/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return uploadResult.Key;
};

// Function to delete image from S3
const deleteImageFromS3 = async (imageKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
  };

  await s3.deleteObject(s3Params).promise();
};

const providerBannerController = {
  createBanner: (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      try {
        const { name } = req.body;

        if (!name || !req.file) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Upload the image to AWS S3
        const imageKey = await uploadImageToS3(req.file);

        // Create a new banner object with the image key
        const banner = new ProviderBanner({
          name,
          image: imageKey,
        });

        // Save the banner object to the database
        const savedBanner = await banner.save();

        // Respond with the created banner object
        res.status(201).json(savedBanner);
      } catch (error) {
        console.error("Error creating banner:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  },

  getAllBanners: async (req, res) => {
    try {
      const banners = await ProviderBanner.find();
      res.json(banners);
    } catch (error) {
      console.error("Error retrieving banners:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getBannerById: async (req, res) => {
    try {
      const banner = await ProviderBanner.findById(req.params.id);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Error retrieving banner by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteBanner: async (req, res) => {
    try {
      const banner = await ProviderBanner.findById(req.params.id);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      // Delete the image from S3
      await deleteImageFromS3(banner.image);

      // Delete the banner item from the database
      await ProviderBanner.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateBanner: (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      try {
        const { name } = req.body;
        const { id } = req.params;

        const banner = await ProviderBanner.findById(id);
        if (!banner) {
          return res.status(404).json({ message: "Banner not found" });
        }

        if (req.file) {
          // Delete the old image from S3
          await deleteImageFromS3(banner.image);

          // Upload the new image to AWS S3
          const imageKey = await uploadImageToS3(req.file);

          banner.image = imageKey;
        }

        if (name) {
          banner.name = name;
        }

        // Save the updated banner object to the database
        const updatedBanner = await banner.save();

        // Respond with the updated banner object
        res.json(updatedBanner);
      } catch (error) {
        console.error("Error updating banner:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  },
};

export default providerBannerController;
