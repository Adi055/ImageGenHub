import express from "express";
import Comment from "../models/comment.model.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Add a comment to a meme
router.post("/:memeId", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const { memeId } = req.params;
    
    // Validate comment length
    if (content.length > 140) {
      return res.status(400).json({ message: "Comment must be 140 characters or less" });
    }
    
    // Create new comment
    const newComment = new Comment({
      user: req.user.id,
      meme: memeId,
      content,
    });
    
    await newComment.save();
    
    // Populate user info
    await newComment.populate("user", "username profilePicture");
    
    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get comments for a meme
router.get("/:memeId", async (req, res) => {
  try {
    const { memeId } = req.params;
    
    const comments = await Comment.find({ meme: memeId })
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture");
    
    res.status(200).json({ comments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a comment (comment owner only)
router.delete("/:commentId", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    // Check if user is the comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }
    
    await Comment.findByIdAndDelete(req.params.commentId);
    
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;