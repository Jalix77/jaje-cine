/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalBookings: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, phone: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la session Supabase au démarrage + écouter les changements
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (sessionUser) {
        const mappedUser: User = {
          id: sessionUser.id,
          name: (sessionUser.user_metadata?.name as string) || "",
          email: sessionUser.email || "",
          phone: (sessionUser.user_metadata?.phone as string) || "",
          joinDate: sessionUser.created_at?.slice(0, 10) || "",
          totalBookings: 0,
        };
        setUser(mappedUser);
        localStorage.setItem("currentUser", JSON.stringify(mappedUser));
      } else {
        setUser(null);
        localStorage.removeItem("currentUser");
      }

      setIsLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;

      if (sessionUser) {
        const mappedUser: User = {
          id: sessionUser.id,
          name: (sessionUser.user_metadata?.name as string) || "",
          email: sessionUser.email || "",
          phone: (sessionUser.user_metadata?.phone as string) || "",
          joinDate: sessionUser.created_at?.slice(0, 10) || "",
          totalBookings: 0,
        };
        setUser(mappedUser);
        localStorage.setItem("currentUser", JSON.stringify(mappedUser));
      } else {
        setUser(null);
        localStorage.removeItem("currentUser");
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("signIn error:", error);
        setIsLoading(false);
        return false;
      }

      const u = data.user;
      if (!u) {
        setIsLoading(false);
        return false;
      }

      const mappedUser: User = {
        id: u.id,
        name: (u.user_metadata?.name as string) || "",
        email: u.email || email,
        phone: (u.user_metadata?.phone as string) || "",
        joinDate: u.created_at?.slice(0, 10) || "",
        totalBookings: 0,
      };

      setUser(mappedUser);
      localStorage.setItem("currentUser", JSON.stringify(mappedUser));

      setIsLoading(false);
      return true;
    } catch (e) {
      console.error("signIn catch:", e);
      setIsLoading(false);
      return false;
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    phone: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone },
          // Important: en prod tu mettras ton domaine Vercel ici
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error("signUp error:", error);
        setIsLoading(false);
        return false;
      }

      // Après signUp avec email confirmation activée:
      // l'utilisateur doit confirmer dans son email avant de pouvoir se connecter.
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error("signUp catch:", e);
      setIsLoading(false);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}