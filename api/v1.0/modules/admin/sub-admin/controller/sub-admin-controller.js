import Subadmin from '../model/sub-admin-model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';  
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';  // To handle file extensions

dotenv.config();  

if (!process.env.AZURE_STORAGE_CONNECTION_STRING || !process.env.AZURE_STORAGE_CONTAINER_NAME) {
  throw new Error('Azure Storage connection string or container name not defined in environment variables.');
}
  
// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);

// Function to upload a file to Azure Blob Storage
const uploadFileToAzure = async (file) => {
  try {
    const fileExtension = path.extname(file.originalname);
    const blobName = `sub-admins/${uuidv4()}${fileExtension}`;  // Create a unique blob name
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    return blockBlobClient.url;  // Return the URL of the uploaded blob
  } catch (error) {
    console.error('Azure Blob Storage upload error:', error);
    throw new Error('Failed to upload file to Azure Blob Storage.');  // This will return a meaningful error message
  }
};

// Multer configuration for file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'image', maxCount: 1 },  // Allow 1 image file
  { name: 'documents', maxCount: 5 }  // Allow up to 5 document files
]);

const subadminController = {
  subAdminRegister: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: 'Error uploading files.' });
      }

      const {
        fullName,
        mobileNo,
        emailforCommunication,
        loginEmailId,
        password,
        dob,
        aadharNumber,
        pan,
        designation,
        experience,
        addressWithPincode,
        servingLocations,
        accountName,
        accountNumber,
        bankName,
        ifscCode,
        branchName,
        branchAddress
      } = req.body;

      try {
        // Check if the subadmin already exists
        const existingSubadmin = await Subadmin.findOne({ loginEmailId });
        if (existingSubadmin) {
          return res.status(400).json({ message: 'Subadmin already exists.' });
        }

        if (!password) {
          return res.status(400).json({ message: 'Password is required.' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 12);

        // Upload image to Azure Blob Storage (if provided)
        let imageUrl = '';
        if (req.files && req.files.image) {
          try {
            imageUrl = await uploadFileToAzure(req.files.image[0]);
          } catch (error) {
            return res.status(500).json({ message: 'Failed to upload image.', details: error.message });
          }
        }

        // Upload documents to Azure Blob Storage (if provided)
        let documentUrls = [];
        if (req.files && req.files.documents) {
          try {
            documentUrls = await Promise.all(req.files.documents.map((file) => uploadFileToAzure(file)));
          } catch (error) {
            return res.status(500).json({ message: 'Failed to upload documents.', details: error.message });
          }
        }

        // Create new Subadmin
        const newSubadmin = new Subadmin({
          fullName,
          mobileNo,
          emailforCommunication,
          loginEmailId,
          password: hashedPassword,
          dob,
          aadharNumber,
          pan,
          designation,
          experience,
          addressWithPincode,
          servingLocations,
          accountName,
          accountNumber,
          bankName,
          ifscCode,
          branchName,
          branchAddress,
          image: imageUrl,
          documents: documentUrls
        });

        await newSubadmin.save();

        res.status(201).json({ message: 'Subadmin registered successfully.' });
      } catch (error) {
        console.error('Error during subadmin registration:', error);
        res.status(500).json({ message: 'Something went wrong.', details: error.message });
      }
    });
  },

 
  subAdminLogin: async (req, res) => {
    const { loginEmailId, password } = req.body;
  
    // Log input data for debugging
    console.log('Login attempt with:', { loginEmailId, password });
  
    try {
      // Check if the subadmin exists
      const subadmin = await Subadmin.findOne({ loginEmailId });
      if (!subadmin) {
        console.log('Subadmin not found for email:', loginEmailId);  // Debugging log
        return res.status(404).json({ message: 'Subadmin not found.' });
      }
  
      // Check if the password matches
      const isPasswordCorrect = await bcrypt.compare(password, subadmin.password);
      if (!isPasswordCorrect) {
        console.log('Password does not match for:', loginEmailId);  // Debugging log
        return res.status(400).json({ message: 'Invalid credentials.' });
      }
  
      // Log that login is successful
      console.log('Subadmin logged in:', subadmin.loginEmailId);
  
      // Generate JWT token
      const token = jwt.sign(
        { id: subadmin._id, loginEmailId: subadmin.loginEmailId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
      );
  
      // Log the generated token for debugging
      console.log('JWT token generated:', token);
  
      res.status(200).json({ result: token, id: subadmin._id });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Something went wrong.', details: error.message });
    }
  },
  

  getAllSubAdmins: async (req, res) => {
    try {
      const subadmins = await Subadmin.find();
      res.status(200).json(subadmins);
    } catch (error) {
      console.error('Error retrieving subadmins:', error);
      res.status(500).json({ message: 'Failed to retrieve subadmins.', details: error.message });
    }
  },

  updateSubadmin: async (req, res) => {
    const subadminId = req.params.id;
    const updateFields = req.body;

    try {
      const updatedSubadmin = await Subadmin.findByIdAndUpdate(subadminId, updateFields, { new: true });
      if (!updatedSubadmin) {
        return res.status(404).json({ message: 'Subadmin not found.' });
      }
      res.status(200).json(updatedSubadmin);
    } catch (error) {
      console.error('Error updating subadmin:', error);
      res.status(500).json({ message: 'Failed to update subadmin.', details: error.message });
    }
  },
};

export default subadminController;
