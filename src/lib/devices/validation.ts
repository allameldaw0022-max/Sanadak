import { isValidImei, normalizeImei } from "./imei";

export type DeviceRegistrationInput = {
  brand: string;
  model: string;
  color?: string | null;
  serialNumber?: string | null;
  imei1: string;
  imei2?: string | null;
};

export type ValidatedDeviceRegistration = {
  brand: string;
  model: string;
  color: string | null;
  serialNumber: string | null;
  imei1Normalized: string;
  imei2Normalized: string | null;
};

export type ValidationResult =
  | { ok: true; data: ValidatedDeviceRegistration }
  | { ok: false; error: string };

const MAX_TEXT_LENGTH = 100;

// Pure, side-effect-free validation for registerDeviceAction's input — kept
// separate from the Server Action itself (which does the actual DB I/O) so
// every rule here is directly unit-testable without mocking cookies/Supabase,
// the same split already used for image uploads (src/lib/uploads/image-validation.ts
// vs. the submitNewAppAction Server Action that calls it).
//
// This is the ONLY place brand/model/color/serial_number/IMEIs are accepted
// from a caller — there is deliberately no field here for owner_id, status,
// or device_id: the Server Action must never read those from client input.
export function validateDeviceRegistrationInput(input: DeviceRegistrationInput): ValidationResult {
  const brand = (input.brand ?? "").trim();
  const model = (input.model ?? "").trim();

  if (!brand) return { ok: false, error: "الرجاء إدخال ماركة الجهاز." };
  if (!model) return { ok: false, error: "الرجاء إدخال موديل الجهاز." };
  if (brand.length > MAX_TEXT_LENGTH || model.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: "الماركة أو الموديل طويل جدًا." };
  }

  const color = (input.color ?? "").trim();
  if (color.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: "اللون المُدخل طويل جدًا." };
  }

  const serialNumber = (input.serialNumber ?? "").trim();
  if (serialNumber.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: "الرقم التسلسلي طويل جدًا." };
  }

  const imei1Normalized = normalizeImei(input.imei1 ?? "");
  if (!isValidImei(imei1Normalized)) {
    return { ok: false, error: "رقم IMEI1 غير صالح. تأكد من إدخال 15 رقمًا صحيحًا." };
  }

  let imei2Normalized: string | null = null;
  const imei2Raw = (input.imei2 ?? "").trim();
  if (imei2Raw !== "") {
    imei2Normalized = normalizeImei(imei2Raw);
    if (!isValidImei(imei2Normalized)) {
      return { ok: false, error: "رقم IMEI2 غير صالح. تأكد من إدخال 15 رقمًا صحيحًا." };
    }
    if (imei2Normalized === imei1Normalized) {
      return { ok: false, error: "لا يمكن أن يكون IMEI2 مطابقًا لـ IMEI1." };
    }
  }

  return {
    ok: true,
    data: {
      brand,
      model,
      color: color || null,
      serialNumber: serialNumber || null,
      imei1Normalized,
      imei2Normalized,
    },
  };
}
