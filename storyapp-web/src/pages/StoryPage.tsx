// src/pages/ChatPage.tsx

import { TurnInput } from '../components/TurnInput';
import { ChatLayout } from '../components/ChatLayout';
import { StoryList } from '../components/StoryList';
import { useChat } from '../contexts/ChatContext';
import { TurnList } from '../components/TurnList';

export function ChatPage() {
  const { currentStory } = useChat();

  return (
    <ChatLayout
      sidebar={<StoryList />}
      chatArea={
        currentStory ? (
          <div className="flex flex-col h-full">
            <TurnList />
            <TurnInput />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-xl mb-2">Select a story to start chatting</p>
              <p className="text-sm">Choose from the list on the left</p>
            </div>
          </div>
        )
      }
    />
  );
}