"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type HireFormProps = {
  creatorId: string;
  creatorName: string;
};

export default function HireForm({
  creatorId,
  creatorName,
}: HireFormProps) {
  const [open, setOpen] = useState(false);

  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [service, setService] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    // Basic validation
    if (!projectTitle.trim()) {
      setError("Please enter a project title.");
      setSaving(false);
      return;
    }

    if (!description.trim()) {
      setError("Please describe your project.");
      setSaving(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in to send a project request.");
      setSaving(false);
      return;
    }

    if (user.id === creatorId) {
      setError("You cannot hire yourself.");
      setSaving(false);
      return;
    }

    // Send project request
    const { error: insertError } = await supabase
      .from("project_requests")
      .insert({
        client_id: user.id,
        creator_id: creatorId,
        project_title: projectTitle.trim(),
        description: description.trim(),
        service: service.trim() || null,
        budget: budget ? Number(budget) : null,
        deadline: deadline || null,
        status: "pending",
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    // Success
    setSuccess(
      "Project request sent successfully! 🎉"
    );

    // Clear form
    setProjectTitle("");
    setDescription("");
    setService("");
    setBudget("");
    setDeadline("");

    setSaving(false);
  }

  // ===============================
  // HIRE BUTTON
  // ===============================

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError("");
          setSuccess("");
        }}
        className="w-full rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
      >
        Hire Creator
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

        {/* ================= HEADER ================= */}

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold">
              Hire {creatorName}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Send a project request to this creator.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-2xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>

        </div>

        {/* ================= FORM ================= */}

        <form
          className="mt-6 space-y-5"
          onSubmit={handleSubmit}
        >

          {/* Project Title */}

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Project Title
            </label>

            <input
              type="text"
              value={projectTitle}
              onChange={(e) =>
                setProjectTitle(e.target.value)
              }
              placeholder="e.g. YouTube video editing"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              required
            />
          </div>

          {/* Description */}

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Description
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Describe what you need..."
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              required
            />
          </div>

          {/* Service */}

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Service
            </label>

            <input
              type="text"
              value={service}
              onChange={(e) =>
                setService(e.target.value)
              }
              placeholder="e.g. Video Editing"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          {/* Budget + Deadline */}

          <div className="grid gap-4 sm:grid-cols-2">

            {/* Budget */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Budget (₹)
              </label>

              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value)
                }
                placeholder="5000"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Deadline */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Deadline
              </label>

              <input
                type="date"
                value={deadline}
                onChange={(e) =>
                  setDeadline(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              />
            </div>

          </div>

          {/* Error */}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
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
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Sending..."
              : "Send Project Request"}
          </button>

        </form>

      </div>

    </div>
  );
}