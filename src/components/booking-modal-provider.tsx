import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { SkyViewBookingModal } from './skyview-booking-modal';

// Single source of truth for the booking modal's open state, so any button
// on the page (nav, hero, CTA band) can trigger the same modal instance
// instead of each subtree maintaining its own copy.

interface BookingModalContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const BookingModalContext = createContext<BookingModalContextValue | null>(null);

export function BookingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ open, close, isOpen }),
    [open, close, isOpen],
  );

  return (
    <BookingModalContext.Provider value={value}>
      {children}
      <SkyViewBookingModal open={isOpen} onClose={close} />
    </BookingModalContext.Provider>
  );
}

export function useBookingModal(): BookingModalContextValue {
  const ctx = useContext(BookingModalContext);
  if (!ctx) {
    throw new Error('useBookingModal must be used inside <BookingModalProvider>');
  }
  return ctx;
}
