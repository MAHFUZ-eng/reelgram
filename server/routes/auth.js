// src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendVerificationEmail } = require("../src/services/emailService");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: "Email or username already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      displayName: displayName || username,
      verificationToken,
      verificationTokenExpires
    });
    await newUser.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, username, verificationToken);
    
    if (emailResult.success) {
      res.status(201).json({ 
        message: "User registered successfully. Please check your email to verify your account.",
        emailSent: true 
      });
    } else {
      res.status(201).json({ 
        message: "User registered successfully, but there was an issue sending the verification email. You can request a new verification email.",
        emailSent: false 
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({ 
        message: "Please verify your email address before logging in. Check your email for the verification link.",
        needsVerification: true,
        email: user.email
      });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// EMAIL VERIFICATION
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    // Find user with this verification token
    const user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired verification token. Please request a new verification email." 
      });
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Redirect to frontend success page or send JSON response
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/?verified=true`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// RESEND VERIFICATION EMAIL
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, user.username, verificationToken);
    
    if (emailResult.success) {
      res.json({ 
        message: "Verification email sent successfully. Please check your email.",
        emailSent: true 
      });
    } else {
      res.status(500).json({ 
        message: "Failed to send verification email. Please try again later.",
        emailSent: false 
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
