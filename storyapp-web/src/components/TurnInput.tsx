// src/components/TurnInput.tsx

import { KeyboardEvent, MouseEvent, useCallback, useState } from 'react';
import { useStory } from '../contexts/StoryContext';

export function TurnInput() {
  const { isConnected, sendTurn } = useStory();

  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendCurrentTurn = useCallback(async () => {
    if (!text.trim() || !isConnected) {
      return;
    }

    setIsSending(true);
    try {
      await sendTurn(text);
      setText('');
    } catch (error) {
      console.error('Failed to send turn:', error);
    } finally {
      setIsSending(false);
    }
  }, [text, sendTurn, isConnected]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    sendCurrentTurn();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCurrentTurn();
    }
  };

  const getTextLineCount = () => {
    return text.split('\n').length;
  };

  return (
    <div className="m-3 mt-0 border bg-white border-gray-300 arounded-xl corner-squircle flex items-end focus-within:ring-3 focus-within:ring-blue-100 focus-within:border-blue-300">
      <textarea
        placeholder={isConnected ? 'Type a message...' : 'Disconnected...'}
        disabled={!isConnected || isSending}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={getTextLineCount()}
        className="flex-1 p-2.5 border-0 focus:outline-none resize-none no-scrollbar disabled:cursor-not-allowed"
      />
      <button
        disabled={!text.trim() || !isConnected || isSending}
        onClick={handleClick}
        className="bg-blue-500 disabled:bg-gray-400 text-white px-4 py-2 text-sm arounded-lg corner-squircle hover:bg-blue-600 m-1"
      >
        Send
      </button>
    </div>
  );
}
