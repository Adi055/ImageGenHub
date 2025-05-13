import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getMeme, updateMeme, reset } from '../store/slices/memeSlice';

function EditMeme() {
  const { id } = useParams();
  const [memeData, setMemeData] = useState({
    imageUrl: '',
    topText: '',
    bottomText: '',
    textColor: '#FFFFFF',
    fontSize: 36,
    textPosition: {
      top: { x: 50, y: 10 },
      bottom: { x: 50, y: 90 },
    },
  });
  const [previewImage, setPreviewImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const canvasRef = useRef(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentMeme, isLoading: isSubmitting, isSuccess } = useSelector((state) => state.memes);
  const { user } = useSelector((state) => state.auth);
  
  // Load the meme data
  useEffect(() => {
    dispatch(getMeme(id));
  }, [id, dispatch]);
  
  // Set the meme data when it's loaded
  useEffect(() => {
    if (currentMeme) {
      // Ensure we have the full URL with the deployed backend
      let imageUrl = currentMeme.imageUrl || '';
      
      // If the URL is relative, make it absolute
      if (imageUrl && imageUrl.startsWith('/uploads/')) {
        imageUrl = `https://igh-backend.onrender.com${imageUrl}`;
      }
      
      console.log('Image URL in EditMeme:', imageUrl);
      
      setMemeData({
        imageUrl: imageUrl,
        topText: currentMeme.topText || '',
        bottomText: currentMeme.bottomText || '',
        textColor: currentMeme.textColor || '#FFFFFF',
        fontSize: currentMeme.fontSize || 36,
        textPosition: currentMeme.textPosition || {
          top: { x: 50, y: 10 },
          bottom: { x: 50, y: 90 },
        },
      });
      setPreviewImage(imageUrl);
    }
  }, [currentMeme]);
  
  // Check if user is the creator of the meme - temporarily disabled for testing
  useEffect(() => {
    // Check all possible ID formats
    const isCreator = (
      user.id === currentMeme.creator._id || 
      user._id === currentMeme.creator._id ||
      user.id === currentMeme.creator.id ||
      user._id === currentMeme.creator.id ||
      String(user.id) === String(currentMeme.creator._id) ||
      String(user._id) === String(currentMeme.creator._id)
    );
    
    if (currentMeme && user && currentMeme.creator && !isCreator) {
      navigate('/dashboard');
    }
  }, [currentMeme, user, navigate]);
  
  // Redirect after successful update - disabled to allow editing
  // useEffect(() => {
  //   if (isSuccess) {
  //     dispatch(reset());
  //     navigate(`/meme/${id}`);
  //   }
  // }, [isSuccess, navigate, dispatch, id]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMemeData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleTextPositionChange = (position, axis, value) => {
    setMemeData((prev) => ({
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
      ctx.fillStyle = memeData.textColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = `bold ${memeData.fontSize}px Impact`;
      ctx.textAlign = 'center';
      
      // Draw top text
      if (memeData.topText) {
        const topX = (canvas.width * memeData.textPosition.top.x) / 100;
        const topY = (canvas.height * memeData.textPosition.top.y) / 100;
        
        ctx.fillText(memeData.topText, topX, topY);
        ctx.strokeText(memeData.topText, topX, topY);
      }
      
      // Draw bottom text
      if (memeData.bottomText) {
        const bottomX = (canvas.width * memeData.textPosition.bottom.x) / 100;
        const bottomY = (canvas.height * memeData.textPosition.bottom.y) / 100;
        
        ctx.fillText(memeData.bottomText, bottomX, bottomY);
        ctx.strokeText(memeData.bottomText, bottomX, bottomY);
      }
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreviewImage(dataUrl);
      setMemeData((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    
    img.src = memeData.imageUrl;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!memeData.imageUrl) {
      setError('Please upload an image or select a template');
      return;
    }
    
    if (!memeData.topText && !memeData.bottomText) {
      setError('Please add some text to your meme');
      return;
    }
    
    // Get the base API URL for the deployed backend
    const API_BASE_URL = 'https://igh-backend.onrender.com';
    
    // Process the image URL to ensure it's properly formatted
    let imageUrl = memeData.imageUrl;
    
    // If it's a relative URL, make it absolute
    if (imageUrl.startsWith('/uploads/')) {
      imageUrl = `${API_BASE_URL}${imageUrl}`;
    } 
    // If it's already an absolute URL but with localhost, replace with deployed URL
    else if (imageUrl.includes('localhost')) {
      const relativePath = imageUrl.split('localhost:8080')[1];
      if (relativePath) {
        imageUrl = `${API_BASE_URL}${relativePath}`;
      }
    }
    
    console.log('Processed image URL:', imageUrl);
    
    // Create meme data with all necessary fields
    const memeFormData = {
      topText: memeData.topText,
      bottomText: memeData.bottomText,
      textColor: memeData.textColor,
      fontSize: memeData.fontSize,
      textPosition: memeData.textPosition,
      imageUrl: imageUrl,
      // Preserve the original image data if available
      image: currentMeme.image || null
    };
    
    console.log('Updating meme with data:', memeFormData);
    
    // Dispatch the update action
    dispatch(updateMeme({ id, memeData: memeFormData }));
    
    // Show success message
    setError('');
    alert('Meme updated successfully!');
    
    // Navigate back to meme details after saving
    setTimeout(() => {
      navigate(`/meme/${id}`);
    }, 1000);
  };
  
  if (isLoading || !currentMeme) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Edit Meme</h2>
        <p className="text-gray-600 dark:text-gray-400">Update your meme's text and styling</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Preview</h3>
          
          <div className="relative mb-4 flex justify-center">
            {previewImage ? (
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Meme preview" 
                  className="max-w-full max-h-[400px] object-contain rounded-md" 
                />
                
                {/* Text overlay for preview */}
                {memeData.topText && (
                  <div 
                    className="absolute text-center w-full px-4 font-bold text-stroke"
                    style={{ 
                      top: `${memeData.textPosition?.top.y || 10}%`,
                      left: `${memeData.textPosition?.top.x || 50}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${memeData.fontSize || 36}px`,
                      color: memeData.textColor || '#FFFFFF',
                    }}
                  >
                    {memeData.topText}
                  </div>
                )}
                
                {memeData.bottomText && (
                  <div 
                    className="absolute text-center w-full px-4 font-bold text-stroke"
                    style={{ 
                      top: `${memeData.textPosition?.bottom.y || 90}%`,
                      left: `${memeData.textPosition?.bottom.x || 50}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${memeData.fontSize || 36}px`,
                      color: memeData.textColor || '#FFFFFF',
                    }}
                  >
                    {memeData.bottomText}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Preview will appear here</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <button
              type="button"
              onClick={generateMemePreview}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Update Preview
            </button>
          </div>
          
          {/* Hidden canvas for image generation */}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        
        {/* Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Edit Meme</h3>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Text Inputs */}
            <div className="mb-4">
              <label htmlFor="topText" className="block text-gray-700 dark:text-gray-300 mb-2">
                Top Text
              </label>
              <input
                type="text"
                id="topText"
                name="topText"
                value={memeData.topText}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter top text"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="bottomText" className="block text-gray-700 dark:text-gray-300 mb-2">
                Bottom Text
              </label>
              <input
                type="text"
                id="bottomText"
                name="bottomText"
                value={memeData.bottomText}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter bottom text"
              />
            </div>
            
            {/* Style Customization */}
            <div className="mb-4">
              <label htmlFor="textColor" className="block text-gray-700 dark:text-gray-300 mb-2">
                Text Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="textColor"
                  name="textColor"
                  value={memeData.textColor}
                  onChange={handleInputChange}
                  className="h-10 w-10 rounded-md cursor-pointer"
                />
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {memeData.textColor}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="fontSize" className="block text-gray-700 dark:text-gray-300 mb-2">
                Font Size: {memeData.fontSize}px
              </label>
              <input
                type="range"
                id="fontSize"
                name="fontSize"
                min="20"
                max="80"
                value={memeData.fontSize}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            
            {/* Text Position Controls */}
            <div className="mb-4">
              <h4 className="text-lg font-medium mb-2">Text Position</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">
                    Top Text X: {memeData.textPosition.top.x}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={memeData.textPosition.top.x}
                    onChange={(e) => handleTextPositionChange('top', 'x', e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">
                    Top Text Y: {memeData.textPosition.top.y}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={memeData.textPosition.top.y}
                    onChange={(e) => handleTextPositionChange('top', 'y', e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">
                    Bottom Text X: {memeData.textPosition.bottom.x}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={memeData.textPosition.bottom.x}
                    onChange={(e) => handleTextPositionChange('bottom', 'x', e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">
                    Bottom Text Y: {memeData.textPosition.bottom.y}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={memeData.textPosition.bottom.y}
                    onChange={(e) => handleTextPositionChange('bottom', 'y', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => navigate(`/meme/${id}`)}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditMeme;
