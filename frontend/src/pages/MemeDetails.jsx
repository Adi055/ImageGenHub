import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getMeme, deleteMeme, updateMeme, updateVoteCount } from '../store/slices/memeSlice';
import { getComments, addComment, deleteComment, clearComments } from '../store/slices/commentSlice';
import { voteMeme } from '../store/slices/voteSlice';
import { formatDistanceToNow } from 'date-fns';

function MemeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [commentText, setCommentText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeme, setEditedMeme] = useState(null);
  const canvasRef = useRef(null);
  
  const { user } = useSelector((state) => state.auth);
  const { currentMeme, isLoading: memeLoading } = useSelector((state) => state.memes);
  const { comments, isLoading: commentsLoading } = useSelector((state) => state.comments);
  
  
  


  useEffect(() => {
    dispatch(getMeme(id));
    dispatch(getComments(id));
    
    // Cleanup
    return () => {
      dispatch(clearComments());
    };
  }, [id, dispatch]);

  // Helper function to check if current user is the creator of the meme
  const isCreator = () => {
    if (!user || !currentMeme?.creator) return false;
    
    // Get user ID - could be in different formats depending on auth implementation
    const userId = user.user.id ;
    
    // Get creator ID from the meme
    const creatorId = currentMeme?.creator?._id;
    
    // Compare as strings to handle different ID formats (ObjectId vs string)
    return String(userId) === String(creatorId);
  };
  
  // Debug user and meme creator data
  useEffect(() => {
    if (user && currentMeme?.creator) {
      console.log('User data:', user);
      console.log('User ID:', user.id || user._id);
      console.log('Meme creator data:', currentMeme.creator);
      console.log('Meme creator ID:', currentMeme.creator._id);
      console.log('Is creator?', isCreator());
    }
  }, [user, currentMeme]);
  
  // Initialize edited meme data when current meme is loaded
  useEffect(() => {
    if (currentMeme) {
      setEditedMeme({
        topText: currentMeme.topText || '',
        bottomText: currentMeme.bottomText || '',
        textColor: currentMeme.textColor || '#FFFFFF',
        fontSize: currentMeme.fontSize || 36,
        textPosition: currentMeme.textPosition || {
          top: { x: 50, y: 10 },
          bottom: { x: 50, y: 90 },
        },
        imageUrl: currentMeme.imageUrl || ''
      });
    }
  }, [currentMeme]);
  
  const handleVote = (voteType) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Determine the expected action based on current vote state
    let expectedAction = 'Vote recorded';
    if (currentMeme.userVote) {
      if (currentMeme.userVote === voteType) {
        expectedAction = 'Vote removed';
      } else {
        expectedAction = 'Vote updated';
      }
    }
    
    // Dispatch the vote action
    dispatch(voteMeme({ memeId: id, voteType }))
      .unwrap()
      .then((result) => {
        // Update the UI immediately with the vote result
        dispatch(updateVoteCount({
          memeId: id,
          voteType,
          action: result.message || expectedAction
        }));
      })
      .catch((error) => {
        console.error('Error voting:', error);
      });
  };
  
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    if (commentText.length > 140) {
      alert('Comment must be 140 characters or less');
      return;
    }
    
    dispatch(addComment({ memeId: id, content: commentText }));
    setCommentText('');
  };
  
  const handleDeleteComment = (commentId) => {
    dispatch(deleteComment(commentId));
  };
  
  const handleDeleteMeme = () => {
    dispatch(deleteMeme(id));
    navigate('/');
  };
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditedMeme(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTextPositionChange = (position, axis, value) => {
    setEditedMeme(prev => ({
      ...prev,
      textPosition: {
        ...prev.textPosition,
        [position]: {
          ...prev.textPosition[position],
          [axis]: parseInt(value),
        },
      },
    }));
  };
  
  const generateMemePreview = () => {
    if (!canvasRef.current || !editedMeme || !currentMeme) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Configure text style
      ctx.fillStyle = editedMeme.textColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = `bold ${editedMeme.fontSize}px Impact`;
      ctx.textAlign = 'center';
      
      // Draw top text
      if (editedMeme.topText) {
        const topX = (canvas.width * editedMeme.textPosition.top.x) / 100;
        const topY = (canvas.height * editedMeme.textPosition.top.y) / 100;
        
        ctx.fillText(editedMeme.topText, topX, topY);
        ctx.strokeText(editedMeme.topText, topX, topY);
      }
      
      // Draw bottom text
      if (editedMeme.bottomText) {
        const bottomX = (canvas.width * editedMeme.textPosition.bottom.x) / 100;
        const bottomY = (canvas.height * editedMeme.textPosition.bottom.y) / 100;
        
        ctx.fillText(editedMeme.bottomText, bottomX, bottomY);
        ctx.strokeText(editedMeme.bottomText, bottomX, bottomY);
      }
      
      return canvas.toDataURL('image/jpeg');
    };
    
    img.src = currentMeme.imageUrl;
  };
  
  const handleSaveEdit = () => {
    const canvas = canvasRef.current;
    if (!canvas || !editedMeme) return;
    
    // Generate the image first
    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Configure text style
      ctx.fillStyle = editedMeme.textColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = `bold ${editedMeme.fontSize}px Impact`;
      ctx.textAlign = 'center';
      
      // Draw top text
      if (editedMeme.topText) {
        const topX = (canvas.width * editedMeme.textPosition.top.x) / 100;
        const topY = (canvas.height * editedMeme.textPosition.top.y) / 100;
        
        ctx.fillText(editedMeme.topText, topX, topY);
        ctx.strokeText(editedMeme.topText, topX, topY);
      }
      
      // Draw bottom text
      if (editedMeme.bottomText) {
        const bottomX = (canvas.width * editedMeme.textPosition.bottom.x) / 100;
        const bottomY = (canvas.height * editedMeme.textPosition.bottom.y) / 100;
        
        ctx.fillText(editedMeme.bottomText, bottomX, bottomY);
        ctx.strokeText(editedMeme.bottomText, bottomX, bottomY);
      }
      
      // Get the data URL from canvas
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Prepare the updated meme data
      const updatedMemeData = {
        ...editedMeme,
        image: dataUrl
      };
      
      // Dispatch the update action
      dispatch(updateMeme({ id, memeData: updatedMemeData }));
      setIsEditing(false);
    };
    
    img.src = currentMeme.imageUrl;
  };
  
  if (memeLoading || !currentMeme) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Meme Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        <div className="relative">
          <img 
            src={currentMeme.imageUrl} 
            alt="Meme" 
            className="w-full object-contain max-h-[600px]"
          />
          
          {/* Text overlay */}
          {!isEditing && currentMeme.topText && (
            <div 
              className="absolute text-center w-full px-4 font-bold text-stroke"
              style={{ 
                top: `${currentMeme.textPosition?.top.y || 10}%`,
                left: `${currentMeme.textPosition?.top.x || 50}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${currentMeme.fontSize || 36}px`,
                color: currentMeme.textColor || '#FFFFFF',
              }}
            >
              {currentMeme.topText}
            </div>
          )}
          
          {!isEditing && currentMeme.bottomText && (
            <div 
              className="absolute text-center w-full px-4 font-bold text-stroke"
              style={{ 
                top: `${currentMeme.textPosition?.bottom.y || 90}%`,
                left: `${currentMeme.textPosition?.bottom.x || 50}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${currentMeme.fontSize || 36}px`,
                color: currentMeme.textColor || '#FFFFFF',
              }}
            >
              {currentMeme.bottomText}
            </div>
          )}
        </div>

        
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                {currentMeme.creator?.profilePicture ? (
                  <img 
                    src={currentMeme.creator.profilePicture} 
                    alt={currentMeme.creator.username} 
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <span className="text-gray-600 dark:text-gray-300 font-bold">
                    {currentMeme.creator?.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{currentMeme.creator?.username || 'Anonymous'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDistanceToNow(new Date(currentMeme.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span>{currentMeme.views || 0} views</span>
            </div>
            
            {/* Only show edit/delete buttons if the user is the creator of this meme */}
            {user?.user?.id === currentMeme?.creator?._id && (
              <div className="flex space-x-2">
                <Link
                  to={`/edit-meme/${id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleVote('upvote')}
                className={`flex items-center p-1 rounded-md ${currentMeme.userVote === 'upvote' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              
              <span className="text-lg font-semibold">{currentMeme.voteCount}</span>
              
              <button
                onClick={() => handleVote('downvote')}
                className={`flex items-center p-1 rounded-md ${currentMeme.userVote === 'downvote' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Show edit/delete buttons for all logged-in users for testing */}
            {/* {user && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => navigate(`/edit-meme/${currentMeme._id}`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Edit Caption
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            )} */}
            
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-lg font-medium">{currentMeme.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-6">Comments</h3>
          
          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.username} 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300 font-bold">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                
                <div className="flex-grow">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Add a comment..."
                    rows="3"
                    maxLength="140"
                  ></textarea>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm ${
                      commentText.length > 140 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {commentText.length}/140
                    </span>
                    
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                      disabled={!commentText.trim() || commentText.length > 140}
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 mb-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                You need to be logged in to comment
              </p>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-block"
              >
                Login
              </Link>
            </div>
          )}
          
          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment._id} className="flex space-x-4">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {comment.user?.profilePicture ? (
                      <img 
                        src={comment.user.profilePicture} 
                        alt={comment.user.username} 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300 font-bold">
                        {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{comment.user?.username || 'Anonymous'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        
                        {user && comment.user && user.id === comment.user._id && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      <p className="mt-2">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Delete Meme</h3>
            <p className="mb-6">Are you sure you want to delete this meme? This action cannot be undone.</p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMeme}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemeDetails;
