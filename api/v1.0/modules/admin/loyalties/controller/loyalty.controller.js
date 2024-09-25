import AWS from "aws-sdk";
import Loyalty from '../model/loyalty.model.js';
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

const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `loyalti/${uuidv4()}${fileExtension}`;

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

const deleteImageFromS3 = async (imageKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
  };

  await s3.deleteObject(s3Params).promise();
};

const loyaltiController = {
  createLoyalti: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ msg: "Error uploading image", error: err.message });
      }

      const { name, amount, points, minimumSpentValue, discount } = req.body;

      if (!req.file) {
        return res.status(400).json({ msg: "Image is required" });
      }

      try {
        const imageKey = await uploadImageToS3(req.file);

        const newLoyalty = new Loyalty({
          name,
          image: imageKey,
          amount,
          points,
          minimumSpentValue,
          discount,
        });

        await newLoyalty.save();
        res.status(201).json({ msg: 'Loyalty tier created successfully', loyalty: newLoyalty });
      } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
      }
    });
  },

  getAllLoyalty: async (req, res) => {
    try {
      const loyalties = await Loyalty.find();
      res.status(200).json(loyalties);
    } catch (err) {
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  },
  
  deleteLoyalty: async (req, res) => {
    try {
      const loyalty = await Loyalty.findById(req.params.id);
      if (!loyalty) {
        return res.status(404).json({ message: "Loyalti item not found" });
      }

      // Delete the image from S3
      await deleteImageFromS3(loyalty.image);

      // Delete the bronze item from the database
      await Loyalty.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Loyalti item deleted successfully" });
    } catch (error) {
      console.error("Error deleting bronze item:", error);
      res.status(500).json({ message: error.message });
    }
  },
  updateLoyalty: (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      try {
        const { name, amount, points, minimumSpentValue, discount } = req.body;
        const { id } = req.params;

        const loyalty = await Loyalty.findById(id);
        if (!loyalty) {
          return res.status(404).json({ message: "Loyalty item not found" });
        }

        if (req.file) {
          // Delete the old image from S3
          await deleteImageFromS3(loyalty.image);

          // Upload the new image to AWS S3
          const imageKey = await uploadImageToS3(req.file);

          loyalty.image = imageKey;
        }

        if (name) loyalty.name = name;
        if (amount) loyalty.amount = amount;
        if (points) loyalty.points = points;
        if (minimumSpentValue) loyalty.minimumSpentValue = minimumSpentValue;
        if (discount) loyalty.discount = discount;

        // Save the updated loyalty object to the database
        const updatedLoyalty = await loyalty.save();

        // Respond with the updated loyalty object
        res.json(updatedLoyalty);
      } catch (error) {
        console.error("Error updating loyalty item:", error);
        res.status(500).json({ message: error.message });
      }
    });
  },
};


export default loyaltiController;
