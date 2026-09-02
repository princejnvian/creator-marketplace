"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  projectId: string;
};

export default function FileUpload({ projectId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();
  const supabase = createClient();

  async function handleUpload() {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please login first.");
        return;
      }

      const filePath = `${projectId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      setMessage("File uploaded successfully! 🎉");
      setFile(null);

      // Refresh the page so the newly uploaded file appears immediately
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-6">

      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-3xl">
          📁
        </div>

        <h3 className="mt-4 text-lg font-bold">
          Upload a project file
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Select a file and upload it to this project.
        </p>

        <input
          type="file"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setError("");
            setMessage("");
          }}
          className="mx-auto mt-5 block w-full max-w-md rounded-xl border border-gray-300 bg-white p-3 text-sm"
        />

        {file && (
          <p className="mt-3 text-sm font-medium text-gray-700">
            Selected: {file.name}
          </p>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>

        {message && (
          <p className="mt-4 text-sm font-semibold text-green-600">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

      </div>

    </div>
  );
}