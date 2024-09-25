import User from '../user-auth-models/user.auth.model.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import AWS from 'aws-sdk';

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
  const imageKey = `users/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return uploadResult.Location; // Return the S3 object URL
};

// Function to delete image from S3
const deleteImageFromS3 = async (imageKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
  };

  await s3.deleteObject(s3Params).promise();
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const userController = {
  sendOtp: async (req, res) => {
    const { phone } = req.body;

    try {
      let user = await User.findOne({ phone });

      const otp = generateOtp();

      if (!user) {
        user = new User({
          phone,
          otp,
        });
      } else {
        user.otp = otp;
      }

      await user.save();

      console.log('OTP sent successfully:', {
        phone: user.phone,
        otp: user.otp,
      });

      res.status(200).json({
        message: 'OTP sent, verify phone number',
        phone: user.phone,
        otp: user.otp,
      });
    } catch (error) {
      console.error('Error during OTP sending:', error);
      res.status(500).json({ message: 'Error during OTP sending', error });
    }
  },

  login: async (req, res) => {
    upload(req, res, async function (err) {
      if (err) {
        console.error('Error during image upload:', err);
        return res.status(500).json({ message: 'Error during image upload', error: err });
      }
  
      const { phone, otp, email, name, displayName, gender, dateOfBirth, city } = req.body;
      const file = req.file;
  
      try {
        let user = await User.findOne({ phone });
  
        if (!user) {
          console.error('User not found for phone:', phone);
          return res.status(400).json({ message: 'User not found' });
        }
  
        // Ensure both OTP values are strings for comparison
        if (String(user.otp) !== String(otp)) {
          console.error('Invalid OTP for phone:', phone);
          return res.status(400).json({ message: 'Invalid OTP' });
        }
  
        // If the email is provided and it differs from the one in the database
        if (email && user.email && email !== user.email) {
          console.error('Email mismatch for phone:', phone);
          return res.status(400).json({ message: 'Email mismatch' });
        }
  
        // Update the user fields with provided values or fallback to existing ones
        user.phoneVerified = true;
        user.otp = null;
        user.email = email || user.email;
        user.name = name || user.name;
        user.displayName = displayName || user.displayName;
  
        if (gender) {
          user.gender = gender;
        }
  
        if (dateOfBirth) {
          user.dateOfBirth = dateOfBirth;
        }
  
        if (city) {
          user.city = city;
        }
  
        if (file) {
          if (user.image) {
            const oldImageKey = user.image.split('.com/')[1];
            await deleteImageFromS3(oldImageKey);
          }
          user.image = await uploadImageToS3(file);
        }
  
        await user.save();
  
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
  
        // Prepare the response user object with default "NA" values if fields are empty
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
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Error during login', error });
      }
    });
  },

  deleteUser: async (req, res) => {
    const { id } = req.params;
  
    if (!id) {
      return res.status(400).json({ message: 'User ID is missing' });
    }
  
    try {
      // Find the user by ID
      const user = await User.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // If the user has an image, delete it from S3
      if (user.image) {
        const imageKey = user.image.split('.com/')[1]; // Extract the image key from the URL
        await deleteImageFromS3(imageKey); // Delete image from S3
      }
  
      // Delete the user from the database
      await user.deleteOne();
  
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error deleting user', error });
    }
  },
  
   

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to get data', err: error });
    }
  },

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
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Error fetching user', error });
    }
  },

  updateUser: async (req, res) => {
    upload(req, res, async function (err) {
      if (err) {
        console.error('Error during image upload:', err);
        return res.status(500).json({ message: 'Error during image upload', error: err });
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
  
        // If an image is provided, update it
        if (req.file) {
          if (user.image) {
            const oldImageKey = user.image.split('.com/')[1];
            await deleteImageFromS3(oldImageKey);
          }
          user.image = await uploadImageToS3(req.file);
        }
  
        await user.save();
  
        res.status(200).json({ message: 'User updated successfully', user });
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error });
      }
    });
  },
  
};

export default userController;
