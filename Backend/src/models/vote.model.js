import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  meme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meme",
    required: true,
  },
  voteType: {
    type: String,
    enum: ["upvote", "downvote"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Ensure one vote per user per meme
voteSchema.index({ user: 1, meme: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;