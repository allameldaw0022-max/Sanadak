import type { Metadata } from "next";
import { getAdminUsers } from "@/lib/supabase/queries";
import { setDealerStatusAction } from "@/app/admin/actions";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "المستخدمون | سندك",
};

const roleLabels: Record<string, string> = {
  user: "مستخدم",
  developer: "مطور",
  admin: "مشرف",
};

const roleStyles: Record<string, string> = {
  user: "bg-slate-100 text-slate-600",
  developer: "bg-sky-50 text-sky-700",
  admin: "bg-primary-light text-primary-dark",
};

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">المستخدمون</h1>
        <p className="mt-1 text-sm text-slate-500">كل الحسابات المسجلة على سندك ({users.length})</p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا يوجد مستخدمون مسجلون بعد.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">المستخدم</th>
                  <th className="px-5 py-3 font-semibold">البريد</th>
                  <th className="px-5 py-3 font-semibold">الدور</th>
                  <th className="px-5 py-3 font-semibold">تاجر</th>
                  <th className="px-5 py-3 font-semibold">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-semibold text-navy">{user.fullName}</td>
                    <td className="px-5 py-3 text-slate-600">{user.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                          roleStyles[user.role]
                        )}
                      >
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <form action={setDealerStatusAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="isDealer" value={(!user.isDealer).toString()} />
                        <button
                          type="submit"
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                            user.isDealer
                              ? "bg-primary-light text-primary-dark hover:bg-primary/20"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          {user.isDealer ? "نعم — إلغاء" : "لا — تفعيل"}
                        </button>
                      </form>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
