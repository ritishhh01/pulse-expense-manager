import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useUser } from "@clerk/react";

export interface ActiveUser {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string | null;
  avatarColor: string;
  upiId?: string | null;
}

interface ActiveUserState {
  user: ActiveUser | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const ActiveUserContext = createContext<ActiveUserState>({
  user: null,
  isLoading: true,
  error: null,
  refetch: () => {},
});

export function ActiveUserProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const [dbUser, setDbUser] = useState<ActiveUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!isSignedIn || !clerkUser) {
      setDbUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch("/api/auth/me", { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
        return res.json() as Promise<ActiveUser>;
      })
      .then((user) => {
        setDbUser(user);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [clerkLoaded, isSignedIn, clerkUser?.id, version]);

  return (
    <ActiveUserContext.Provider value={{ user: dbUser, isLoading, error, refetch }}>
      {children}
    </ActiveUserContext.Provider>
  );
}

export function useActiveUser(): ActiveUser {
  const { user } = useContext(ActiveUserContext);
  if (!user) {
    return {
      id: 0,
      name: "Loading...",
      email: "",
      avatarColor: "#39FF14",
    };
  }
  return user;
}

export function useActiveUserState() {
  return useContext(ActiveUserContext);
}
