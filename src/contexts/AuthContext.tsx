import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/types';
import { api, setToken, getToken } from '@/services/api';

interface AuthContextType {
  user: User | null; session: null; loading: boolean;
  signUp: (email:string,password:string,displayName?:string,phone?:string)=>Promise<{error:Error|null}>;
  signIn: (email:string,password:string)=>Promise<{error:Error|null}>;
  signOut: ()=>Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{children:React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User|null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!getToken()) return void setLoading(false); api<{user:User}>('/auth/me').then(({user})=>setUser(user)).catch(()=>setToken(null)).finally(()=>setLoading(false)); }, []);
  const authenticate = async (path:string,email:string,password:string,displayName?:string,phone?:string) => {
    try {
      const result = await api<{token:string;user:User}>(path,{method:'POST',body:JSON.stringify({email,password,displayName,phone})});
      setToken(result.token); setUser(result.user); return {error:null};
    } catch(error) { return {error:error as Error}; }
  };
  return <AuthContext.Provider value={{user,session:null,loading,signUp:(e,p,n,phone)=>authenticate('/auth/register',e,p,n,phone),signIn:(e,p)=>authenticate('/auth/login',e,p),signOut:async()=>{setToken(null);setUser(null);}}}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within an AuthProvider'); return context; };
