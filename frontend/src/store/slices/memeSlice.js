import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://igh-backend.onrender.com/api/memes';

// Get auth token from localStorage
const getToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
};

// Create new meme
export const createMeme = createAsyncThunk(
  'memes/create',
  async (memeData, thunkAPI) => {
    try {
      const token = getToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(API_URL, memeData, config);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all memes with sorting
export const getMemes = createAsyncThunk(
  'memes/getAll',
  async (params, thunkAPI) => {
    try {
      const { page = 1, limit = 10, sort = 'new' } = params || {};
      const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}&sort=${sort}`);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get a single meme
export const getMeme = createAsyncThunk(
  'memes/get',
  async (id, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update a meme
export const updateMeme = createAsyncThunk(
  'memes/update',
  async ({ id, memeData }, thunkAPI) => {
    try {
      const token = getToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put(`${API_URL}/${id}`, memeData, config);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete a meme
export const deleteMeme = createAsyncThunk(
  'memes/delete',
  async (id, thunkAPI) => {
    try {
      const token = getToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.delete(`${API_URL}/${id}`, config);
      return id;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get user's memes (dashboard)
export const getUserMemes = createAsyncThunk(
  'memes/getUserMemes',
  async (_, thunkAPI) => {
    try {
      const token = getToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/user/dashboard`, config);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get trending memes
export const getTrendingMemes = createAsyncThunk(
  'memes/trending',
  async (period, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/trending/${period}`);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  memes: [],
  currentMeme: null,
  userMemes: [],
  trendingMemes: {
    day: null,
    week: null,
  },
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalMemes: 0,
  },
};

export const memeSlice = createSlice({
  name: 'memes',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    resetCurrentMeme: (state) => {
      state.currentMeme = null;
    },
    // Add a reducer to update vote counts in real-time
    updateVoteCount: (state, action) => {
      const { memeId, voteType, action: voteAction } = action.payload;
      
      // Update the current meme if it matches the voted meme
      if (state.currentMeme && state.currentMeme._id === memeId) {
        const meme = state.currentMeme;
        
        // Handle different vote actions
        if (voteAction === 'Vote removed') {
          // User removed their vote
          if (meme.userVote === 'upvote') {
            meme.upvotes = Math.max(0, meme.upvotes - 1);
          } else if (meme.userVote === 'downvote') {
            meme.downvotes = Math.max(0, meme.downvotes - 1);
          }
          meme.userVote = null;
        } else if (voteAction === 'Vote updated') {
          // User changed their vote from upvote to downvote or vice versa
          if (voteType === 'upvote') {
            meme.upvotes = Math.max(0, meme.upvotes + 1);
            meme.downvotes = Math.max(0, meme.downvotes - 1);
          } else if (voteType === 'downvote') {
            meme.downvotes = Math.max(0, meme.downvotes + 1);
            meme.upvotes = Math.max(0, meme.upvotes - 1);
          }
          meme.userVote = voteType;
        } else if (voteAction === 'Vote recorded') {
          // New vote
          if (voteType === 'upvote') {
            meme.upvotes += 1;
          } else if (voteType === 'downvote') {
            meme.downvotes += 1;
          }
          meme.userVote = voteType;
        }
        
        // Update the vote count
        meme.voteCount = meme.upvotes - meme.downvotes;
      }
      
      // Also update the meme in the memes list if it exists there
      if (state.memes && state.memes.length > 0) {
        state.memes = state.memes.map(meme => {
          if (meme._id === memeId) {
            // Apply the same vote count logic as above
            let updatedMeme = { ...meme };
            
            if (voteAction === 'Vote removed') {
              if (meme.userVote === 'upvote') {
                updatedMeme.upvotes = Math.max(0, meme.upvotes - 1);
              } else if (meme.userVote === 'downvote') {
                updatedMeme.downvotes = Math.max(0, meme.downvotes - 1);
              }
              updatedMeme.userVote = null;
            } else if (voteAction === 'Vote updated') {
              if (voteType === 'upvote') {
                updatedMeme.upvotes = Math.max(0, meme.upvotes + 1);
                updatedMeme.downvotes = Math.max(0, meme.downvotes - 1);
              } else if (voteType === 'downvote') {
                updatedMeme.downvotes = Math.max(0, meme.downvotes + 1);
                updatedMeme.upvotes = Math.max(0, meme.upvotes - 1);
              }
              updatedMeme.userVote = voteType;
            } else if (voteAction === 'Vote recorded') {
              if (voteType === 'upvote') {
                updatedMeme.upvotes += 1;
              } else if (voteType === 'downvote') {
                updatedMeme.downvotes += 1;
              }
              updatedMeme.userVote = voteType;
            }
            
            updatedMeme.voteCount = updatedMeme.upvotes - updatedMeme.downvotes;
            return updatedMeme;
          }
          return meme;
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createMeme.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createMeme.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.memes.unshift(action.payload.meme);
      })
      .addCase(createMeme.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getMemes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMemes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.memes = action.payload.memes;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalMemes: action.payload.totalMemes,
        };
      })
      .addCase(getMemes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getMeme.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMeme.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentMeme = action.payload.meme;
      })
      .addCase(getMeme.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateMeme.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateMeme.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.memes = state.memes.map((meme) =>
          meme._id === action.payload.meme._id ? action.payload.meme : meme
        );
        if (state.currentMeme && state.currentMeme._id === action.payload.meme._id) {
          state.currentMeme = action.payload.meme;
        }
      })
      .addCase(updateMeme.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteMeme.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMeme.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.memes = state.memes.filter((meme) => meme._id !== action.payload);
        state.userMemes = state.userMemes.filter((meme) => meme._id !== action.payload);
      })
      .addCase(deleteMeme.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getUserMemes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserMemes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.userMemes = action.payload.memes;
      })
      .addCase(getUserMemes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getTrendingMemes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTrendingMemes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.meta.arg === 'day') {
          state.trendingMemes.day = action.payload.memeOfTheDay;
        } else if (action.meta.arg === 'week') {
          state.trendingMemes.week = action.payload.weeklyChampion;
        }
      })
      .addCase(getTrendingMemes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, resetCurrentMeme, updateVoteCount } = memeSlice.actions;
export default memeSlice.reducer;
