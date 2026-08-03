import { useState, useEffect } from "react";

export function useAutoClearError(delayMs: number = 3000) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [error, delayMs]);

  return { error, setError };
}
