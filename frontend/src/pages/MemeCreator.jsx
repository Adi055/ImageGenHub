import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createMeme, reset } from '../store/slices/memeSlice';
import { uploadMemeImage } from '../utils/api';

function MemeCreator() {
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
  const [uploadType, setUploadType] = useState('upload'); // 'upload' or 'template'
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading: isSubmitting, isSuccess } = useSelector((state) => state.memes);
  
  // Sample template images - in a real app, these would come from an API
  useEffect(() => {
    setTemplates([
      { id: 1, url: 'https://i.imgflip.com/1bij.jpg', name: 'One Does Not Simply' },
      { id: 2, url: 'https://i.imgflip.com/1g8my4.jpg', name: 'Batman Slapping Robin' },
      { id: 3, url: 'https://i.imgflip.com/1h7in3.jpg', name: 'Two Buttons' },
      { id: 4, url: 'https://i.imgflip.com/1bhw.jpg', name: 'Distracted Boyfriend' },
      { id: 5, url: 'https://i.imgflip.com/9ehk.jpg', name: 'Futurama Fry' },
      { id: 6, url: 'https://i.imgflip.com/1e7ql7.jpg', name: 'Evil Kermit' },
    ]);
  }, []);
  
  // useEffect(() => {
  //   if (isSuccess) {
  //     dispatch(reset());
  //     navigate('/');
  //   }
  // }, [isSuccess, navigate, dispatch]);
  
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
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    setError('');
    
    try {
      // First, show a preview of the image locally
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Check if user is logged in
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        setError('You must be logged in to upload images');
        setIsLoading(false);
        navigate('/login');
        return;
      }
      
      // Then upload the image to the server
      const uploadResult = await uploadMemeImage(file);
      
      // Ensure we have the full URL with the deployed backend
      let imageUrl = uploadResult.imageUrl;
      
      // If the URL is relative, make it absolute
      if (imageUrl && imageUrl.startsWith('/uploads/')) {
        imageUrl = `https://igh-backend.onrender.com${imageUrl}`;
      }
      
      console.log('Image URL after processing:', imageUrl);
      
      // Update the meme data with the server URL
      setMemeData((prev) => ({ 
        ...prev, 
        imageUrl: imageUrl 
      }));
      
      // Also update the preview image
      setPreviewImage(imageUrl);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Upload error:', error);
      
      // Detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          setError('Authentication error: Please log in again');
          // The interceptor will handle the redirect to login
        } else {
          setError(`Error uploading image: ${error.response.data?.message || error.response.statusText || 'Server error'}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError('Network error: No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error uploading image: ${error.message}`);
      }
      
      setIsLoading(false);
    }
  };
  
  const handleTemplateSelect = (templateUrl) => {
    setPreviewImage(templateUrl);
    setMemeData((prev) => ({ ...prev, imageUrl: templateUrl }));
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
      
      // Convert canvas to data URL for preview
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
    
    // Generate final meme image from canvas
    generateMemePreview();
    
    const memeFormData = {
      ...memeData,
      image: canvasRef.current.toDataURL('image/jpeg'),
    };
    
    dispatch(createMeme(memeFormData));
    
    // Navigate back to home page after successful submission
    setTimeout(() => {
      dispatch(reset());
      navigate('/');
    }, 1000);
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Create Your Meme</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Preview</h3>
          
          <div className="flex justify-center mb-4">
            {previewImage ? (
              <div className="relative max-w-full max-h-96 overflow-hidden">
                <img 
                  src={previewImage} 
                  alt="Meme Preview" 
                  className="max-w-full max-h-96 object-contain"
                />
              </div>
            ) : (
              <div className="h-64 w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Upload an image or select a template to preview your meme
                </p>
              </div>
            )}
          </div>
          
          {/* Hidden canvas for generating meme */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div className="flex justify-center mt-4">
            <button
              onClick={generateMemePreview}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors mr-4"
              disabled={!memeData.imageUrl}
            >
              Update Preview
            </button>
            
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              disabled={isSubmitting || !memeData.imageUrl}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Meme'}
            </button>
          </div>
        </div>
        
        {/* Editor Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Customize Your Meme</h3>
          
          {/* Image Source Selection */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
              <button
                className={`py-2 px-4 ${
                  uploadType === 'upload'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => setUploadType('upload')}
              >
                Upload Image
              </button>
              <button
                className={`py-2 px-4 ${
                  uploadType === 'template'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                onClick={() => setUploadType('template')}
              >
                Choose Template
              </button>
            </div>
            
            {uploadType === 'upload' ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-md transition-colors"
                >
                  Select Image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`cursor-pointer rounded-md overflow-hidden border-2 ${
                      memeData.imageUrl === template.url
                        ? 'border-blue-600'
                        : 'border-transparent'
                    }`}
                    onClick={() => handleTemplateSelect(template.url)}
                  >
                    <img
                      src={template.url}
                      alt={template.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="p-1 text-xs text-center truncate">
                      {template.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Text Customization */}
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
        </div>
      </div>
    </div>
  );
}

export default MemeCreator;
