"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { Bell, Check, ShoppingBag, FileClock, AlertTriangle, Trash2, Inbox } from "lucide-react";
import Link from "next/link";
import { showSuccess, showError } from "@/utils/alerts";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      showError("حدث خطأ في جلب الإشعارات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "POST" });
      if (res.ok) {
        showSuccess("تم تحديد كل الإشعارات كمقروءة");
        fetchNotifications();
      } else {
        showError("حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PUT" });
      if (res.ok) fetchNotifications();
    } catch {
      // silent
    }
  };

  const deleteNotification = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإشعار؟")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف الإشعار");
        const deleted = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (deleted && !deleted.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        showError("حدث خطأ في الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAllNotifications = async () => {
    if (!confirm("هل أنت متأكد من حذف كل الإشعارات؟ لا يمكن التراجع عن هذه العملية.")) return;

    setIsDeletingAll(true);
    try {
      const res = await fetch("/api/notifications", { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف كل الإشعارات");
        setNotifications([]);
        setUnreadCount(0);
      } else {
        showError("حدث خطأ في الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER":
        return <ShoppingBag className="text-info-500" size={20} />;
      case "PURCHASE":
        return <FileClock className="text-warning-500" size={20} />;
      case "LOW_STOCK":
        return <AlertTriangle className="text-danger-500" size={20} />;
      default:
        return <Bell className="text-[var(--color-neutral-500)]" size={20} />;
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Bell className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <Bell className="text-primary-600" size={28} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">الإشعارات</h1>
              {unreadCount > 0 && (
                <span className="bg-danger-500 text-white text-sm px-3 py-1 rounded-full font-bold">
                  {unreadCount} جديد
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-success-400 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all shadow-sm shadow-success-200"
              >
                <Check size={18} /> تحديد الكل كمقروء
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={deleteAllNotifications}
                disabled={isDeletingAll}
                className="bg-danger-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-danger-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-danger-200"
              >
                <Trash2 size={18} /> {isDeletingAll ? "جاري الحذف..." : "حذف الكل"}
              </button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="space-y-3 stagger-children">
          {notifications.length === 0 ? (
            <div className="bg-[var(--color-card-bg)] p-12 rounded-2xl text-center border border-[var(--color-card-border)]">
              <Inbox className="mx-auto text-neutral-300 mb-3" size={56} />
              <p className="text-[var(--color-neutral-500)]">لا توجد إشعارات حتى الآن.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${
                  notif.isRead
                    ? "border-[var(--color-card-border)] opacity-80"
                    : "border-primary-200 bg-primary-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-[var(--color-neutral-100)] rounded-xl flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3
                        className={`font-bold ${
                          notif.isRead ? "text-[var(--color-neutral-600)]" : "text-[var(--color-fg)]"
                        }`}
                      >
                        {notif.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-[var(--color-neutral-400)] whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleString("ar-EG")}
                        </span>
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          disabled={deletingId === notif.id}
                          className="text-[var(--color-neutral-400)] hover:text-danger-600 transition-colors p-1 rounded-lg hover:bg-danger-50 disabled:opacity-50"
                          title="حذف الإشعار"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--color-neutral-600)] mt-1">{notif.message}</p>

                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={() => !notif.isRead && markAsRead(notif.id)}
                        className={`text-sm font-bold hover:underline mt-2 inline-block ${
                          notif.isRead ? "text-[var(--color-neutral-400)]" : "text-primary-600"
                        }`}
                      >
                        عرض التفاصيل ←
                      </Link>
                    )}
                  </div>
                  {!notif.isRead && (
                    <div className="w-3 h-3 bg-primary-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}