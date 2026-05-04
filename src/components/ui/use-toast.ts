"use client";

// Simplified version of shadcn/ui's useToast (kept compact for our MVP).
import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type State = { toasts: ToasterToast[] };

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action:
  | { type: "ADD"; toast: ToasterToast }
  | { type: "REMOVE"; id?: string }
) {
  switch (action.type) {
    case "ADD":
      memoryState = {
        toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
      };
      break;
    case "REMOVE":
      memoryState = {
        toasts: action.id
          ? memoryState.toasts.filter((t) => t.id !== action.id)
          : [],
      };
      break;
  }
  listeners.forEach((listener) => listener(memoryState));
}

function toast(props: Omit<ToasterToast, "id">) {
  const id = genId();
  const newToast: ToasterToast = { ...props, id, open: true };
  dispatch({ type: "ADD", toast: newToast });
  setTimeout(() => dispatch({ type: "REMOVE", id }), TOAST_REMOVE_DELAY);
  return { id };
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
  return {
    ...state,
    toast,
    dismiss: (id?: string) => dispatch({ type: "REMOVE", id }),
  };
}

export { useToast, toast };
