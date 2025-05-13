import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import memeReducer from './slices/memeSlice';
import commentReducer from './slices/commentSlice';
import voteReducer from './slices/voteSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    memes: memeReducer,
    comments: commentReducer,
    votes: voteReducer,
  },
});