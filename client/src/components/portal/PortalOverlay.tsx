import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

/** Workspace drawers use the same focus trapping, Escape and focus restoration as forms. */
export function PortalOverlay({ open, onOpenChange, title, className, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bfo-portal-overlay" />
        <Dialog.Content className={`bfo-modal-content ${className}`} aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
