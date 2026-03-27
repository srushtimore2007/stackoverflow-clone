"use client";

import React, { useEffect, useState } from "react";
import Mainlayout from "../../layout/Mainlayout";
import { CreatePost } from "../../components/CreatePost";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import axiosInstance from "../../lib/axiosinstance";
import { useAuth } from "../../lib/AuthContext";
import Link from "next/link";
import { useTranslationManager } from "../../hooks/useTranslationManager";

interface Comment {
  _id: string;
  userId: { _id: string; name: string };
  text: string;
  createdAt: string;
}

interface Post {
  _id: string;
  userId: { _id: string; name: string };
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  likes: string[];
  comments: Comment[];
  shares: number;
  createdAt: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const { t } = useTranslationManager();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const fetchFeed = async () => {
    try {
      const res = await axiosInstance.get("/api/posts/feed");
      if (res.data.success) setPosts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post("/api/posts/like", { postId });
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id !== postId) return p;
            return { ...p, likes: res.data.data.likes };
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId: string) => {
    if (!user) return;
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    try {
      const res = await axiosInstance.post("/api/posts/comment", { postId, text });
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, comments: res.data.data.comments } : p))
        );
        setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (postId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.post("/api/posts/share", { postId });
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, shares: res.data.data.shares } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isLiked = (post: Post) => user && post.likes?.includes(user._id);

  return (
    <Mainlayout>
      <main className="min-w-0 p-4 lg:p-6 max-w-2xl mx-auto">
        <h1 className="text-xl lg:text-2xl font-semibold mb-6">{t('feed.title')}</h1>

        {user && <CreatePost onSuccess={fetchFeed} />}

        {!user && (
          <p className="text-gray-600 mb-6">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              {t('login')}
            </Link>{" "}
            {t('feed.loginToPost')}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">{t('feed.noPosts')}</div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Link href={`/users/${post.userId?._id}`}>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {post.userId?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link
                        href={`/users/${post.userId?._id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {post.userId?.name || "Unknown"}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {post.content && <p className="text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>}
                  {post.mediaUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
                      {post.mediaType === "image" ? (
                        <img
                          src={post.mediaUrl}
                          alt="Post"
                          className="w-full max-h-96 object-contain"
                        />
                      ) : post.mediaType === "video" ? (
                        <video
                          src={post.mediaUrl}
                          controls
                          className="w-full max-h-96"
                        />
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-sm">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1 ${isLiked(post) ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}
                  >
                    ❤️ {post.likes?.length ?? 0} {t('feed.like')}
                  </button>
                  <span className="text-gray-600 flex items-center gap-1">
                    💬 {post.comments?.length ?? 0} {t('feed.comments')}
                  </span>
                  <button
                    onClick={() => handleShare(post._id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
                  >
                    🔁 {post.shares ?? 0} {t('feed.share')}
                  </button>
                </div>

                {post.comments && post.comments.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-2">
                    {post.comments.map((c) => (
                      <div key={c._id} className="flex gap-2 text-sm">
                        <Link
                          href={`/users/${c.userId?._id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 shrink-0"
                        >
                          {c.userId?.name}:
                        </Link>
                        <span className="text-gray-700">{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {user && (
                  <div className="p-4 border-t border-gray-100 flex gap-2">
                    <Input
                      placeholder={t('feed.addComment')}
                      value={commentTexts[post._id] || ""}
                      onChange={(e) =>
                        setCommentTexts((prev) => ({ ...prev, [post._id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleComment(post._id);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleComment(post._id)}>
                      {t('feed.comment')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </Mainlayout>
  );
}
