import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import AWS from "aws-sdk";
import Banners from '../banners-model/banners.model.js';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("image");

/// Function to upload image to S3
const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `Banners/${uuidv4()}${fileExtension}`;

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
const deleteImageFromS3 = async (imageUrl) => {
  const imageKey = imageUrl.split('.com/')[1]; // Extract the S3 key from the image URL
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
  };

  await s3.deleteObject(s3Params).promise();
};

const bannersController = {
  createBanners: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading image:", err);
          return res.status(500).json({ error: "Error uploading image", details: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { category, subCategory, name, price, service, bannerType } = req.body;
        const image = await uploadImageToS3(req.file);

        const newBanner = new Banners({
          category,
          subCategory,
          service,
          name,
          price,
          image,
          bannerType, // Include the bannerType
        });

        const savedBanner = await newBanner.save();
        res.status(201).json(savedBanner);
      });
    } catch (error) {
      console.error("Error saving banner:", error);
      res.status(500).json({ error: "Error saving banner", details: error.message });
    }
  },

  getAllBanners: async (req, res) => {
    try {
      const banners = await Banners.find();
      res.json(banners);
    } catch (error) {
      console.error("Error retrieving banners:", error);
      res.status(500).json({ message: error.message });
    }
  },

   getBannersByType : async (req, res) => {
    try {
      const { type } = req.params;
  
      // Validate if the type is one of the accepted enum values
      if (!["mostbooked", "appliance", "ourpopular"].includes(type)) {
        return res.status(400).json({ message: "Invalid banner type" });
      }
  
      // Find banners by bannerType
      const banners = await Banners.find({ bannerType: type });
  
      if (banners.length === 0) {
        return res.status(404).json({ message: `No banners found for type: ${type}` });
      }
  
      res.status(200).json(banners);
    } catch (error) {
      console.error("Error fetching banners by type:", error);
      res.status(500).json({ message: "Server error" });
    }
  },  

  deleteBanner: async (req, res) => {
    try {
      const banner = await Banners.findById(req.params.id);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      // Delete the image from S3
      await deleteImageFromS3(banner.image);

      // Delete the banner from the database
      await Banners.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({ message: error.message });
    }
  },

  updateBanner: async (req, res) => {
    upload(req, res, async (err) => {
      try {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: err.message });
        } else if (err) {
          return res.status(500).json({ message: "Server error" });
        }

        const { name, category, subCategory, price, service, bannerType } = req.body;
        const { id } = req.params;

        const banner = await Banners.findById(id);
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

        // Update other fields
        if (name) banner.name = name;
        if (category) banner.category = category;
        if (subCategory) banner.subCategory = subCategory;
        if (price) banner.price = price;
        if (service) banner.service = service;
        if (bannerType) banner.bannerType = bannerType; // Update bannerType if provided

        // Save the updated banner to the database
        const updatedBanner = await banner.save();
        res.json(updatedBanner);
      } catch (error) {
        console.error("Error updating banner:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },
};

export default bannersController;
