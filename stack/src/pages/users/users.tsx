
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, Calendar, Plus } from "lucide-react";
import Mainlayout from "../../layout/Mainlayout";
import axiosInstance from "../../lib/axiosinstance";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../lib/AuthContext";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export default function UsersPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, user not logged in');
          return;
        }
        
        const res = await axiosInstance.get("/api/auth/current-user");
        console.log('Current user fetched:', res.data);
        setCurrentUser(res.data?.data);
      } catch (error: any) {
        console.error("Failed to fetch current user:", error);
        
        if (error.response?.status === 401) {
          console.log('User not authenticated, clearing token');
          localStorage.removeItem('token');
          // Optionally redirect to login
          // window.location.href = '/auth/login';
        } else if (error.response?.status === 404) {
          console.error('Current user endpoint not found');
        } else {
          console.error('Other error:', error.message);
        }
        
        // Don't set currentUser to null, just leave it undefined
        // This allows the page to function without user-specific features
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch users
  const fetchUsers = async (query: string = "") => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/auth/search?q=${encodeURIComponent(query)}`);
      setUsers(res.data?.data || []);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchQuery);
  }, [searchQuery]);

  const isFriend = (targetUser: any) => {
    if (!currentUser?._id) return false;
    const friendIds = targetUser.friends?.map((f: any) =>
      typeof f === "object" ? f?._id : f
    ) || [];
    return friendIds.includes(currentUser._id);
  };

  const handleAddFriend = async (friendId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      // Check if we have a token but no user data
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please log in to add friends");
      } else {
        toast.error("User data not available. Please refresh the page");
      }
      return;
    }
    
    setAddingFriendId(friendId);
    try {
      await axiosInstance.post("/api/auth/add-friend", { friendId });
      toast.success("Friend added!");
      fetchUsers(searchQuery);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to add friend");
    } finally {
      setAddingFriendId(null);
    }
  };

  if (loading) {
    return (
      <Mainlayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-6xl">
        <h1 className="text-xl lg:text-2xl font-semibold mb-6 flex items-center gap-2">
          <Users className="w-6 h-6" />
          {t('users.title')}
        </h1>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full max-w-md"
            />
          </div>
        </div>
        
        {users.length === 0 ? (
          <div className="text-center text-gray-500 py-12 border border-dashed border-gray-300 rounded-lg">
            {searchQuery ? "No users found." : "No users available."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u: any) => (
              <Link key={u._id} href={`/users/${u._id}`}>
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarFallback className="text-lg">
                        {u.name?.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-blue-600 truncate">
                        {u.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1 shrink-0" />
                        <span>
                          Joined{" "}
                          {u.joinDate
                            ? new Date(u.joinDate).getFullYear()
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {currentUser && u._id !== currentUser._id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={(e) => handleAddFriend(u._id, e)}
                      disabled={addingFriendId === u._id || isFriend(u)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {addingFriendId === u._id ? "Adding..." : isFriend(u) ? "Friends" : "Add Friend"}
                    </Button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Mainlayout>
  );
}
