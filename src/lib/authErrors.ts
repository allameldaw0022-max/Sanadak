import type { AuthError } from "@supabase/supabase-js";

function isNetworkAuthError(err: AuthError): boolean {
  const msg = err.message.toLowerCase();
  return (
    err.name === "AuthRetryableFetchError" ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("network")
  );
}

function isRateLimitAuthError(err: AuthError): boolean {
  return err.status === 429 || err.message.toLowerCase().includes("rate limit");
}

const DEBUG_SUFFIX = true;

function debugSuffix(err: AuthError): string {
  if (!DEBUG_SUFFIX) return "";
  return ` [DEBUG: ${err.name} | status=${err.status ?? "none"} | ${err.message}]`;
}

export function describeSignUpError(err: AuthError): string {
  console.error("Supabase signUp error:", err.name, err.status, err.message);

  const msg = err.message.toLowerCase();
  const suffix = debugSuffix(err);
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return "هذا البريد الإلكتروني مسجل بالفعل." + suffix;
  }
  if (isNetworkAuthError(err)) {
    return "تعذر الاتصال بالخادم، تحقق من اتصال الإنترنت وحاول مرة أخرى." + suffix;
  }
  if (isRateLimitAuthError(err)) {
    return "محاولات كثيرة خلال وقت قصير، يرجى الانتظار قليلًا ثم إعادة المحاولة." + suffix;
  }
  if (msg.includes("password")) {
    return "كلمة المرور غير صالحة، يجب أن تكون 6 أحرف على الأقل." + suffix;
  }
  return "تعذر إنشاء الحساب، حاول مرة أخرى." + suffix;
}

export function describeSignInError(err: AuthError): string {
  console.error("Supabase signIn error:", err.name, err.status, err.message);

  const suffix = debugSuffix(err);
  if (isNetworkAuthError(err)) {
    return "تعذر الاتصال بالخادم، تحقق من اتصال الإنترنت وحاول مرة أخرى." + suffix;
  }
  if (isRateLimitAuthError(err)) {
    return "محاولات كثيرة خلال وقت قصير، يرجى الانتظار قليلًا ثم إعادة المحاولة." + suffix;
  }
  return "البريد الإلكتروني أو كلمة المرور غير صحيحة." + suffix;
}
