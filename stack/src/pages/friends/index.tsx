"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import Mainlayout from "../../layout/Mainlayout";
import axiosInstance from "../../lib/axiosinstance";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { useAuth } from "../../lib/AuthContext";
import { useTranslation } from "react-i18next";
import { ApiResponse } from "../../types/api.types";

export default function FriendsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchFriends = async () => {
      try {
        const res = await axiosInstance.get<ApiResponse<any[]>>("/api/auth/friends");
        setFriends(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [user]);

  if (!user) {
    return (
      <Mainlayout>
        <div className="text-center text-gray-500 py-12">
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Log in
          </Link>{" "}
          to see your friends.
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-4xl">
        <h1 className="text-xl lg:text-2xl font-semibold mb-6 flex items-center gap-2">
          <Users className="w-6 h-6" />
          {t('friends.title', { count: friends.length })}
        </h1>
        
        <p className="text-gray-600 mb-6">
          Add friends from the Users page to unlock posting in Public Space.
          <Link href="/users/users" className="text-blue-600 hover:underline ml-1">
            Find users
          </Link>
          {" "}to add as friends.
        </p>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center text-gray-500 py-12 border border-dashed border-gray-300 rounded-lg">
            No friends yet.{" "}
            <Link href="/users/users" className="text-blue-600 hover:underline">
              Find users
            </Link>{" "}
            to add as friends.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((f: any) => (
              <Link key={f._id} href={`/users/${f._id}`}>
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarFallback className="text-lg">
                        {f.name?.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-blue-600 truncate">
                        {f.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1 shrink-0" />
                        <span>
                          Joined{" "}
                          {f.joinDate
                            ? new Date(f.joinDate).getFullYear()
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Mainlayout>
  );
}
