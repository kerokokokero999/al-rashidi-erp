"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  UserCheck,
  LogOut,
  LogIn,
  Users,
  Clock,
  CheckCircle,
  Calendar,
  Search,
  TrendingUp,
  Timer,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/alerts";

type Employee = {
  id: number;
  name: string;
  position: string;
  salary: number;
};

type Attendance = {
  id: number;
  employeeId: number;
  employee: Employee;
  checkIn: string;
  checkOut: string | null;
  date: string;
};

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");

  const fetchData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/hr/attendance"),
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (attRes.ok) setAttendances(await attRes.json());
    } catch {
      showError("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleCheckIn = async (employeeId: number) => {
    setProcessing(employeeId);
    try {
      const res = await fetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      if (res.ok) {
        showSuccess("تم تسجيل الحضور");
        fetchData();
      } else {
        const data = await res.json();
        showError(data.error || "حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setProcessing(null);
    }
  };

  const handleCheckOut = async (attendanceId: number) => {
    setProcessing(attendanceId);
    try {
      const res = await fetch(`/api/hr/attendance/${attendanceId}`, {
        method: "PUT",
      });
      if (res.ok) {
        showSuccess("تم تسجيل الانصراف");
        fetchData();
      } else {
        showError("حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setProcessing(null);
    }
  };

  const calculateHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return "—";
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    return `${hours.toFixed(2)} ساعة`;
  };

  // فلترة الموظفين
  const filteredEmployees = employees.filter((e) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return e.name.toLowerCase().includes(term) || e.position.toLowerCase().includes(term);
  });

  // فلترة سجل الحضور
  const filteredAttendances = attendances.filter((att) => {
    if (filter === "PRESENT") return !att.checkOut;
    if (filter === "ABSENT") return !!att.checkOut;
    return true;
  });

  // إحصائيات
  const today = new Date().toDateString();
  const todayAttendances = attendances.filter(
    (a) => new Date(a.checkIn).toDateString() === today
  );
  const presentToday = todayAttendances.filter((a) => !a.checkOut).length;
  const totalHoursToday = todayAttendances
    .filter((a) => a.checkOut)
    .reduce((sum, a) => {
      const hours =
        (new Date(a.checkOut!).getTime() - new Date(a.checkIn).getTime()) /
        (1000 * 60 * 60);
      return sum + hours;
    }, 0);

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <UserCheck className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-slide-down">
          <div className="p-3 rounded-xl bg-primary-100">
            <UserCheck className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">الموارد البشرية</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">
              {employees.length} موظف — {presentToday} حاضر اليوم
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)]">
            <div className="text-xs text-[var(--color-neutral-500)] mb-1 flex items-center gap-1">
              <Users size={12} /> إجمالي الموظفين
            </div>
            <div className="text-2xl font-extrabold text-[var(--color-fg)]">{employees.length}</div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)]">
            <div className="text-xs text-[var(--color-neutral-500)] mb-1 flex items-center gap-1">
              <CheckCircle size={12} /> حاضر اليوم
            </div>
            <div className="text-2xl font-extrabold text-success-600">{presentToday}</div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)]">
            <div className="text-xs text-[var(--color-neutral-500)] mb-1 flex items-center gap-1">
              <Timer size={12} /> ساعات اليوم
            </div>
            <div className="text-2xl font-extrabold text-info-500">{totalHoursToday.toFixed(1)}</div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)]">
            <div className="text-xs text-[var(--color-neutral-500)] mb-1 flex items-center gap-1">
              <Calendar size={12} /> سجلات اليوم
            </div>
            <div className="text-2xl font-extrabold text-primary-600">{todayAttendances.length}</div>
          </div>
        </div>

        {/* Check-in Section */}
        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="text-xl font-extrabold text-[var(--color-fg)] flex items-center gap-2">
              <LogIn className="text-success-500" size={20} /> تسجيل حضور الموظفين
            </h2>
            <div className="relative max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={16} />
              <input
                type="text"
                placeholder="ابحث بالاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-2 pr-9 rounded-lg focus:border-primary-400 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEmployees.length === 0 ? (
              <p className="col-span-full text-center text-[var(--color-neutral-500)] py-6">لا يوجد موظفين.</p>
            ) : (
              filteredEmployees.map((emp) => {
                const activeAttendance = attendances.find(
                  (att) => att.employeeId === emp.id && !att.checkOut
                );
                const isCheckedIn = !!activeAttendance;

                return (
                  <div
                    key={emp.id}
                    className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-card-border)] hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-bold">
                          {emp.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-[var(--color-fg)]">{emp.name}</div>
                        <div className="text-xs text-[var(--color-neutral-500)]">{emp.position}</div>
                      </div>
                    </div>

                    {isCheckedIn ? (
                      <div className="space-y-2">
                        <div className="bg-success-100 text-success-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle size={12} /> حاضر من{" "}
                          {new Date(activeAttendance.checkIn).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <button
                          onClick={() => handleCheckOut(activeAttendance.id)}
                          disabled={processing === activeAttendance.id}
                          className="w-full bg-danger-50 text-danger-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-danger-100 transition-colors disabled:opacity-50"
                        >
                          <LogOut size={14} /> تسجيل انصراف
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(emp.id)}
                        disabled={processing === emp.id}
                        className="w-full bg-success-400 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-success-500 active:scale-[0.97] transition-all disabled:opacity-50"
                      >
                        <LogIn size={14} /> تسجيل حضور
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Attendance Log */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-[var(--color-card-border)] flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-extrabold text-[var(--color-neutral-700)] flex items-center gap-2">
              <Clock className="text-primary-500" size={20} /> سجل الحضور والانصراف
            </h2>
            <div className="flex gap-2">
              {[
                { key: "ALL", label: "الكل" },
                { key: "PRESENT", label: "حاضر" },
                { key: "ABSENT", label: "انصرف" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as typeof filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === f.key
                      ? "bg-primary-500 text-white"
                      : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[var(--color-bg)] border-b border-[var(--color-card-border)]">
                <tr>
                  <th className="p-4 font-bold text-[var(--color-neutral-700)]">الموظف</th>
                  <th className="p-4 font-bold text-[var(--color-neutral-700)]">التاريخ</th>
                  <th className="p-4 font-bold text-[var(--color-neutral-700)]">الحضور</th>
                  <th className="p-4 font-bold text-[var(--color-neutral-700)]">الانصراف</th>
                  <th className="p-4 font-bold text-[var(--color-neutral-700)]">الساعات</th>
                  <th className="p-4 font-bold text-[var(--color-neutral-700)]">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Clock className="mx-auto text-neutral-300 mb-3" size={48} />
                      <p className="text-[var(--color-neutral-500)]">لا توجد سجلات.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map((att) => (
                    <tr key={att.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4 font-bold text-[var(--color-fg)]">{att.employee.name}</td>
                      <td className="p-4 text-[var(--color-neutral-600)]">
                        {new Date(att.date).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-4 text-[var(--color-neutral-600)]">
                        {new Date(att.checkIn).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4">
                        {att.checkOut ? (
                          <span className="text-[var(--color-neutral-600)]">
                            {new Date(att.checkOut).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-success-600 font-bold inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                            لم يسجل
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-info-500 bg-info-500/10 px-2 py-1 rounded-lg text-xs">
                          {calculateHours(att.checkIn, att.checkOut)}
                        </span>
                      </td>
                      <td className="p-4">
                        {!att.checkOut && (
                          <button
                            onClick={() => handleCheckOut(att.id)}
                            disabled={processing === att.id}
                            className="bg-danger-50 text-danger-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-danger-100 transition-colors disabled:opacity-50"
                          >
                            <LogOut size={12} /> انصراف
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}