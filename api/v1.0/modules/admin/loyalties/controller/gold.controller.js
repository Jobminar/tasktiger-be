import AWS from "aws-sdk";
import Gold from "../model/gold.model.js";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

// Function to upload image to S3
const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `gold/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer,
    ACL: 'public-read',
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

const goldController = {
  createGold: (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      try {
        const { name, amount, points, minimumSpentValue, discount } = req.body;

        if (!name || !amount || !points || !req.file || !minimumSpentValue || !discount) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Upload the image to AWS S3
        const imageKey = await uploadImageToS3(req.file);

        // Create a new gold object with the image key
        const gold = new Gold({
          name,
          image: imageKey,
          amount,
          points: Number(points),
          minimumSpentValue,
          discount
        });

        // Save the gold object to the database
        const savedGold = await gold.save();

        // Respond with the created gold object
        res.status(201).json(savedGold);
      } catch (error) {
        console.error("Error creating gold:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },

  getAllGold: async (req, res) => {
    try {
      const goldItems = await Gold.find();
      res.json(goldItems);
    } catch (error) {
      console.error("Error retrieving gold items:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getGoldById: async (req, res) => {
    try {
      const gold = await Gold.findById(req.params.id);
      if (!gold) {
        return res.status(404).json({ message: "Gold item not found" });
      }
      res.json(gold);
    } catch (error) {
      console.error("Error retrieving gold by ID:", error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteGold: async (req, res) => {
    try {
      const gold = await Gold.findById(req.params.id);
      if (!gold) {
        return res.status(404).json({ message: "Gold item not found" });
      }

      // Delete the image from S3
      await deleteImageFromS3(gold.image);

      // Delete the gold item from the database
      await Gold.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Gold item deleted successfully" });
    } catch (error) {
      console.error("Error deleting gold item:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

export default goldController;
