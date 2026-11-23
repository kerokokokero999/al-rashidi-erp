"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== "undefined") return navigator.onLine;
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
        isOnline
          ? "bg-success-100 text-success-700"
          : "bg-danger-50 text-danger-700 animate-pulse-soft"
      }`}
      title={isOnline ? "متصل بالإنترنت" : "غير متصل - المزامنة معلقة"}
    >
      {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
      {isOnline ? "متصل" : "غير متصل"}
    </div>
  );
}