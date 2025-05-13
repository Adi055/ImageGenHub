import express from "express"
import cors from "cors"
import http from "http"
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
import connectDB from "./src/db/db.js";

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from "./src/routes/auth.routes.js";
import memeRoutes from "./src/routes/meme.routes.js";
import commentRoutes from "./src/routes/comment.routes.js";
import voteRoutes from "./src/routes/vote.routes.js";

const app = express()
const server = http.createServer(app)

// Middleware
app.use(cors({
    origin: "*",
    credentials: true
}))
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to database
connectDB();

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/memes', memeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/votes', voteRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('ImageGenHub API is running');
});

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})