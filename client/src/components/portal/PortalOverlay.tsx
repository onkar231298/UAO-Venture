import * as Dialog from "@radix-ui/react-dialog";
import { useRef, type ReactNode } from "react";

/** Workspace drawers use the same focus trapping, Escape and focus restoration as forms. */
export function PortalOverlay({ open, onOpenChange, title, className, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  className: string;
  children: ReactNode;
}) {
  const returnFocusRef = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bfo-portal-overlay" />
        <Dialog.Content
          className={`bfo-modal-content ${className}`}
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = returnFocusRef.current;
            if (target?.isConnected) window.requestAnimationFrame(() => target.focus());
          }}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
