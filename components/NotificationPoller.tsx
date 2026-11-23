"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export default function NotificationPoller() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // كل 30 ثانية

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition p-2 rounded-lg"
      title="الإشعارات"
    >
      <Bell size={22} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 bg-danger-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}