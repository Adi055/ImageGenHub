import mongoose from "mongoose";

const viewSchema = new mongoose.Schema({
  meme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meme",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Make optional to support anonymous users
  },
  ip: {
    type: String,
    default: null
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Create compound indexes for efficient querying
// For authenticated users: one view per user per meme (when user exists)
viewSchema.index({ meme: 1, user: 1 }, { unique: true, sparse: true });
// For non-authenticated users: track by IP with a time constraint
viewSchema.index({ meme: 1, ip: 1, viewedAt: 1 });

const View = mongoose.model("View", viewSchema);
export default View;
