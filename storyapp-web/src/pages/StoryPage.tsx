// src/pages/StoryPage.tsx

import { TurnInput } from '../components/TurnInput';
import { StoryLayout } from '../components/StoryLayout';
import { StoryList } from '../components/StoryList';
import { useStory } from '../contexts/StoryContext';
import { TurnList } from '../components/TurnList';

export function StoryPage() {
  const { currentStory } = useStory();

  return (
    <StoryLayout
      sidebar={<StoryList />}
      mainContent={
        currentStory ? (
          <div className="flex flex-col h-full">
            <TurnList />
            <TurnInput />
          </div>
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
