"use client";

// Minimal toast store adapted from the shadcn/ui pattern.
import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type State = { toasts: ToasterToast[] };
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function dispatch(next: State) {
  memoryState = next;
  listeners.forEach((l) => l(memoryState));
}

function scheduleRemove(id: string) {
  if (timeouts.has(id)) return;
  const t = setTimeout(() => {
    timeouts.delete(id);
    dispatch({ toasts: memoryState.toasts.filter((x) => x.id !== id) });
  }, TOAST_REMOVE_DELAY);
  timeouts.set(id, t);
}

type ToastOptions = Omit<ToasterToast, "id">;

function toast(opts: ToastOptions) {
  const id = genId();
  const dismiss = () =>
    dispatch({ toasts: memoryState.toasts.filter((x) => x.id !== id) });

  const toastItem: ToasterToast = {
    ...opts,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss();
    },
  };

  dispatch({ toasts: [toastItem, ...memoryState.toasts].slice(0, TOAST_LIMIT) });
  scheduleRemove(id);
  return { id, dismiss };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);
  return { ...state, toast };
}

export { useToast, toast };
