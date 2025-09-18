
import { useEffect, useRef } from 'react';

export const useModalBackButton = (isOpen: boolean, onClose: () => void) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      // Push a new state to the history when the modal opens.
      // This is the "phantom" entry that will catch the back button press.
      window.history.pushState({ modalOpen: true }, '');

      const handlePopState = (event: PopStateEvent) => {
        // Only trigger the close handler if the state is not our modal state.
        // This prevents closing when a popstate event fires on initial load.
        if (!event.state?.modalOpen) {
          onCloseRef.current();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen]);
};
