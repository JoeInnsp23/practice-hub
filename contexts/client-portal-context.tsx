"use client";

import Cookies from "js-cookie";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface ClientAccess {
  clientId: string;
  clientName: string;
  role: string;
  isActive: boolean;
}

interface ClientPortalContextType {
  currentClientId: string | null;
  clientAccess: ClientAccess[];
  setCurrentClientId: (clientId: string) => void;
  setClientAccess: (access: ClientAccess[]) => void;
}

const ClientPortalContext = createContext<ClientPortalContextType | undefined>(
  undefined,
);

const CURRENT_CLIENT_COOKIE = "client_portal_current_client";

export function ClientPortalProvider({ children }: { children: ReactNode }) {
  const [currentClientId, setCurrentClientIdState] = useState<string | null>(
    null,
  );
  const [clientAccess, setClientAccess] = useState<ClientAccess[]>([]);

  const setCurrentClientId = (clientId: string) => {
    setCurrentClientIdState(clientId);
    Cookies.set(CURRENT_CLIENT_COOKIE, clientId, { expires: 365 }); // 1 year
  };

  // Load current client from cookie on mount
  useEffect(() => {
    const savedClientId = Cookies.get(CURRENT_CLIENT_COOKIE);
    if (savedClientId) {
      setCurrentClientIdState(savedClientId);
    }
  }, []);

  // Auto-select first client if none selected and we have access
  // biome-ignore lint/correctness/useExhaustiveDependencies: setCurrentClientId is stable and defined in parent scope
  useEffect(() => {
    if (!currentClientId && clientAccess.length > 0) {
      setCurrentClientId(clientAccess[0].clientId);
    }
  }, [currentClientId, clientAccess]);

  return (
    <ClientPortalContext.Provider
      value={{
        currentClientId,
        clientAccess,
        setCurrentClientId,
        setClientAccess,
      }}
    >
      {children}
    </ClientPortalContext.Provider>
  );
}

export function useClientPortalContext() {
  const context = useContext(ClientPortalContext);
  if (context === undefined) {
    throw new Error(
      "useClientPortalContext must be used within ClientPortalProvider",
    );
  }
  return context;
}
