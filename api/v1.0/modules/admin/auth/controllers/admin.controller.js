  import bcrypt from "bcryptjs";
  import jwt from "jsonwebtoken";
  import Admin from "../models/admin.model.js";
  import dotenv from "dotenv";
  import nodemailer from "nodemailer";

  dotenv.config();

  // Configure the transporter for sending emails   
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Method to generate a random 4-digit OTP
  const generateOtp = () => {
    const digits = '1234567890';
    let otp = '';
    for (let i = 0; i < 4; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  };

  // Function to send OTP via email
  const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Forgot Password OTP for Your Account`,
      text: `Your OTP for resetting the password is ${otp}. Please enter this code to proceed. This code will expire in 5 minutes.`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("OTP sent:", info.response);
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error; // Re-throw for proper error handling
    }
  };

  const adminController = {
    // Method to send OTP for resetting password
    sendForgotPasswordOtp: async (req, res) => {
      const { email } = req.body;

      try {
        // Check if user exists
        const user = await Admin.findOne({ email });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Generate OTP
        const otp = generateOtp();

        // Send OTP via email
        await sendOtpEmail(email, otp);

        // Optionally, you can store the OTP in the database associated with the user's email and set an expiration time for the OTP

        res.status(200).json({ message: "OTP sent successfully" });
      } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },

    // Method to handle user signup
    signup: async (req, res) => {
      const { email, password } = req.body;

      try {
        // Check if user already exists
        const existingUser = await Admin.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin user
        const newAdmin = new Admin({ email, password: hashedPassword });
        await newAdmin.save();

        res.status(201).json({ message: "User created successfully" });
      } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },

    // Method to handle user login
    login: async (req, res) => {
      const { email, password } = req.body;

      try {
        // Check if user exists
        const user = await Admin.findOne({ email });
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check if password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

        // Return token and user ID
        res.status(200).json({ token, adminId: user._id });
      } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
      // Method to send OTP for resetting password
      sendForgotPasswordOtp: async (req, res) => {
        const { email } = req.body;
    
        try {
          // Check if user exists
          const user = await Admin.findOne({ email });
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
    
          // Generate OTP
          const otp = generateOtp();
    
          // Set OTP and expiration time (1 minute from now)
          user.otp = otp;
          user.otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000);
          await user.save();
    
          // Send OTP via email
          await sendOtpEmail(email, otp);
    
          res.status(200).json({ message: "OTP sent successfully" });
        } catch (error) {
          console.error("Error sending OTP:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      },
    
    
      // Method to change password
      changePassword: async (req, res) => {
        const { email, otp, newPassword } = req.body;
    
        try {
          // Check if user exists
          const user = await Admin.findOne({ email });
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
    
          // Check if OTP is valid and not expired
          if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
          }
    
          // Hash the new password
          const hashedPassword = await bcrypt.hash(newPassword, 10);
    
          // Update the password and clear the OTP fields
          user.password = hashedPassword;
          user.otp = undefined;
          user.otpExpiresAt = undefined;
          await user.save();
    
          res.status(200).json({ message: "Password changed successfully" });
        } catch (error) {
          console.error("Error changing password:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      },
    
    
  };

  export default adminController;
  