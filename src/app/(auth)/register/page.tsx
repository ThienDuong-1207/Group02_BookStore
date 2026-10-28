import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account – Book Store" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Create an account</h1>
      <p className="mb-6 text-sm text-muted">Register as a customer to save your information.</p>
      <RegisterForm />
    </>
  );
}
