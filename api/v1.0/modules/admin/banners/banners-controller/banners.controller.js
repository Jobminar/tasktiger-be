import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import { BlobServiceClient } from "@azure/storage-blob";
import Banners from '../banners-model/banners.model.js';

dotenv.config();

const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

// Create the Azure Blob Storage container if it does not exist
const createContainerIfNotExists = async () => {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
};

createContainerIfNotExists()
    .catch(err => console.error("Error creating container:", err));

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

// Function to upload an image to Azure Blob Storage
const uploadImageToAzure = async (file) => {
    const fileExtension = path.extname(file.originalname);
    const blobName = `banners/${uuidv4()}${fileExtension}`; // Ensure virtual folder structure
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    return blockBlobClient.url; // Return the Azure Blob URL
};

// Function to delete an image from Azure Blob Storage
const deleteImageFromAzure = async (imageUrl) => {
    const blobName = imageUrl.split('/').pop(); // Get the blob name from URL
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();
};

const bannersController = {
    // Create a new banner
    createBanners: async (req, res) => {
        upload(req, res, async (err) => {
            if (err) {
                console.error("Error uploading image:", err);
                return res.status(500).json({ error: "Error uploading image", details: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const { category, subCategory, name, price, service, bannerType } = req.body;

            try {
                const image = await uploadImageToAzure(req.file);
                const newBanner = new Banners({ category, subCategory, service, name, price, image, bannerType });
                const savedBanner = await newBanner.save();
                res.status(201).json(savedBanner);
            } catch (error) {
                console.error("Error saving banner:", error);
                res.status(500).json({ error: "Error saving banner", details: error.message });
            }
        });
    },

    // Get all banners
    getAllBanners: async (req, res) => {
        try {
            const banners = await Banners.find();
            res.json(banners);
        } catch (error) {
            console.error("Error retrieving banners:", error);
            res.status(500).json({ message: error.message });
        }
    },

    // Get banners by type
    getBannersByType: async (req, res) => {
        const { type } = req.params;

        if (!["mostbooked", "appliance", "ourpopular"].includes(type)) {
            return res.status(400).json({ message: "Invalid banner type" });
        }

        try {
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

    // Delete a banner
    deleteBanner: async (req, res) => {
        try {
            const banner = await Banners.findById(req.params.id);
            if (!banner) {
                return res.status(404).json({ message: "Banner not found" });
            }

            await deleteImageFromAzure(banner.image);
            await Banners.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Banner deleted successfully" });
        } catch (error) {
            console.error("Error deleting banner:", error);
            res.status(500).json({ message: error.message });
        }
    },

    // Update a banner
    updateBanner: async (req, res) => {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(500).json({ message: "Server error" });
            }

            const { id } = req.params;

            try {
                const banner = await Banners.findById(id);
                if (!banner) {
                    return res.status(404).json({ message: "Banner not found" });
                }

                // If a new image is uploaded, delete the old one and upload the new one
                if (req.file) {
                    await deleteImageFromAzure(banner.image);
                    banner.image = await uploadImageToAzure(req.file);
                }

                const { name, category, subCategory, price, service, bannerType } = req.body;

                // Update fields if they are provided
                if (name) banner.name = name;
                if (category) banner.category = category;
                if (subCategory) banner.subCategory = subCategory;
                if (price) banner.price = price;
                if (service) banner.service = service;
                if (bannerType) banner.bannerType = bannerType;

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
