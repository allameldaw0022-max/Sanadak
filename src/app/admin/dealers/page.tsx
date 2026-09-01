import type { Metadata } from "next";
import { Store } from "lucide-react";
import { getAdminUsers } from "@/lib/supabase/queries";
import { setDealerStatusAction } from "@/app/admin/actions";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "التجار | سندك",
};

// Reuses getAdminUsers()/setDealerStatusAction() as-is (already built and
// admin-gated, already used by /admin/users) -- is_dealer is a flag on the
// existing profiles row, not a new role, so granting/revoking it can never
// change what a user's own role-based permissions are. The protect_profile_
// protected_columns trigger (profiles) makes self-escalation to dealer
// impossible regardless of what this form submits.
export default async function AdminDealersPage() {
  const users = await getAdminUsers();
  const dealers = users.filter((u) => u.isDealer);
  const others = users.filter((u) => !u.isDealer);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">التجار</h1>
        <p className="mt-1 text-sm text-slate-500">حسابات التجار المفعّلة ({dealers.length})</p>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {dealers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Store className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">لا يوجد تجار مفعّلون حاليًا.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">المستخدم</th>
                  <th className="px-5 py-3 font-semibold">البريد</th>
                  <th className="px-5 py-3 font-semibold">تاريخ التسجيل</th>
                  <th className="px-5 py-3 font-semibold">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {dealers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-semibold text-navy">{user.fullName}</td>
                    <td className="px-5 py-3 text-slate-600">{user.email}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-3">
                      <form action={setDealerStatusAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="isDealer" value="false" />
                        <button
                          type="submit"
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200"
                        >
                          إلغاء صفة تاجر
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="mb-3 text-lg font-bold text-navy">منح صفة تاجر</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-right text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="px-5 py-3 font-semibold">المستخدم</th>
                <th className="px-5 py-3 font-semibold">البريد</th>
                <th className="px-5 py-3 font-semibold">الدور</th>
                <th className="px-5 py-3 font-semibold">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {others.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-semibold text-navy">{user.fullName}</td>
                  <td className="px-5 py-3 text-slate-600">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", "bg-slate-100 text-slate-600")}>
                      {user.role === "admin" ? "مشرف" : user.role === "developer" ? "مطور" : "مستخدم"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <form action={setDealerStatusAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="isDealer" value="true" />
                      <button
                        type="submit"
                        className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary-dark hover:bg-primary/20"
                      >
                        منح صفة تاجر
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
