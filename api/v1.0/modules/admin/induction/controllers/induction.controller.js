import Induction from '../models/induction.model.js';
import mongoose from 'mongoose';
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

dotenv.config();

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Store file in memory as a buffer
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /mp4|mov|wmv|avi|mkv/; // Allowed video types
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// Upload video to Azure Blob Storage
const uploadVideoToAzure = async (file, folderName) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const fileExtension = path.extname(file.originalname);
    const blobName = `${folderName}/${uuidv4()}${fileExtension}`; // Upload to a folder named 'induction-videos'
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadBlobResponse = await blockBlobClient.uploadData(file.buffer);
    console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);

    return blockBlobClient.url; // Return the URL of the uploaded video
  } catch (error) {
    console.error('Error uploading video to Azure:', error);
    throw new Error('Failed to upload video');
  }
};

// Create an induction
export const createInduction = async (req, res) => {
  try {
    const { categoryId, profession, title, skip } = req.body;
    const video = req.file; // Video file uploaded using multer

    if (!video) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    // Upload video to Azure Blob Storage
    const videoUrl = await uploadVideoToAzure(video, 'induction-videos');

    const induction = new Induction({
      categoryId,
      profession,
      title,
      skip: skip || false,
      video: videoUrl,
      watchedVideo: false,
    });

    const savedInduction = await induction.save();
    res.status(201).json(savedInduction);
  } catch (error) {
    console.error('Error creating induction:', error);
    res.status(500).json({ message: 'Server error while creating induction' });
  }
};

// Update an induction
export const updateInduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, profession, title, skip, watchedVideo } = req.body;
    const video = req.file; // Video file uploaded using multer
    let videoUrl;

    if (video) {
      // Upload new video to Azure Blob Storage
      videoUrl = await uploadVideoToAzure(video, 'induction-videos');
    }

    const updatedInduction = await Induction.findByIdAndUpdate(
      id,
      {
        categoryId,
        profession,
        title,
        skip: skip || false,
        video: videoUrl || undefined, // Only update video if a new one is uploaded
        watchedVideo: watchedVideo !== undefined ? watchedVideo : undefined,
      },
      { new: true, runValidators: true }
    ).populate('categoryId');

    if (!updatedInduction) {
      return res.status(404).json({ message: 'Induction not found' });
    }

    res.status(200).json(updatedInduction);
  } catch (error) {
    console.error('Error updating induction:', error);
    res.status(500).json({ message: 'Error updating induction' });
  }
};

// Delete induction
export const deleteInduction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deletedInduction = await Induction.findByIdAndDelete(id);
    if (!deletedInduction) {
      return res.status(404).json({ message: 'Induction not found' });
    }

    // Optionally delete the video from Azure Blob Storage
    const blobName = deletedInduction.video.split('/').pop(); // Extract blob name from video URL
    await deleteVideoFromAzure(blobName); // Assuming this function exists for deletion

    res.status(200).json({ message: 'Induction deleted successfully' });
  } catch (error) {
    console.error('Error deleting induction:', error);
    res.status(500).json({ message: 'Error deleting induction' });
  }
};

// Get all inductions
export const getAllInductions = async (req, res) => {
  try {
    const inductions = await Induction.find().populate('categoryId');
    res.status(200).json(inductions);
  } catch (error) {
    console.error('Error fetching inductions:', error);
    res.status(500).json({ message: 'Failed to retrieve inductions' });
  }
};

// Get induction by ID
export const getInductionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const induction = await Induction.findById(id).populate('categoryId');
    if (!induction) {
      return res.status(404).json({ message: 'Induction not found' });
    }

    res.status(200).json(induction);
  } catch (error) {
    console.error('Error fetching induction:', error);
    res.status(500).json({ message: 'Error fetching induction' });
  }
};

export default {
  createInduction,
  updateInduction,
  deleteInduction,
  getAllInductions,
  getInductionById,
  upload, // Exporting multer upload for use in routes
};
