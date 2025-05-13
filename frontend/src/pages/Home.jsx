import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getMemes, getTrendingMemes } from '../store/slices/memeSlice';
import { voteMeme } from '../store/slices/voteSlice';
import MemeCard from '../components/MemeCard';

function Home() {
  const dispatch = useDispatch();
  const { memes, trendingMemes, isLoading, pagination } = useSelector((state) => state.memes);
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('new');

  useEffect(() => {
    handleTabChange(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    let sortParam;
    switch (tab) {
      case 'top_day':
        sortParam = 'top_day';
        break;
      case 'top_week':
        sortParam = 'top_week';
        break;
      case 'top_all':
        sortParam = 'top_all';
        break;
      case 'new':
      default:
        sortParam = 'new';
        break;
    }
    
    dispatch(getMemes({ sort: sortParam }));
  };

  const handleVote = (memeId, voteType) => {
    if (!user) {
      // Redirect to login or show login prompt
      return;
    }
    
    dispatch(voteMeme({ memeId, voteType }));
  };

  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      dispatch(getMemes({ 
        sort: activeTab, 
        page: pagination.currentPage + 1,
        limit: 10
      }));
    }
  };

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Community Meme Generator & Voting</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">Create, share, and vote on the best developer memes!</p>
      </div>

      {/* Trending Section */}
      {(trendingMemes.day || trendingMemes.week) && (
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-4">Trending Memes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trendingMemes.day && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-1 rounded-lg">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-2">Meme of the Day 🏆</h4>
                  <MemeCard meme={trendingMemes.day} onVote={handleVote} />
                </div>
              </div>
            )}
            
            {trendingMemes.week && (
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-1 rounded-lg">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-2">Weekly Champion 🥇</h4>
                  <MemeCard meme={trendingMemes.week} onVote={handleVote} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'new'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('new')}
            >
              New
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'top_day'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('top_day')}
            >
              Top (24h)
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'top_week'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('top_week')}
            >
              Top (Week)
            </button>
          </li>
          <li>
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'top_all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange('top_all')}
            >
              Top (All Time)
            </button>
          </li>
        </ul>
      </div>

      {/* Meme Grid */}
      {isLoading && memes.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : memes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memes.map((meme) => (
            <MemeCard key={meme._id} meme={meme} onVote={handleVote} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No memes found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to create a meme!</p>
          {user ? (
            <Link
              to="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors"
            >
              Create Meme
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors"
            >
              Login to Create
            </Link>
          )}
        </div>
      )}

      {/* Load More Button */}
      {memes.length > 0 && pagination.currentPage < pagination.totalPages && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-6 py-3 rounded-md transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                Loading...
              </div>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
