// src/components/StoryList.tsx

import { useChat } from '../contexts/ChatContext';
import { StorySummary } from '../types/story.types';
import { formatDistanceToNow } from 'date-fns';

export function StoryList() {
  const { stories, currentStory, selectStory } = useChat();

  const handleStoryClick = (storyId: number) => {
    selectStory(storyId);
  };

  const getLastTurnPreview = (story: StorySummary): string => {
    if (!story.lastTurn) return 'No turns yet';
    const content = story.lastTurn.content;
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-gray-500 mb-2">No stories available</p>
        <p className="text-sm text-gray-400">Create or join a story to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Stories</h2>
        <p className="text-sm text-gray-500">{stories.length} available</p>
      </div>

      {/* Story list */}
      <div className="flex-1 overflow-y-auto">
        {stories.map(story => (
          <div
            key={story.id}
            onClick={() => handleStoryClick(story.id)}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
              currentStory?.id === story.id
                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-800">{story.name}</h3>
              {story.lastTurn && (
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(story.lastTurn.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-1">
              {story.memberCount} member{story.memberCount !== 1 ? 's' : ''}
            </p>

            <p className="text-sm text-gray-600 truncate">
              {getLastTurnPreview(story)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
