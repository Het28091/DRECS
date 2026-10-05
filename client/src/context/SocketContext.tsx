'use client';
import { createContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { getSocket } from '@/lib/socket';
export const SocketContext = createContext<{ socket: Socket | null; isConnected: boolean }>({ socket: null, isConnected: false });
export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    if (!token || !user) return;
    const instance = getSocket();
    instance.auth = { token };
    const connected = () => setIsConnected(true);
    const disconnected = () => setIsConnected(false);
    instance.on('connect', connected);
    instance.on('disconnect', disconnected);
    setSocket(instance);
    instance.connect();
    return () => {
      instance.off('connect', connected);
      instance.off('disconnect', disconnected);
      instance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, user?.id]);
  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
}
