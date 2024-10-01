import User from '../user-auth-models/user.auth.model.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';

dotenv.config();

// Azure Blob Storage setup
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('image');

// Upload image to Azure Blob Storage
const uploadImageToAzure = async (file) => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const fileExtension = path.extname(file.originalname);
  const blobName = `users/${uuidv4()}${fileExtension}`;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });
    return blockBlobClient.url; // Return the Azure Blob URL
  } catch (error) {
    throw new Error('Image upload failed: ' + error.message);
  }
};

// Delete image from Azure Blob Storage
const deleteImageFromAzure = async (blobName) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  try {
    await blockBlobClient.delete();
  } catch (error) {
    throw new Error('Image deletion failed: ' + error.message);
  }
};

// Generate a random OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// User controller object
const userController = {
  // Send OTP to the user's phone number
  sendOtp: async (req, res) => {
    const { phone } = req.body;

    try {
      let user = await User.findOne({ phone });
      const otp = generateOtp();

      if (!user) {
        user = new User({ phone, otp });
      } else {
        user.otp = otp;
      }

      await user.save();
      res.status(200).json({
        message: 'OTP sent, verify phone number',
        phone: user.phone,
        otp: user.otp,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error during OTP sending', error: error.message });
    }
  },

  // User login with OTP and optional image upload
  login: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during image upload', error: err.message });
      }

      const { phone, otp, email, name, displayName, gender, dateOfBirth, city } = req.body;
      const file = req.file;

      try {
        let user = await User.findOne({ phone });

        if (!user) {
          return res.status(400).json({ message: 'User not found' });
        }

        if (String(user.otp) !== String(otp)) {
          return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Update user fields
        user.phoneVerified = true;
        user.otp = null;
        user.email = email || user.email;
        user.name = name || user.name;
        user.displayName = displayName || user.displayName;
        user.gender = gender || user.gender;
        user.dateOfBirth = dateOfBirth || user.dateOfBirth;
        user.city = city || user.city;

        // Handle image upload
        if (file) {
          if (user.image) {
            const oldImageKey = user.image.split('/').pop();
            await deleteImageFromAzure(oldImageKey);
          }
          user.image = await uploadImageToAzure(file);
        }

        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
          message: 'Login successful',
          token: token,
          user: {
            _id: user._id,
            phone: user.phone,
            phoneVerified: user.phoneVerified,
            email: user.email || 'NA',
            name: user.name || 'NA',
            displayName: user.displayName || 'NA',
            gender: user.gender || 'NA',
            dateOfBirth: user.dateOfBirth || 'NA',
            city: user.city || 'NA',
            image: user.image,
          },
        });
      } catch (error) {
        res.status(500).json({ message: 'Error during login', error: error.message });
      }
    });
  },

  // Delete a user and their image
  deleteUser: async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'User ID is missing' });
    }

    try {
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.image) {
        const imageKey = user.image.split('/').pop();
        await deleteImageFromAzure(imageKey);
      }

      await user.deleteOne();
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
  },

  // Fetch all users
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data', err: error.message });
    }
  },

  // Fetch a single user by ID
  getUser: async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID is missing' });
    }

    try {
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
  },

  // Update user information
  updateUser: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during image upload', error: err.message });
      }

      const { id } = req.params;
      const { email, name, displayName, phone, gender, dateOfBirth, city } = req.body;

      try {
        let user = await User.findById(id);

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Update the user fields if they are provided
        user.email = email || user.email;
        user.name = name || user.name;
        user.displayName = displayName || user.displayName;
        user.phone = phone || user.phone;
        user.gender = gender || user.gender;
        user.dateOfBirth = dateOfBirth || user.dateOfBirth;
        user.city = city || user.city;

        // Handle image upload
        if (req.file) {
          if (user.image) {
            const oldImageKey = user.image.split('/').pop();
            await deleteImageFromAzure(oldImageKey);
          }
          user.image = await uploadImageToAzure(req.file);
        }

        await user.save();
        res.status(200).json({ message: 'User updated successfully', user });
      } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
      }
    });
  }
};

export default userController;
