import AWS from "aws-sdk";
import Silver from "../model/silver.model.js";
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
  const imageKey = `silver/${uuidv4()}${fileExtension}`;

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

const silverController = {
  createSilver: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: "Error uploading image" });
      }

      try {
        const { name, amount, points,minimumSpentValue,discount } = req.body;

        if (!name || !amount || !points || !minimumSpentValue || !discount || !req.file ) {
          return res.status(400).json({ message: "Please provide all required fields" });
        }

        // Upload the image to AWS S3
        const imageKey = await uploadImageToS3(req.file);

        // Create a new silver object with the image key
        const silver = new Silver({
          name,
          image: imageKey,
          amount,
          points: Number(points),
          minimumSpentValue,
          discount
        });

        // Save the silver object to the database
        const savedSilver = await silver.save();

        // Respond with the created silver object
        res.status(201).json(savedSilver);
      } catch (error) {
        console.error("Error creating silver:", error);
        res.status(400).json({ message: error.message });
      }
    });
  },

  getAllSilver: async (req, res) => {
    try {
      const silverItems = await Silver.find();
      res.json(silverItems);
    } catch (error) {
      console.error("Error retrieving silver items:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getSilverById: async (req, res) => {
    try {
      const silver = await Silver.findById(req.params.id);
      if (!silver) {
        return res.status(404).json({ message: "Silver item not found" });
      }
      res.json(silver);
    } catch (error) {
      console.error("Error retrieving silver by ID:", error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteSilver: async (req, res) => {
    try {
      const silver = await Silver.findById(req.params.id);
      if (!silver) {
        return res.status(404).json({ message: "Silver item not found" });
      }

      // Delete the image from S3
      await deleteImageFromS3(silver.image);

      // Delete the silver item from the database
      await Silver.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Silver item deleted successfully" });
    } catch (error) {
      console.error("Error deleting silver item:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

export default silverController;
