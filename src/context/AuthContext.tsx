import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile, UserRole } from "../types/release";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  signIn: (email: string, role?: UserRole, name?: string) => void;
  signUp: (name: string, email: string, role: UserRole, organization?: string) => void;
  signOut: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetPassword: (email: string) => Promise<boolean>;
}

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
  const [user, setUser] = useState<UserProfile | null>(defaultUser);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const signIn = (email: string, role: UserRole = "Project Owner", name?: string) => {
    const userName = name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const signedInUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: userName,
      email,
      role,
      organization: "ReleaseIQ Technologies",
      avatarInitials: getInitials(userName),
      joinedDate: "August 2026",
      twoFactorEnabled: false,
    };
    setUser(signedInUser);
  };

  const signUp = (name: string, email: string, role: UserRole, organization = "Acme Corp") => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      organization,
      avatarInitials: getInitials(name),
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      twoFactorEnabled: false,
    };
    setUser(newUser);
  };

  const signOut = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    setUser({ ...user, role: newRole });
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    setUser({
      ...user,
      ...updates,
      avatarInitials: updates.name ? getInitials(updates.name) : user.avatarInitials,
    });
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
