import type { Metadata } from "next";
import { ResetPasswordClient } from "./ResetPasswordClient";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
