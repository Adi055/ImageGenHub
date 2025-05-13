import mongoose from "mongoose";

const memeSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  topText: {
    type: String,
    default: "",
  },
  bottomText: {
    type: String,
    default: "",
  },
  textColor: {
    type: String,
    default: "#FFFFFF",
  },
  fontSize: {
    type: Number,
    default: 36,
  },
  textPosition: {
    top: {
      x: { type: Number, default: 50 }, // percentage
      y: { type: Number, default: 10 }, // percentage
    },
    bottom: {
      x: { type: Number, default: 50 }, // percentage
      y: { type: Number, default: 90 }, // percentage
    },
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  flags: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Virtual for vote count
memeSchema.virtual('voteCount').get(function() {
  return this.upvotes - this.downvotes;
});

// Index for efficient querying
memeSchema.index({ createdAt: -1 });
memeSchema.index({ creator: 1, createdAt: -1 });

const Meme = mongoose.model("Meme", memeSchema);
export default Meme;