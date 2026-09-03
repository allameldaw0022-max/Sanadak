import type { Metadata } from "next";
import { ForgotPasswordClient } from "./ForgotPasswordClient";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
