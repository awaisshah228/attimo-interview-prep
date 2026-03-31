"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Photo } from "@/lib/types";

/*
 * Production: shadcn Dialog (base-ui)
 *
 * - Focus trapping, Escape key, overlay click — all built-in
 * - Portal rendering avoids z-index stacking issues
 * - Proper ARIA labels (DialogTitle, DialogDescription)
 * - Animated open/close transitions
 */
export function PhotoModalProduction({ photo }: { photo: Photo }) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={(open) => { if (!open) router.back(); }}>
      <DialogContent className="sm:max-w-md">
        <div
          className="aspect-square w-full rounded-lg"
          style={{ backgroundColor: photo.color }}
        />
        <DialogHeader>
          <DialogTitle>{photo.title}</DialogTitle>
          <DialogDescription>
            Intercepted modal using shadcn Dialog. Built-in focus trap, Escape
            dismiss, portal rendering, and ARIA labels.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
