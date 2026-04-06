import { createContext, useContext, ReactNode } from "react";

// For this prototype, we simulate an active user with userId=1
interface ActiveUser {
  id: number;
  name: string;
  email: string;
  avatarColor: string;
}

const defaultUser: ActiveUser = {
  id: 1,
  name: "Alex",
  email: "alex@example.com",
  avatarColor: "#39FF14",
};

const ActiveUserContext = createContext<ActiveUser>(defaultUser);

export function ActiveUserProvider({ children }: { children: ReactNode }) {
  return (
    <ActiveUserContext.Provider value={defaultUser}>
      {children}
    </ActiveUserContext.Provider>
  );
}

export function useActiveUser() {
  return useContext(ActiveUserContext);
}
