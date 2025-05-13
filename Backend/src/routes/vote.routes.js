import express from "express";
import Vote from "../models/vote.model.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Vote on a meme (upvote or downvote)
router.post("/:memeId", authMiddleware, async (req, res) => {
  try {
    const { voteType } = req.body;
    const { memeId } = req.params;
    
    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({ message: "Invalid vote type" });
    }
    
    // Check if user has already voted on this meme
    const existingVote = await Vote.findOne({ meme: memeId, user: req.user.id });
    
    if (existingVote) {
      // If vote type is the same, remove the vote (toggle off)
      if (existingVote.voteType === voteType) {
        await Vote.findByIdAndDelete(existingVote._id);
        return res.status(200).json({ message: "Vote removed" });
      }
      
      // If vote type is different, update the vote
      existingVote.voteType = voteType;
      await existingVote.save();
      
      return res.status(200).json({ message: "Vote updated", vote: existingVote });
    }
    
    // Create new vote
    const newVote = new Vote({
      user: req.user.id,
      meme: memeId,
      voteType,
    });
    
    await newVote.save();
    
    res.status(201).json({ message: "Vote recorded", vote: newVote });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;