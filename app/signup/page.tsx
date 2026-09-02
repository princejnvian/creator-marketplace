"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();

  const [accountType, setAccountType] = useState<"client" | "freelancer">(
    "client"
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!agree) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          account_type: accountType,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setSuccess(
        "Account created successfully! Please check your email to verify your account."
      );
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight"
          >
            YOUTENT<span className="text-blue-600">.</span>
          </Link>

          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Log in
            </Link>
          </p>

        </div>
      </nav>

      {/* Main */}
      <section className="px-6 py-12 md:py-16">

        <div className="mx-auto max-w-5xl">

          <div className="grid overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl md:grid-cols-2">

            {/* Left Side */}
            <div className="hidden bg-blue-600 p-10 text-white md:flex md:flex-col md:justify-between">

              <div>

                <Link
                  href="/"
                  className="text-3xl font-extrabold"
                >
                  YOUTENT<span className="text-blue-200">.</span>
                </Link>

                <h1 className="mt-16 text-4xl font-extrabold leading-tight">
                  Build.
                  <br />
                  Create.
                  <br />
                  Grow.
                </h1>

                <p className="mt-6 max-w-sm leading-7 text-blue-100">
                  Join YOUTENT and connect with talented creators
                  and clients from one simple platform.
                </p>

              </div>

              <div className="space-y-5">

                <Benefit
                  title="Find opportunities"
                  description="Connect with creators and clients."
                />

                <Benefit
                  title="Showcase your skills"
                  description="Build your professional portfolio."
                />

                <Benefit
                  title="Grow your career"
                  description="Turn your creative skills into income."
                />

              </div>

            </div>

            {/* Right Side */}
            <div className="p-7 sm:p-10">

              <div className="mx-auto max-w-md">

                <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                  Get started
                </p>

                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Join YOUTENT and start creating opportunities.
                </p>

                {/* Account Type */}
                <div className="mt-7">

                  <label className="text-sm font-semibold">
                    I want to
                  </label>

                  <div className="mt-3 grid grid-cols-2 gap-3">

                    {/* Client */}
                    <button
                      type="button"
                      onClick={() => setAccountType("client")}
                      className={`rounded-xl border p-4 text-left transition ${
                        accountType === "client"
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl">👤</div>

                      <p className="mt-2 text-sm font-bold">
                        Hire creators
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        I need creative services.
                      </p>
                    </button>

                    {/* Freelancer */}
                    <button
                      type="button"
                      onClick={() => setAccountType("freelancer")}
                      className={`rounded-xl border p-4 text-left transition ${
                        accountType === "freelancer"
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-2xl">🎨</div>

                      <p className="mt-2 text-sm font-bold">
                        Offer services
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        I want to sell my skills.
                      </p>
                    </button>

                  </div>

                </div>

                {/* Form */}
                <form
                  onSubmit={handleSignup}
                  className="mt-6 space-y-5"
                >

                  {/* Full Name */}
                  <div>

                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Full Name
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                    />

                  </div>

                  {/* Email */}
                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                    />

                  </div>

                  {/* Password */}
                  <div>

                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Password
                    </label>

                    <div className="relative">

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-blue-600"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>

                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Minimum 8 characters.
                    </p>

                  </div>

                  {/* Confirm Password */}
                  <div>

                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">

                      <input
                        id="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-16 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-blue-600"
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>

                    </div>

                  </div>

                  {/* Terms */}
                  <label className="flex cursor-pointer items-start gap-3">

                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) =>
                        setAgree(e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span className="text-xs leading-5 text-gray-500">
                      I agree to YOUTENT&apos;s{" "}
                      <a
                        href="#"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>

                  </label>

                  {/* Error */}
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Success */}
                  {success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {success}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Creating account..."
                      : "Create Account"}
                  </button>

                </form>

                {/* Login */}
                <p className="mt-7 text-center text-sm text-gray-600">

                  Already have an account?{" "}

                  <Link
                    href="/login"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Log in
                  </Link>

                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

function Benefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold">
        ✓
      </div>

      <div>

        <p className="font-semibold">
          {title}
        </p>

        <p className="mt-1 text-sm text-blue-100">
          {description}
        </p>

      </div>

    </div>
  );
}