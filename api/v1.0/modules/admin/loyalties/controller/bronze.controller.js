import AWS from "aws-sdk";
import Bronze from "../model/bronze.model.js";
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
  const imageKey = `bronze/${uuidv4()}${fileExtension}`;

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

const bronzeController = {
  createBronze: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: "Error uploading image" });
      }

      try {
        const { name, amount, points, minimumSpentValue, discount } = req.body;

        if (!name || !amount || !points || !minimumSpentValue || !discount || !req.file) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Upload the image to AWS S3
        const imageKey = await uploadImageToS3(req.file);

        // Create a new bronze object with the image key
        const bronze = new Bronze({
          name,
          image: imageKey,
          amount,
          points: Number(points),
          minimumSpentValue,
          discount,
        });

        // Save the bronze object to the database
        const savedBronze = await bronze.save();

        // Respond with the created bronze object
        res.status(201).json(savedBronze);
      } catch (error) {
        console.error("Error creating bronze:", error);
        res.status(400).json({ message: error.message });
      }
    });
  },

  getAllBronze: async (req, res) => {
    try {
      const bronzeItems = await Bronze.find();
      res.json(bronzeItems);
    } catch (error) {
      console.error("Error retrieving bronze items:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getBronzeById: async (req, res) => {
    try {
      const bronze = await Bronze.findById(req.params.id);
      if (!bronze) {
        return res.status(404).json({ message: "Bronze item not found" });
      }
      res.json(bronze);
    } catch (error) {
      console.error("Error retrieving bronze by ID:", error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteBronze: async (req, res) => {
    try {
      const bronze = await Bronze.findById(req.params.id);
      if (!bronze) {
        return res.status(404).json({ message: "Bronze item not found" });
      }

      // Delete the image from S3
      await deleteImageFromS3(bronze.image);

      // Delete the bronze item from the database
      await Bronze.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Bronze item deleted successfully" });
    } catch (error) {
      console.error("Error deleting bronze item:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

export default bronzeController;
