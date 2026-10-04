// src/components/PulseList.tsx

import { usePulse } from '../contexts/PulseContext';
import { PulseSummary, beatText } from '../types/pulse.types';
import { formatDistanceToNow } from 'date-fns';

export function PulseList() {
  const { pulses, currentPulse, selectPulse } = usePulse();

  const handlePulseClick = (pulseId: number) => {
    void selectPulse(pulseId);
  };

  const getLastBeatPreview = (pulse: PulseSummary): string => {
    if (!pulse.lastBeat) {
      return 'No beats yet';
    }
    const preview = beatText(pulse.lastBeat);
    return preview.length > 50 ? `${preview.slice(0, 50)}...` : preview;
  };

  if (pulses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-gray-500 mb-2">No pulses yet</p>
        <p className="text-sm text-gray-400">Create or join a pulse to add beats</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Pulses</h2>
        <p className="text-sm text-gray-500">{pulses.length} available</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pulses.map((pulse) => (
          <div
            key={pulse.id}
            onClick={() => handlePulseClick(pulse.id)}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
              currentPulse?.id === pulse.id
                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-800">{pulse.name}</h3>
              {pulse.lastBeat && (
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(pulse.lastBeat.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-1">
              {pulse.pacerCount} pacer{pulse.pacerCount !== 1 ? 's' : ''}
            </p>

            <p className="text-sm text-gray-600 truncate">
              {getLastBeatPreview(pulse)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
