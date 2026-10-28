"use client";

import type { ReactNode } from "react";

export const VITRINA_BOOK_EVENT = "vitrina:book";

export interface BookingEventDetail {
  serviceId?: string;
  staffId?: string;
}

/**
 * Abre el sheet de reserva desde cualquier parte de la página (server
 * components incluidos) sin convertir toda la Vitrina en client component.
 */
export function BookingTrigger({
  children,
  className,
  serviceId,
  staffId,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  serviceId?: string;
  staffId?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent<BookingEventDetail>(VITRINA_BOOK_EVENT, {
            detail: { serviceId, staffId },
          })
        );
      }}
    >
      {children}
    </button>
  );
}
