import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import Reel from '../reels-model/reels.model.js';

dotenv.config();

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);

// Function to upload a file (image or video) to Azure Blob Storage
const uploadFileToAzure = async (file, containerName) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Create the container if it does not exist
    await containerClient.createIfNotExists();

    const blobName = `reels${uuidv4()}${path.extname(file.originalname)}`; // Generate unique blob name
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    return blockBlobClient.url; // Return the Blob URL
  } catch (error) {
    console.error("Error uploading file to Azure:", error);
    throw new Error("Failed to upload file to Azure");
  }
};

// Function to delete a file from Azure Blob Storage
const deleteFileFromAzure = async (blobUrl, containerName) => {
  const blobName = blobUrl.split("/").slice(-1)[0];
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.delete();
};

const reelController = {
  createReel: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading files:", err);
          return res.status(500).json({ error: "Error uploading files", details: err.message });
        }

        const { image, video } = req.files;

        if (!image || !video) {
          return res.status(400).json({ error: "Both image and video files are required" });
        }

        const imageUrl = await uploadFileToAzure(image[0], "reels-images");
        const videoUrl = await uploadFileToAzure(video[0], "reels-videos");

        const newReel = new Reel({
          image: imageUrl,
          video: videoUrl,
        });

        const savedReel = await newReel.save();
        res.status(201).json(savedReel);
      });
    } catch (error) {
      console.error("Error saving reel:", error);
      res.status(500).json({ error: "Error saving reel", details: error.message });
    }
  },

  getAllReels: async (req, res) => {
    try {
      const reels = await Reel.find();
      res.status(200).json(reels);
    } catch (error) {
      console.error("Error fetching reels:", error);
      res.status(500).json({ error: "Error fetching reels", details: error.message });
    }
  },

  getReelById: async (req, res) => {
    try {
      const { id } = req.params;
      const reel = await Reel.findById(id);

      if (!reel) {
        return res.status(404).json({ error: "Reel not found" });
      }

      res.status(200).json(reel);
    } catch (error) {
      console.error("Error fetching reel:", error);
      res.status(500).json({ error: "Error fetching reel", details: error.message });
    }
  },

  deleteReel: async (req, res) => {
    try {
      const { id } = req.params;
      const reel = await Reel.findById(id);

      if (!reel) {
        return res.status(404).json({ error: "Reel not found" });
      }

      await deleteFileFromAzure(reel.image, "reels-images");
      await deleteFileFromAzure(reel.video, "reels-videos");

      await Reel.findByIdAndDelete(id);

      res.status(200).json({ message: "Reel deleted successfully" });
    } catch (error) {
      console.error("Error deleting reel:", error);
      res.status(500).json({ error: "Error deleting reel", details: error.message });
    }
  },

  updateReel: async (req, res) => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          console.error("Error uploading files:", err);
          return res.status(500).json({ error: "Error uploading files", details: err.message });
        }

        const { id } = req.params;
        const reel = await Reel.findById(id);

        if (!reel) {
          return res.status(404).json({ error: "Reel not found" });
        }

        if (req.files.image) {
          await deleteFileFromAzure(reel.image, "reels-images");
          const newImageUrl = await uploadFileToAzure(req.files.image[0], "reels-images");
          reel.image = newImageUrl;
        }

        if (req.files.video) {
          await deleteFileFromAzure(reel.video, "reels-videos");
          const newVideoUrl = await uploadFileToAzure(req.files.video[0], "reels-videos");
          reel.video = newVideoUrl;
        }

        const updatedReel = await reel.save();
        res.status(200).json(updatedReel);
      });
    } catch (error) {
      console.error("Error updating reel:", error);
      res.status(500).json({ error: "Error updating reel", details: error.message });
    }
  },
};

export default reelController;
