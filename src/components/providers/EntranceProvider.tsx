"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type EntranceContextValue = {
  ready: boolean;
  markReady: () => void;
};

const EntranceContext = createContext<EntranceContextValue>({
  ready: false,
  markReady: () => {},
});

export function EntranceProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const value = useMemo(() => ({ ready, markReady }), [ready, markReady]);

  return (
    <EntranceContext.Provider value={value}>
      {children}
    </EntranceContext.Provider>
  );
}

export function useEntrance() {
  return useContext(EntranceContext);
}
