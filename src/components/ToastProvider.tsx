import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
  } from "react";
  import { AnimatePresence, motion } from "framer-motion";
  import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
  
  type ToastType = "success" | "error" | "info" | "warning";
  
  type Toast = {
    id: number;
    message: string;
    type: ToastType;
  };
  
  type ToastContextValue = {
    showToast: (message: string, type?: ToastType) => void;
  };
  
  const ToastContext = createContext<ToastContextValue | null>(null);
  
  export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
  
    function showToast(message: string, type: ToastType = "info") {
      const id = Date.now() + Math.random();
  
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type,
        },
      ]);
  
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 2800);
    }
  
    function removeToast(id: number) {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }
  
    function getToastStyle(type: ToastType) {
      if (type === "success") {
        return {
          container: "border-upgreen/20 bg-white/95 text-upgreen",
          icon: <CheckCircle className="h-5 w-5 text-upgreen" />,
        };
      }
  
      if (type === "error") {
        return {
          container: "border-upred/20 bg-white/95 text-upred",
          icon: <AlertCircle className="h-5 w-5 text-upred" />,
        };
      }
  
      if (type === "warning") {
        return {
          container: "border-upyellow/40 bg-white/95 text-black",
          icon: <AlertCircle className="h-5 w-5 text-upyellow" />,
        };
      }
  
      return {
        container: "border-black/10 bg-white/95 text-black",
        icon: <Info className="h-5 w-5 text-upgreen" />,
      };
    }
  
    const value = useMemo(() => {
      return {
        showToast,
      };
    }, []);
  
    return (
      <ToastContext.Provider value={value}>
        {children}
  
        <div className="pointer-events-none fixed right-6 top-6 z-[9999] flex w-full max-w-sm flex-col gap-3">
          <AnimatePresence>
            {toasts.map((toast) => {
              const style = getToastStyle(toast.type);
  
              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 40, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md ${style.container}`}
                >
                  <div className="mt-0.5 shrink-0">{style.icon}</div>
  
                  <p className="flex-1 text-sm font-medium leading-5">
                    {toast.message}
                  </p>
  
                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    className="shrink-0 rounded-full p-1 text-black/40 transition hover:bg-black/5 hover:text-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ToastContext.Provider>
    );
  }
  
  export function useToast() {
    const context = useContext(ToastContext);
  
    if (!context) {
      throw new Error("useToast must be used inside ToastProvider");
    }
  
    return context;
  }