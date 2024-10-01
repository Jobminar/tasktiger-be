import { BlobServiceClient } from '@azure/storage-blob';
import Training from '../models/training.model.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('video');

// Function to upload video to Azure Blob Storage
const uploadVideoToAzure = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const blobName = `training-videos/${uuidv4()}${fileExtension}`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(file.buffer, file.buffer.length, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return {
    key: blobName,
    url: blockBlobClient.url,
  };
};

// Function to delete video from Azure Blob Storage
const deleteVideoFromAzure = async (videoKey) => {
  const blockBlobClient = containerClient.getBlockBlobClient(videoKey);
  await blockBlobClient.deleteIfExists();
};

// Error handling for multer
const handleMulterError = (err, res) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Training controller
const trainingController = {
  createTraining: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return handleMulterError(err, res);
      }

      try {
        const { serviceId, quickLinks, skip, job, title } = req.body;
        const quickLinksBool = quickLinks === 'true';
        const skipBool = skip === 'true';

        // Validate required fields
        if (!serviceId || !job || !title || !req.file) {
          return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Upload video to Azure
        const { key: videoKey, url: videoUrl } = await uploadVideoToAzure(req.file);

        // Create new training record
        const training = new Training({
          serviceId,
          quickLinks: quickLinksBool,
          skip: skipBool,
          job,
          title,
          videoKey,
          videoUrl,
        });

        const savedTraining = await training.save();
        res.status(201).json(savedTraining);
      } catch (error) {
        console.error('Error creating training:', error);
        res.status(500).json({ message: 'Internal server error', error });
      }
    });
  },

  getAllTrainings: async (req, res) => {
    try {
      const trainings = await Training.find();
      res.status(200).json(trainings);
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
      res.status(200).json(training);
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

      // Delete the video from Azure Blob Storage
      await deleteVideoFromAzure(training.videoKey);
      await training.deleteOne();

      res.status(200).json({ message: 'Training deleted successfully' });
    } catch (error) {
      console.error('Error deleting training:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateTraining: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return handleMulterError(err, res);
      }
  
      try {
        const { serviceId, quickLinks, skip, job, title } = req.body;
  
        const training = await Training.findById(req.params.id);
        if (!training) {
          return res.status(404).json({ message: 'Training not found' });
        }
  
        // Update only the fields that are provided in the request body
        if (serviceId) {
          training.serviceId = serviceId;
        }
        if (quickLinks !== undefined) {
          const quickLinksBool = quickLinks === 'true';
          training.quickLinks = quickLinksBool;
        }
        if (skip !== undefined) {
          const skipBool = skip === 'true';
          training.skip = skipBool;
        }
        if (job) {
          training.job = job;
        }
        if (title) {
          training.title = title;
        }
  
        // Check if a new video file is uploaded and update the video
        if (req.file) {
          const { key: newVideoKey, url: newVideoUrl } = await uploadVideoToAzure(req.file);
  
          // Delete the old video from Azure Blob Storage
          await deleteVideoFromAzure(training.videoKey);
  
          // Update the videoKey and videoUrl with the new uploaded file's data
          training.videoKey = newVideoKey;
          training.videoUrl = newVideoUrl;
        }
  
        // Save the updated training object
        const updatedTraining = await training.save();
        res.status(200).json(updatedTraining);
      } catch (error) {
        console.error('Error updating training:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  },  

};

export default trainingController;
