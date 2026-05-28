import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { colors } from "./theme";

export type ToastKind = "success" | "info" | "error";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, opts?: { kind?: ToastKind }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 1500;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback(
    (message: string, opts?: { kind?: ToastKind }) => {
      idRef.current += 1;
      setToast({ id: idRef.current, message, kind: opts?.kind ?? "success" });
      if (timerRef.current) clearTimeout(timerRef.current);
      const myId = idRef.current;
      timerRef.current = setTimeout(() => {
        setToast((current) => (current?.id === myId ? null : current));
      }, DEFAULT_DURATION_MS);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toast={toast} />
    </ToastContext.Provider>
  );
}

const KIND_COLOR: Record<ToastKind, string> = {
  success: colors.success,
  info: colors.title,
  error: colors.error,
};

const KIND_GLYPH: Record<ToastKind, string> = {
  success: "✓",
  info: "•",
  error: "✕",
};

function ToastHost({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  const accent = KIND_COLOR[toast.kind];
  return (
    <box
      position="absolute"
      top={1}
      right={2}
      borderStyle="rounded"
      borderColor={accent}
      backgroundColor={colors.surfaceAlt}
      paddingLeft={1}
      paddingRight={1}
      flexDirection="row"
      gap={1}
    >
      <text fg={accent}>{KIND_GLYPH[toast.kind]}</text>
      <text fg={colors.text}>{toast.message}</text>
    </box>
  );
}
