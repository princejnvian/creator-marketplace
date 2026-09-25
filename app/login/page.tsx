"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import YoutentLogo from "@/components/YoutentLogo";
export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

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

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          {/* Logo */}
          <YoutentLogo href="/" />

          {/* Signup */}
          <p className="text-sm text-slate-500">
            <span className="hidden sm:inline">
              Don&apos;t have an account?{" "}
            </span>

            <Link
              href="/signup"
              className="font-bold text-blue-600 transition hover:text-blue-700"
            >
              Sign up
            </Link>
          </p>
        </div>
      </nav>

      {/* Main */}
      <section className="relative z-10 flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-10 sm:px-6 sm:py-14">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 md:grid-cols-2">

          {/* Left Panel */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 p-10 text-white md:flex md:min-h-[650px] md:flex-col md:justify-between lg:p-12">

            {/* Decorative circles */}
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5" />
            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-white/10 bg-white/5" />

            {/* Content */}
            <div className="relative">
              {/* Brand */}
              <YoutentLogo href="/" size="lg" lightWordmark />

              {/* Hero */}
              <div className="mt-24">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-100 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
                  Welcome back
                </div>

                <h1 className="text-4xl font-black leading-[1.08] tracking-tight lg:text-5xl">
                  Your next
                  <br />
                  project starts
                  <br />
                  <span className="text-blue-200">here.</span>
                </h1>

                <p className="mt-6 max-w-md text-base leading-7 text-blue-100 lg:text-lg">
                  Connect with talented creators, manage your projects,
                  and turn great ideas into reality.
                </p>
              </div>
            </div>

            {/* Bottom Card */}
            <div className="relative rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg">
                  ✦
                </div>

                <div>
                  <p className="font-bold">
                    One account. Endless possibilities.
                  </p>

                  <p className="mt-1.5 text-sm leading-6 text-blue-100">
                    Hire creators or offer your own creative services on
                    YOUTENT.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex items-center p-7 sm:p-10 lg:p-12">
            <div className="mx-auto w-full max-w-md">

              {/* Heading */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Welcome back
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Log in to your account
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Enter your details to continue to YOUTENT.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-slate-800"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </div>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold text-slate-800"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs font-bold text-blue-600 transition hover:text-blue-700"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="10"
                          rx="2"
                        />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </div>

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-20 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg px-1 text-xs font-bold text-slate-500 transition hover:text-blue-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Remember */}
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span>Remember me</span>
                </label>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black">
                      !
                    </div>

                    <p className="leading-5">{error}</p>
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black">
                      ✓
                    </div>

                    <p className="leading-5">{success}</p>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        Log In
                        <svg
                          className="h-4 w-4 transition duration-300 group-hover:translate-x-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </>
                    )}
                  </span>

                  <div className="absolute inset-0 -translate-x-full bg-white/10 transition duration-700 group-hover:translate-x-full" />
                </button>
              </form>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-[11px] font-bold tracking-widest text-slate-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-base font-black text-[#4285F4]">G</span>
                <span>Continue with Google</span>
              </button>

              {/* Signup */}
              <p className="mt-7 text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                >
                  Create an account
                </Link>
              </p>

              {/* Tagline */}
              <div className="mt-8 border-t border-slate-100 pt-5 text-center">
                <p className="text-xs font-medium tracking-wide text-slate-400">
                  Where Talent Meets Opportunity
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}