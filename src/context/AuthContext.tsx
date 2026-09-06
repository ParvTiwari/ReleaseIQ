import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import type { UserProfile, UserRole } from "../types/release";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  signIn: (email: string, role?: UserRole, name?: string) => Promise<void>;
  signUp: (name: string, email: string, role: UserRole, organization?: string) => Promise<void>;
  signOut: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}

const STORAGE_KEY = "releaseiq_auth_user";

const defaultUser: UserProfile = {
  id: "usr-parv",
  name: "Parv Tiwari",
  email: "parvtiwari1@gmail.com",
  role: "Project Owner",
  organization: "ReleaseIQ Technologies",
  avatarInitials: "PT",
  joinedDate: "August 2026",
  twoFactorEnabled: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        return saved === "null" ? null : JSON.parse(saved);
      }
    } catch {
      // ignore storage parsing error
    }
    return defaultUser;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const persistUser = (newUser: UserProfile | null) => {
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.setItem(STORAGE_KEY, "null");
        localStorage.removeItem("releaseiq_jwt_token");
      }
    } catch {
      // ignore storage error
    }
  };

  // On mount, sync with backend if JWT exists
  useEffect(() => {
    const syncUser = async () => {
      const token = localStorage.getItem("releaseiq_jwt_token");
      if (token) {
        try {
          const freshUser = await api.auth.getMe();
          persistUser(freshUser);
        } catch {
          // Keep cached local user if backend is offline
        }
      }
    };
    syncUser();
  }, []);

  const signIn = async (email: string, role: UserRole = "Project Owner", name?: string) => {
    try {
      const res = await api.auth.login(email, role);
      if (res && res.user) {
        persistUser(res.user);
        return;
      }
    } catch {
      // Offline fallback
    }

    const userName = name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const fallbackUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: userName,
      email,
      role,
      organization: "ReleaseIQ Technologies",
      avatarInitials: getInitials(userName),
      joinedDate: "August 2026",
      twoFactorEnabled: false,
    };
    persistUser(fallbackUser);
  };

  const signUp = async (name: string, email: string, role: UserRole, organization = "Acme Corp") => {
    try {
      const res = await api.auth.register(name, email, role, organization);
      if (res && res.user) {
        persistUser(res.user);
        return;
      }
    } catch {
      // Offline fallback
    }

    const fallbackUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      organization,
      avatarInitials: getInitials(name),
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      twoFactorEnabled: false,
    };
    persistUser(fallbackUser);
  };

  const signOut = () => {
    persistUser(null);
  };

  const switchRole = async (newRole: UserRole) => {
    if (!user) return;
    try {
      const updated = await api.auth.updateProfile({ role: newRole });
      persistUser(updated);
    } catch {
      persistUser({ ...user, role: newRole });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const updated = await api.auth.updateProfile(updates);
      persistUser(updated);
    } catch {
      persistUser({
        ...user,
        ...updates,
        avatarInitials: updates.name ? getInitials(updates.name) : user.avatarInitials,
      });
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return Boolean(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        switchRole,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
