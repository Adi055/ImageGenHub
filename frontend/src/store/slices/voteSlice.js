import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://igh-backend.onrender.com/api/votes';

// Get auth token from localStorage
const getToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
};

// Vote on a meme
export const voteMeme = createAsyncThunk(
  'votes/vote',
  async ({ memeId, voteType }, thunkAPI) => {
    try {
      const token = getToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(`${API_URL}/${memeId}`, { voteType }, config);
      return { ...response.data, memeId };
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
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const voteSlice = createSlice({
  name: 'votes',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(voteMeme.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(voteMeme.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.lastVote = {
          memeId: action.payload.memeId,
          voteType: action.payload.vote?.voteType,
          action: action.payload.message // 'Vote recorded', 'Vote updated', or 'Vote removed'
        };
      })
      .addCase(voteMeme.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = voteSlice.actions;
export default voteSlice.reducer;
