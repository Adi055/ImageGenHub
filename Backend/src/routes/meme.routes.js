import express from "express";
import mongoose from "mongoose";
import Meme from "../models/meme.model.js";
import Vote from "../models/vote.model.js";
import Comment from "../models/comment.model.js";
import View from "../models/view.model.js";
import { authMiddleware, optionalAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads/memes');

// Get server base URL from environment variables or use default
// IMPORTANT: Always use the deployed URL for production
const SERVER_BASE_URL = 'https://igh-backend.onrender.com' ;

const router = express.Router();

// Helper function to convert relative path to full URL
const getFullImageUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath; // Already a full URL
  return `${SERVER_BASE_URL}${relativePath}`;
};

// Upload meme image (requires auth)
router.post("/upload", authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Create the relative URL for the uploaded file
    const relativeUrl = `/uploads/memes/${req.file.filename}`;
    
    // Convert to full URL
    const fullImageUrl = getFullImageUrl(relativeUrl);
    
    res.status(200).json({ 
      message: "Image uploaded successfully", 
      imageUrl: fullImageUrl,
      relativeUrl: relativeUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create a new meme (requires auth)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { imageUrl, topText, bottomText, textColor, fontSize, textPosition, isTemplate } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }
    
    // Ensure we're storing the full URL
    const fullImageUrl = getFullImageUrl(imageUrl);
    
    const newMeme = new Meme({
      creator: req.user.id,
      imageUrl: fullImageUrl,
      topText,
      bottomText,
      textColor,
      fontSize,
      textPosition,
      isTemplate,
    });
    
    await newMeme.save();
    
    res.status(201).json({ message: "Meme created successfully", meme: newMeme });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all memes with pagination and sorting
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "new" } = req.query;
    const skip = (page - 1) * limit;
    
    let sortOption = {};
    
    switch (sort) {
      case "top_day":
        // Get memes from the last 24 hours, sorted by vote count
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        sortOption = { createdAt: { $gte: oneDayAgo } };
        break;
      case "top_week":
        // Get memes from the last week, sorted by vote count
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        sortOption = { createdAt: { $gte: oneWeekAgo } };
        break;
      case "top_all":
        // Sort by vote count, all time
        break;
      case "new":
      default:
        // Sort by creation date (newest first)
        sortOption = { createdAt: -1 };
        break;
    }
    
    // Get memes with vote counts
    const memes = await Meme.find()
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("creator", "username profilePicture");
    
    // Get total count for pagination
    const total = await Meme.countDocuments();
    
    // For each meme, get vote count and user's vote if authenticated
    const memesWithVotes = await Promise.all(
      memes.map(async (meme) => {
        // Get upvotes and downvotes
        const upvotes = await Vote.countDocuments({ meme: meme._id, voteType: "upvote" });
        const downvotes = await Vote.countDocuments({ meme: meme._id, voteType: "downvote" });
        
        // Get user's vote if authenticated
        let userVote = null;
        if (req.user) {
          const vote = await Vote.findOne({ meme: meme._id, user: req.user.id });
          userVote = vote ? vote.voteType : null;
        }
        
        // Get comment count
        const commentCount = await Comment.countDocuments({ meme: meme._id });
        
        return {
          ...meme._doc,
          upvotes,
          downvotes,
          voteCount: upvotes - downvotes,
          userVote,
          commentCount,
        };
      })
    );
    
    // If sorting by votes, sort the results
    if (sort.startsWith("top_")) {
      memesWithVotes.sort((a, b) => b.voteCount - a.voteCount);
    }
    
    res.status(200).json({
      memes: memesWithVotes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalMemes: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get a single meme by ID
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const meme = await Meme.findById(req.params.id)
      .populate("creator", "username profilePicture");
    
    if (!meme) {
      return res.status(404).json({ message: "Meme not found" });
    }
    
    // Track view count for both authenticated and anonymous users
    try {
      // Get IP address for all users (as a fallback for anonymous users)
      const ipAddress = req.headers['x-forwarded-for'] || 
                        req.connection.remoteAddress || 
                        'unknown';
      
      let viewData = {
        meme: meme._id,
        ip: ipAddress
      };
      
      // Add user ID if authenticated
      if (req.user) {
        viewData.user = req.user.id;
        
        // Check if this user has already viewed this meme
        const existingUserView = await View.findOne({
          meme: meme._id,
          user: req.user.id
        });
        
        if (!existingUserView) {
          // Create new view record
          const newView = new View(viewData);
          await newView.save();
          
          // Increment view count
          meme.views += 1;
          await meme.save();
        }
      } else {
        // For anonymous users, check by IP
        const existingIPView = await View.findOne({
          meme: meme._id,
          ip: ipAddress,
          user: { $exists: false }, // Make sure it's an anonymous view
          viewedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hour cooldown
        });
        
        if (!existingIPView) {
          // Create new view record for anonymous user
          const newView = new View(viewData);
          await newView.save();
          
          // Increment view count
          meme.views += 1;
          await meme.save();
        }
      }
    } catch (viewError) {
      console.error("Error tracking view:", viewError);
    }
    
    // Get upvotes and downvotes
    const upvotes = await Vote.countDocuments({ meme: meme._id, voteType: "upvote" });
    const downvotes = await Vote.countDocuments({ meme: meme._id, voteType: "downvote" });
    
    // Get user's vote if authenticated
    let userVote = null;
    if (req.user) {
      const vote = await Vote.findOne({ meme: meme._id, user: req.user.id });
      userVote = vote ? vote.voteType : null;
    }
    
    // Get comments
    const comments = await Comment.find({ meme: meme._id })
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture");
    
    // Make sure to include the views count in the response
    res.status(200).json({
      meme: {
        ...meme._doc,
        views: meme.views, // Explicitly include views to ensure it's in the response
        upvotes,
        downvotes,
        voteCount: upvotes - downvotes,
        userVote,
      },
      comments,
    });
    
    // Log the view count for debugging
    console.log(`Meme ${meme._id} view count: ${meme.views}`);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update a meme (creator only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { topText, bottomText, textColor, fontSize, textPosition, imageUrl } = req.body;
    
    // Find meme
    const meme = await Meme.findById(req.params.id);
    
    if (!meme) {
      return res.status(404).json({ message: "Meme not found" });
    }
    
    // Check if user is the creator
    if (meme.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this meme" });
    }
    
    // Update fields
    meme.topText = topText || meme.topText;
    meme.bottomText = bottomText || meme.bottomText;
    meme.textColor = textColor || meme.textColor;
    meme.fontSize = fontSize || meme.fontSize;
    meme.textPosition = textPosition || meme.textPosition;
    
    // Update imageUrl if provided, ensuring it's a full URL
    if (imageUrl) {
      meme.imageUrl = getFullImageUrl(imageUrl);
    }
    
    await meme.save();
    
    // Return the updated meme with full image URL
    const updatedMeme = meme.toObject();
    updatedMeme.imageUrl = getFullImageUrl(updatedMeme.imageUrl);
    
    res.status(200).json({ message: "Meme updated successfully", meme: updatedMeme });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a meme (creator only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Find meme
    const meme = await Meme.findById(req.params.id);
    
    if (!meme) {
      return res.status(404).json({ message: "Meme not found" });
    }
    
    // Check if user is the creator
    if (meme.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this meme" });
    }
    
    // Delete meme and associated votes and comments
    await Promise.all([
      Meme.findByIdAndDelete(req.params.id),
      Vote.deleteMany({ meme: req.params.id }),
      Comment.deleteMany({ meme: req.params.id }),
    ]);
    
    res.status(200).json({ message: "Meme deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Flag a meme
router.post("/:id/flag", authMiddleware, async (req, res) => {
  try {
    const meme = await Meme.findById(req.params.id);
    
    if (!meme) {
      return res.status(404).json({ message: "Meme not found" });
    }
    
    meme.flags += 1;
    await meme.save();
    
    res.status(200).json({ message: "Meme flagged successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get meme of the day
router.get("/trending/day", async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get all memes from the last 24 hours
    const recentMemes = await Meme.find({ createdAt: { $gte: oneDayAgo } })
      .populate("creator", "username profilePicture");
    
    // Get vote counts for each meme
    const memesWithVotes = await Promise.all(
      recentMemes.map(async (meme) => {
        const upvotes = await Vote.countDocuments({ meme: meme._id, voteType: "upvote" });
        const downvotes = await Vote.countDocuments({ meme: meme._id, voteType: "downvote" });
        
        return {
          ...meme._doc,
          voteCount: upvotes - downvotes,
        };
      })
    );
    
    // Sort by vote count and get the top one
    memesWithVotes.sort((a, b) => b.voteCount - a.voteCount);
    
    const memeOfTheDay = memesWithVotes[0] || null;
    
    res.status(200).json({ memeOfTheDay });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get weekly champion
router.get("/trending/week", async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get all memes from the last week
    const weeklyMemes = await Meme.find({ createdAt: { $gte: oneWeekAgo } })
      .populate("creator", "username profilePicture");
    
    // Get vote counts for each meme
    const memesWithVotes = await Promise.all(
      weeklyMemes.map(async (meme) => {
        const upvotes = await Vote.countDocuments({ meme: meme._id, voteType: "upvote" });
        const downvotes = await Vote.countDocuments({ meme: meme._id, voteType: "downvote" });
        
        return {
          ...meme._doc,
          voteCount: upvotes - downvotes,
        };
      })
    );
    
    // Sort by vote count and get the top one
    memesWithVotes.sort((a, b) => b.voteCount - a.voteCount);
    
    const weeklyChampion = memesWithVotes[0] || null;
    
    res.status(200).json({ weeklyChampion });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's memes (dashboard)
router.get("/user/dashboard", authMiddleware, async (req, res) => {
  try {
    const userMemes = await Meme.find({ creator: req.user.id })
      .sort({ createdAt: -1 });
    
    // Get stats for each meme
    const memesWithStats = await Promise.all(
      userMemes.map(async (meme) => {
        const upvotes = await Vote.countDocuments({ meme: meme._id, voteType: "upvote" });
        const downvotes = await Vote.countDocuments({ meme: meme._id, voteType: "downvote" });
        const commentCount = await Comment.countDocuments({ meme: meme._id });
        
        return {
          ...meme._doc,
          views: meme.views, // Explicitly include views to ensure it's in the response
          upvotes,
          downvotes,
          voteCount: upvotes - downvotes,
          commentCount,
        };
      })
    );
    
    res.status(200).json({ memes: memesWithStats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;