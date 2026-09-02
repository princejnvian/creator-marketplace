"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess("Login successful! Redirecting...");

    // Temporary redirect
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
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
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign up
            </Link>
          </p>

        </div>
      </nav>

      {/* Main */}
      <section className="flex min-h-[calc(100vh-81px)] items-center justify-center px-5 py-12">

        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl md:grid-cols-2">

          {/* Left Side */}
          <div className="hidden bg-blue-600 p-12 text-white md:flex md:flex-col md:justify-between">

            <div>

              <Link
                href="/"
                className="text-3xl font-extrabold"
              >
                YOUTENT<span className="text-blue-200">.</span>
              </Link>

              <div className="mt-28">

                <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
                  Welcome back
                </p>

                <h1 className="mt-4 text-5xl font-extrabold leading-tight">
                  Your next
                  <br />
                  project starts
                  <br />
                  here.
                </h1>

                <p className="mt-6 max-w-md text-lg leading-8 text-blue-100">
                  Connect with talented creators, manage your projects,
                  and bring your ideas to life.
                </p>

              </div>

            </div>

            <div className="rounded-2xl bg-blue-500/50 p-5">

              <p className="font-semibold">
                One account. Endless possibilities.
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Hire creators or offer your own creative services on YOUTENT.
              </p>

            </div>

          </div>

          {/* Right Side */}
          <div className="p-7 sm:p-10 md:p-12">

            <div className="mx-auto max-w-md">

              <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                Log in to your account
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Enter your details to continue to YOUTENT.
              </p>

              {/* Login Form */}
              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >

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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

                {/* Password */}
                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="text-sm font-semibold"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Forgot password?
                    </Link>

                  </div>

                  <div className="relative">

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-20 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-blue-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                </div>

                {/* Remember Me */}
                <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-600">

                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  Remember me

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

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>

              </form>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">

                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-xs text-gray-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-gray-200" />

              </div>

              {/* Google UI */}
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-gray-300 px-5 py-3.5 font-semibold text-gray-400"
              >
                <span className="text-lg font-bold">
                  G
                </span>

                Continue with Google

                <span className="text-xs font-normal">
                  (Coming soon)
                </span>
              </button>

              {/* Signup */}
              <p className="mt-7 text-center text-sm text-gray-600">

                Don&apos;t have an account?{" "}

                <Link
                  href="/signup"
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Create an account
                </Link>

              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}