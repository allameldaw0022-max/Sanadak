-- SEC-07 cleanup: the legacy 8-parameter register_device() (the one that
-- trusted a caller-supplied imei_hash) has been fully replaced by the
-- 6-parameter SECURITY DEFINER overload added in
-- 20260902_sec07_register_device_definer_hmac.sql, which derives the HMAC
-- itself from the Vault-held secret. registerDeviceAction has been updated
-- to call the new signature exclusively, and a dependency check confirmed
-- nothing else in the database or application referenced the old one.
-- Dropping it removes the ability for any caller to submit a forged
-- imei_hash via the old signature.
DROP FUNCTION public.register_device(text, text, text, text, text, text, text, text);
