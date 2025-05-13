import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

function MemeCard({ meme, onVote }) {
  const { user } = useSelector((state) => state.auth);
  
  // Format date
  const formattedDate = formatDistanceToNow(new Date(meme.createdAt), { addSuffix: true });
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
      <Link to={`/meme/${meme._id}`}>
        <div className="relative h-64 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <img 
            src={meme.imageUrl} 
            alt="Meme" 
            className="w-full h-full object-cover"
          />
          {/* Text overlay */}
          {meme.topText && (
            <div 
              className="absolute text-center w-full px-4 font-bold text-stroke"
              style={{ 
                top: `${meme.textPosition?.top.y || 10}%`,
                left: `${meme.textPosition?.top.x || 50}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${meme.fontSize || 36}px`,
                color: meme.textColor || '#FFFFFF',
              }}
            >
              {meme.topText}
            </div>
          )}
          {meme.bottomText && (
            <div 
              className="absolute text-center w-full px-4 font-bold text-stroke"
              style={{ 
                top: `${meme.textPosition?.bottom.y || 90}%`,
                left: `${meme.textPosition?.bottom.x || 50}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${meme.fontSize || 36}px`,
                color: meme.textColor || '#FFFFFF',
              }}
            >
              {meme.bottomText}
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Posted by: {meme.creator?.username || 'Anonymous'}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formattedDate}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => onVote(meme._id, 'upvote')}
            className={`flex items-center space-x-1 ${
              meme.userVote === 'upvote' ? 'text-green-600' : 'text-gray-600 dark:text-gray-400 hover:text-green-600'
            }`}
            disabled={!user}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span>{meme.upvotes || 0}</span>
          </button>
          
          <button 
            onClick={() => onVote(meme._id, 'downvote')}
            className={`flex items-center space-x-1 ${
              meme.userVote === 'downvote' ? 'text-red-600' : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
            }`}
            disabled={!user}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
            <span>{meme.downvotes || 0}</span>
          </button>
          
          <div className="flex items-center space-x-4 ml-auto">
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span>{meme.views || 0}</span>
            </div>
            
            <Link 
              to={`/meme/${meme._id}`}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
              </svg>
              <span>{meme.commentCount || 0}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemeCard;
