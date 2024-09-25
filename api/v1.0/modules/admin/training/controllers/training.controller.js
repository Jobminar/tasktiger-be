import AWS from 'aws-sdk';
import Training from '../models/training.model.js';
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

// Function to upload video to S3 with a specific key pattern
const uploadVideoToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const videoKey = `training-videos/${uuidv4()}${fileExtension}`;

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
    url: uploadResult.Location,  // Public URL of the uploaded video
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

// Error handling function for Multer
const handleMulterError = (err, res) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const trainingController = {
  createTraining: async (req, res) => {
    upload(req, res, async (err) => {
      handleMulterError(err, res);
  
      try {
        const { serviceId, quickLinks, skip, job, title } = req.body;
  
        // Convert `quickLinks` and `skip` to booleans
        const quickLinksBool = quickLinks === 'true';
        const skipBool = skip === 'true';
  
        if (!serviceId || typeof quickLinksBool !== 'boolean' || !job || !title || !req.file) {
          return res.status(400).json({ message: 'Please provide all required fields' });
        }
  
        // Upload the video to AWS S3
        const { key: videoKey, url: videoUrl } = await uploadVideoToS3(req.file);
  
        // Create a new training object with the video key and URL
        const training = new Training({
          serviceId,
          quickLinks: quickLinksBool,
          skip: skipBool,
          job,
          title,
          videoKey,
          videoUrl,
        });
  
        // Save the training object to the database
        const savedTraining = await training.save();
  
        // Respond with the created training object including the video URL
        res.status(201).json({
          ...savedTraining.toObject(),
          videoUrl,  // Ensure video URL is included in response
        });
      } catch (error) {
        console.error('Error creating training:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  },
    
 
  getAllTrainings: async (req, res) => {
    try {
      // Fetch all trainings from the database
      const trainings = await Training.find();
  
      // Map through the trainings to include the videoUrl in the response
      const response = trainings.map(training => ({
        ...training.toObject(),
        videoUrl: training.videoUrl // Ensure video URL is included
      }));
  
      // Respond with the list of trainings including video URLs
      res.json(response);
    } catch (error) {
      console.error('Error retrieving trainings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  

  getTrainingById: async (req, res) => {
    try {
      const training = await Training.findById(req.params.id);
      if (!training) {
        return res.status(404).json({ message: 'Training not found' });
      }
      res.json(training);
    } catch (error) {
      console.error('Error retrieving training by ID:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  deleteTraining: async (req, res) => {
    try {
      const training = await Training.findById(req.params.id);
      if (!training) {
        return res.status(404).json({ message: 'Training not found' });
      }

      // Delete the video from S3
      await deleteVideoFromS3(training.videoKey);

      // Delete the training item from the database
      await Training.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: 'Training deleted successfully' });
    } catch (error) {
      console.error('Error deleting training:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateTraining: async (req, res) => {
    upload(req, res, async (err) => {
      handleMulterError(err, res);

      try {
        const { serviceId, quickLinks, skip, job, title } = req.body;
        const { id } = req.params;

        // Convert `quickLinks` and `skip` to booleans
        const quickLinksBool = quickLinks === 'true';
        const skipBool = skip === 'true';

        if (!serviceId || typeof quickLinksBool !== 'boolean' || !job || !title) {
          return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const training = await Training.findById(id);
        if (!training) {
          return res.status(404).json({ message: 'Training not found' });
        }

        // Update the training object
        training.serviceId = serviceId;
        training.quickLinks = quickLinksBool;
        training.skip = skipBool;
        training.job = job;
        training.title = title;

        // Check if a new video file is provided
        if (req.file) {
          // Upload the new video to AWS S3
          const { key: newVideoKey, url: newVideoUrl } = await uploadVideoToS3(req.file);

          // Delete the old video from S3
          await deleteVideoFromS3(training.videoKey);

          // Update the video key and URL in the training object
          training.videoKey = newVideoKey;
          training.videoUrl = newVideoUrl;
        }

        // Save the updated training object to the database
        const updatedTraining = await training.save();

        // Respond with the updated training object including the video URL
        res.status(200).json({
          ...updatedTraining.toObject(),
          videoUrl: training.videoUrl,  // Include updated video URL in response
        });
      } catch (error) {
        console.error('Error updating training:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  },
};

export default trainingController;
