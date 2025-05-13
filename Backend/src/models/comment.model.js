import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true,
    maxlength: 140, // 140 character limit as per requirements
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for efficient querying
commentSchema.index({ meme: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;