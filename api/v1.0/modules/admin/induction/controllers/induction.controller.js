import AWS from 'aws-sdk';
import Induction from '../models/induction.model.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('video');

// Function to upload video to S3
const uploadVideoToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const videoKey = `induction-video/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: videoKey,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return {
    key: uploadResult.Key,
    url: uploadResult.Location, // Full URL to the uploaded video
  };
};

// Function to delete video from S3
const deleteVideoFromS3 = async (videoKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: videoKey,
  };

  await s3.deleteObject(s3Params).promise();
};

const inductionController = {
 
  createInduction: async (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: "Server error" });
      }
  
      try {
        const { categoryId, profession, title } = req.body; // Removed watchedVideo from destructuring
  
        if (!categoryId || !profession || !title || !req.file) {
          return res.status(400).json({ message: 'Please provide all required fields' });
        }
  
        // Upload the video to AWS S3
        const { key: videoKey, url: videoUrl } = await uploadVideoToS3(req.file);
  
        // Create a new induction object with the video URL
        const induction = new Induction({
          categoryId,
          profession,
          title,
          videoKey, // Store videoKey in the database
          videoUrl, // Include video URL
        });
  
        // Save the induction object to the database
        const savedInduction = await induction.save();
  
        // Respond with the created induction object including only the video URL
        res.status(201).json({
          ...savedInduction.toObject(),
          videoUrl, // Include video URL in response
          videoKey: undefined, // Exclude videoKey from the response
        });
      } catch (error) {
        console.error('Error creating induction:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  },
   

  getAllInductions: async (req, res) => {
    try {
      const inductions = await Induction.find();
      res.json(inductions);
    } catch (error) {
      console.error("Error retrieving inductions:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getInductionById: async (req, res) => {
    try {
      const induction = await Induction.findById(req.params.id);
      if (!induction) {
        return res.status(404).json({ message: "Induction not found" });
      }
      res.json(induction);
    } catch (error) {
      console.error("Error retrieving induction by ID:", error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteInduction: async (req, res) => {
    try {
      const induction = await Induction.findById(req.params.id);
      if (!induction) {
        return res.status(404).json({ message: "Induction not found" });
      }

      // Delete the video from S3
      await deleteVideoFromS3(induction.videoKey);

      // Delete the induction item from the database
      await Induction.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Induction deleted successfully" });
    } catch (error) {
      console.error("Error deleting induction:", error);
      res.status(500).json({ message: error.message });
    }
  },
updateInduction: async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    try {
      const { id } = req.params;
      const updateData = req.body;

      // Find the existing induction by ID
      const induction = await Induction.findById(id);
      if (!induction) {
        return res.status(404).json({ message: "Induction not found" });
      }

      // Check if a new file is uploaded
      if (req.file) {
        // Upload the new video to AWS S3
        const { key: newVideoKey, url: newVideoUrl } = await uploadVideoToS3(req.file);

        // Delete the old video from S3
        await deleteVideoFromS3(induction.videoKey);

        // Update video key and URL
        induction.videoKey = newVideoKey;
        induction.videoUrl = newVideoUrl;
      }

      // Update other fields from request body
      Object.assign(induction, updateData);

      // Save the updated induction object to the database
      const updatedInduction = await induction.save();

      // Respond with the updated induction object
      res.status(200).json(updatedInduction);
    } catch (error) {
      console.error("Error updating induction:", error);
      res.status(500).json({ message: error.message });
    }
  });
}

};

export default inductionController;
