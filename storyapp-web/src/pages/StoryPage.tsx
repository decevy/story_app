// src/pages/StoryPage.tsx

import { StoryLayout } from '../components/StoryLayout';
import { StoryList } from '../components/StoryList';
import { StoryBookView } from '../components/StoryBookView';
import { useStory } from '../contexts/StoryContext';

export function StoryPage() {
  const { currentStory } = useStory();

  return (
    <StoryLayout
      sidebar={<StoryList />}
      mainContent={
        currentStory ? (
          <StoryBookView />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-xl mb-2">Select a story to get started</p>
              <p className="text-sm">Choose from the list on the left</p>
            </div>
          </div>
        )
      }
    />
  );
}
