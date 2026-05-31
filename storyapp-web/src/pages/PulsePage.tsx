// src/pages/PulsePage.tsx

import { PulseLayout } from '../components/PulseLayout';
import { PulseList } from '../components/PulseList';
import { PulseView } from '../components/PulseView';
import { usePulse } from '../contexts/PulseContext';

export function PulsePage() {
  const { currentPulse } = usePulse();

  return (
    <PulseLayout
      sidebar={<PulseList />}
      mainContent={
        currentPulse ? (
          <PulseView />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-xl mb-2">Select a pulse to get started</p>
              <p className="text-sm">Choose from the list on the left</p>
            </div>
          </div>
        )
      }
    />
  );
}
