"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import axiosInstance from "../lib/axiosinstance";
import { useAuth } from "../lib/AuthContext";
import Link from "next/link";

export function CreatePost({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<{
    friendCount: number;
    limit: number | "unlimited";
    postsToday: number;
    remaining: number;
    canPost: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchLimit = async () => {
      try {
        const res = await axiosInstance.get("/api/posts/limit-info");
        if (res.data.success) setLimitInfo(res.data.data);
      } catch {
        // ignore
      }
    };
    fetchLimit();
  }, [user, loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "video/mp4"];
    if (!allowed.includes(f.type)) {
      setError("Allowed: jpg, png, mp4");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File must be under 50MB");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to post");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      if (file) formData.append("media", file);

      const res = await axiosInstance.post("/api/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setContent("");
        clearFile();
        onSuccess?.();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create post";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm"
    >
      <h3 className="font-semibold text-gray-800 mb-3">Create Post</h3>
      {limitInfo && (
        <p className="text-sm text-gray-600 mb-3">
          {limitInfo.friendCount === 0 ? (
            <>
              <Link href="/users/users" className="text-blue-600 hover:underline">
                Add friends
              </Link>{" "}
              to post in Public Space.
            </>
          ) : limitInfo.canPost ? (
            <>
              {limitInfo.remaining === Infinity || limitInfo.remaining > 0
                ? `You can post ${limitInfo.remaining === Infinity ? "unlimited" : limitInfo.remaining} more today (${limitInfo.friendCount} friends).`
                : "Daily post limit reached."}
            </>
          ) : (
            "Daily post limit reached."
          )}
        </p>
      )}
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mb-3 min-h-[80px]"
        disabled={loading}
      />
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,video/mp4"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          📷 Image / Video
        </Button>
        {file && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFile} disabled={loading}>
            Remove file
          </Button>
        )}
      </div>
      {preview && (
        <div className="mb-3">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 rounded-lg object-cover border border-gray-200"
          />
        </div>
      )}
      {file && !preview && (
        <p className="text-sm text-gray-600 mb-3">Video selected: {file.name}</p>
      )}
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={loading || (limitInfo?.canPost === false)}
      >
        {loading ? "Posting..." : "Post"}
      </Button>
    </form>
  );
}
