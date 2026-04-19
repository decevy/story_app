// src/components/TurnList.tsx

import { format } from 'date-fns';
import { useEffect, useRef } from 'react';
import { Turn } from '../types/story.types';
import { useAuth } from '../contexts/AuthContext';
import { useStory } from '../contexts/StoryContext';

export function TurnList() {
  const { turns } = useStory();
  const { user } = useAuth();
  const turnListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turnListRef.current) {
      turnListRef.current.scrollTo({
        top: turnListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [turns]);

  const checkIfOwnTurn = (turn: Turn, currentUserId?: number): boolean => {
    return turn.user.id === currentUserId;
  };

  const shouldDisplayTimestamp = (turnIndex: number, turnItems: Turn[], currentTurn: Turn): boolean => {
    if (turnIndex === 0) return true;

    const previousTurn = turnItems[turnIndex - 1];
    const currentTime = new Date(currentTurn.createdAt);
    const previousTime = new Date(previousTurn.createdAt);

    const timeDifferenceMinutes = (currentTime.getTime() - previousTime.getTime()) / (1000 * 60);

    return timeDifferenceMinutes > 5;
  };

  if (turns.length === 0) {
    return (
      <div className="mx-6 py-3 flex flex-1 flex-col items-center justify-center gap-1 overflow-y-auto no-scrollbar">
        <p className="text-center text-lg font-semibold text-gray-800">No turns yet</p>
        <p className="text-center text-sm text-gray-500">Send the first turn to start the conversation!</p>
      </div>
    );
  }

  return (
    <div ref={turnListRef} className="mx-6 py-3 flex flex-col flex-1 gap-1.5 overflow-y-auto no-scrollbar">
      {turns.map((turn, index) => {
        const isOwnTurn = checkIfOwnTurn(turn, user?.id);
        const shouldShowTimestamp = shouldDisplayTimestamp(index, turns, turn);

        return (
          <div key={turn.id} className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwnTurn ? 'self-end' : 'self-start'}`}>
            {shouldShowTimestamp && (
              <p className={`px-1.5 text-xs text-gray-500 ${isOwnTurn ? 'text-right' : 'text-left'}`}>
                {isOwnTurn ? '' : `${turn.user.username} `} {format(new Date(turn.createdAt), 'HH:mm')}
              </p>
            )}
            <p className={`py-1 px-4 whitespace-pre-wrap break-words arounded-lg corner-squircle shadow ${isOwnTurn ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>{turn.content}</p>
          </div>
        );
      })}
    </div>
  );
}
