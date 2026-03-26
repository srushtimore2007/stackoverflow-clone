import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import Mainlayout from "../../../layout/Mainlayout";
import { useAuth } from "../../../lib/AuthContext";
import axiosInstance from "../../../lib/axiosinstance";
import { Award, Calendar, Coins, Edit, Plus, Search, Send, X, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/firebase";

const index = () => {
  const { user, rewards } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  // ========================= ALL HOOKS AT TOP =========================
  const [users, setusers] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const [pointsSummary, setPointsSummary] = useState<{ points: number; badges: string[] } | null>(null);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientResults, setRecipientResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [transferPoints, setTransferPoints] = useState<string>("");
  const [transferring, setTransferring] = useState(false);
  interface EditFormType {
  name: string;
  about: string;
  tags: string[];
}

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormType>({
  name: "",
  about: "",
  tags: [], // always empty array initially
});
  const [newTag, setNewTag] = useState("");

  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const confirmationResultRef = useRef<any | null>(null);

  const [isFriend, setIsFriend] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);

  const currentUserId = user?._id;
  const isOwnProfile = id === currentUserId;

  // ========================= EARLY RETURN =========================
  if (!user) return null;

  // ========================= FETCH USER DATA =========================
  useEffect(() => {
    const fetchuser = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const res = await axiosInstance.get(`/api/auth/user/${id}`);
        setusers(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setloading(false);
      }
    };
    fetchuser();
  }, [id]);

  // ========================= UPDATE FORM & PHONE ON USER FETCH =========================
  useEffect(() => {
  if (users) {
    setEditForm({
      name: users.name || "",
      about: users.about || "",
      tags: Array.isArray(users.tags) ? users.tags : [],
    });
   }
  }, [users]);


  // ========================= FETCH REWARDS =========================
  useEffect(() => {
    const fetchRewards = async () => {
      if (!id || typeof id !== "string") return;
      setRewardsLoading(true);
      try {
        const res = await axiosInstance.get(`/api/points/user/${id}`);
        if (res.data?.success) {
          setPointsSummary(res.data.data);
        }

        if (user?._id && String(id) === String(user._id)) {
          const historyRes = await axiosInstance.get(`/api/points/history`);
          if (historyRes.data?.success) {
            setPointsHistory(historyRes.data.data?.transactionHistory || []);
            setPointsSummary({
              points: historyRes.data.data?.points ?? res.data.data?.points ?? 0,
              badges: historyRes.data.data?.badges ?? res.data.data?.badges ?? [],
            });
          }
        } else {
          setPointsHistory([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setRewardsLoading(false);
      }
    };
    fetchRewards();
  }, [id, user?._id]);

  // ========================= RESEND OTP TIMER =========================
  useEffect(() => {
    if (!otpSent || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSent, resendCooldown]);

  // ========================= FRIEND STATUS =========================
  useEffect(() => {
    if (!users || !currentUserId || typeof id !== "string") return;
    const friendIds =
      users.friends?.map((f: any) =>
        typeof f === "object" ? f?._id?.toString?.() : f?.toString?.()
      ) || [];
    const curr = currentUserId.toString?.() || currentUserId;
    setIsFriend(friendIds.includes(curr));
  }, [users, currentUserId, id]);

  // ========================= RECIPIENT SEARCH =========================
  useEffect(() => {
    if (!isOwnProfile) return;
    const q = recipientQuery.trim();
    if (!q) {
      setRecipientResults([]);
      setSelectedRecipient(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/api/auth/search?query=${encodeURIComponent(q)}`);
        const results = res.data?.data || [];
        const filtered = results.filter((u: any) => String(u._id) !== String(user?._id));
        setRecipientResults(filtered.slice(0, 8));
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [recipientQuery, isOwnProfile, user?._id]);

  // ========================= LOADING CHECK =========================
  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }

  if (!users) {
    return <div className="text-center text-gray-500 mt-4">No user found.</div>;
  }

  // ========================= HANDLERS =========================
  const handleAddFriend = async () => {
    if (!user || !id || typeof id !== "string") return;
    setAddingFriend(true);
    try {
      await axiosInstance.post("/api/auth/add-friend", { friendId: id });
      setIsFriend(true);
      toast.success("Friend added!");
      const res = await axiosInstance.get(`/api/auth/user/${id}`);
      setusers(res.data.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
      toast.error(msg || "Failed to add friend");
    } finally {
      setAddingFriend(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await axiosInstance.patch(`/api/auth/update/${user?._id}`, { editForm });
      if (res.data.data) {
        const updatedUser = { ...users, ...editForm };
        setusers(updatedUser);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const handleAddTag = () => {
  const trimmedTag = newTag.trim();
  if (trimmedTag && !editForm.tags.includes(trimmedTag)) {
    setEditForm({ ...editForm, tags: [...editForm.tags, trimmedTag] });
    setNewTag("");
  }
};


  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm({ ...editForm, tags: editForm.tags.filter((tag) => tag !== tagToRemove) });
  };

  const setupRecaptchaVerifier = () => {
    if (typeof window === "undefined") return null;
    const w = window as any;
    if (!w.recaptchaVerifier) {
      w.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    }
    return w.recaptchaVerifier;
  };

  const handleSendPhoneOtp = async () => {
    if (!isOwnProfile) return;
    const phone = phoneInput.trim();
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    try {
      setIsSendingOtp(true);
      const appVerifier = setupRecaptchaVerifier();
      if (!appVerifier) {
        toast.error("reCAPTCHA is not ready. Please refresh the page.");
        return;
      }
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      confirmationResultRef.current = confirmationResult;
      setOtpSent(true);
      setResendCooldown(30);
      toast.success("OTP sent to your phone");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

const handleVerifyPhoneOtp = async () => {
  if (!isOwnProfile) return;
  if (!otpInput || otpInput.length !== 6) {
    toast.error("Please enter a valid 6-digit OTP");
    return;
  }
  if (!confirmationResultRef.current) {
    toast.error("No OTP session found. Please request a new OTP.");
    return;
  }

  try {
    setIsVerifyingOtp(true);
    await confirmationResultRef.current.confirm(otpInput);

    // THIS LINE: update phone number in backend
    const res = await axiosInstance.post("/api/auth/update-phone", {
      phoneNumber: phoneInput.trim()
    });

    if (res.data?.success) {
      setPhoneVerified(true);
      setusers((prev: any) =>
        prev
          ? {
              ...prev,
              phoneNumber: res.data.data?.phoneNumber ?? phoneInput.trim(),
              isPhoneVerified: true,
            }
          : prev
      );
      toast.success("Phone number verified successfully");
    } else {
      toast.error(res.data?.message || "Failed to update phone number");
    }
  } catch (error: any) {
    console.error("[handleVerifyPhoneOtp]", error);
    const code = error?.code || "";
    const message =
      code === "auth/invalid-verification-code"
        ? "Invalid OTP. Please try again."
        : code === "auth/code-expired"
        ? "OTP has expired. Please request a new one."
        : error?.message || "OTP verification failed";
    toast.error(message);
  } finally {
    setIsVerifyingOtp(false);
  }
};


  const handleTransferPoints = async () => {
    if (!selectedRecipient?._id) {
      toast.error("Please select a recipient");
      return;
    }
    const amount = Number(transferPoints);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
      toast.error("Please enter a valid points amount");
      return;
    }
    setTransferring(true);
    try {
      const res = await axiosInstance.post(`/api/points/transfer`, {
        recipientId: selectedRecipient._id,
        points: amount,
      });
      toast.success(res.data?.message || "Points transferred");
      setTransferPoints("");
      setRecipientQuery("");
      setSelectedRecipient(null);
      setRecipientResults([]);
      if (user?._id) {
        const historyRes = await axiosInstance.get(`/api/points/history`);
        if (historyRes.data?.success) {
          setPointsHistory(historyRes.data.data?.transactionHistory || []);
          setPointsSummary({
            points: historyRes.data.data?.points ?? 0,
            badges: historyRes.data.data?.badges ?? [],
          });
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  // ========================= JSX =========================
  return (
<Mainlayout>
      <div className="max-w-6xl">
        {/* User Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-8">
          <Avatar className="w-24 h-24 lg:w-32 lg:h-32">
            <AvatarFallback className="text-2xl lg:text-3xl">
              {users.name
                .split(" ")
                .map((n: any) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
                  {users.name}
                </h1>
              </div>

              {!isOwnProfile && user && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleAddFriend}
                  disabled={addingFriend || isFriend}
                >
                  <Plus className="w-4 h-4" />
                  {addingFriend ? "Adding..." : isFriend ? "Friends" : "Add Friend"}
                </Button>
              )}
              {isOwnProfile && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Your display name"
                            />
                          </div>
                        </div>
                      </div>
                      {/* About Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">About</h3>
                        <div>
                          <Label htmlFor="about">About Me</Label>
                          <Textarea
                            id="about"
                            value={editForm.about}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                about: e.target.value,
                              })
                            }
                            placeholder="Tell us about yourself, your experience, and interests..."
                            className="min-h-32"
                          />
                        </div>
                      </div>

                      {/* Tags/Skills Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Skills & Technologies
                        </h3>

                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add a skill or technology"
                              onKeyPress={(e) =>
                                e.key === "Enter" && handleAddTag()
                              }
                            />
                            <Button
                              onClick={handleAddTag}
                              variant="outline"
                              size="sm"
                              className="bg-orange-600 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {editForm.tags.map((tag: any) => {
                              return (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="bg-orange-100 text-orange-800 flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="bg-white text-gray-800 hover:text-gray-900"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Member since{" "}
                {new Date(users.joinDate).toISOString().split("T")[0]}
              </div>
            </div>
            <div className="flex flex-wrap items-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="font-semibold">5</span>
                <span className="text-gray-600 ml-1">gold badges</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span className="font-semibold">23</span>
                <span className="text-gray-600 ml-1">silver badges</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-600 rounded-full mr-2"></div>
                <span className="font-semibold">45</span>
                <span className="text-gray-600 ml-1">bronze badges</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-600" />
                Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rewardsLoading ? (
                <div className="text-sm text-gray-600">Loading rewards...</div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-600" />
                      <span className="text-2xl font-bold text-gray-900">
                        {isOwnProfile
                          ? rewards?.points ?? pointsSummary?.points ?? 0
                          : pointsSummary?.points ?? 0}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">points</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      (isOwnProfile
                        ? rewards?.badges ?? pointsSummary?.badges
                        : pointsSummary?.badges) || []
                    ).length === 0 ? (
                      <span className="text-sm text-gray-600">No badges yet</span>
                    ) : (
                      (
                        (isOwnProfile
                          ? rewards?.badges ?? pointsSummary?.badges
                          : pointsSummary?.badges) || []
                      ).map((b) => (
                        <Badge
                          key={b}
                          variant="secondary"
                          className="bg-orange-100 text-orange-800"
                        >
                          {b}
                        </Badge>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {isOwnProfile && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Transfer Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="recipient">Recipient</Label>
                    <div className="relative">
                      <Input
                        id="recipient"
                        value={recipientQuery}
                        onChange={(e) => setRecipientQuery(e.target.value)}
                        placeholder="Search by name or email"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                    </div>

                    {recipientResults.length > 0 && !selectedRecipient && (
                      <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-sm max-h-56 overflow-auto">
                        {recipientResults.map((u: any) => (
                          <button
                            key={u._id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                            onClick={() => {
                              setSelectedRecipient(u);
                              setRecipientResults([]);
                              setRecipientQuery(`${u.name} (${u.email})`);
                            }}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {u.name}
                            </div>
                            <div className="text-xs text-gray-600">{u.email}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedRecipient && (
                      <div className="mt-2 text-sm text-gray-700">
                        Selected:{" "}
                        <span className="font-medium">
                          {selectedRecipient.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      value={transferPoints}
                      onChange={(e) => setTransferPoints(e.target.value)}
                      placeholder="Enter points to transfer"
                      inputMode="numeric"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      You must have more than 10 points to transfer.
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleTransferPoints}
                  disabled={transferring}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {transferring ? "Transferring..." : "Transfer"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Transaction history (only for own profile) */}
        {isOwnProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {pointsHistory.length === 0 ? (
                <div className="text-sm text-gray-600">No transactions yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                          Type
                        </th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                          Points
                        </th>
                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">
                          Reference
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointsHistory.slice(0, 30).map((t: any, idx: number) => (
                        <tr
                          key={`${t.date}-${idx}`}
                          className="border-b border-gray-100"
                        >
                          <td className="py-2 px-3 text-sm text-gray-700">
                            {t?.date ? new Date(t.date).toLocaleString() : "-"}
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-700">
                            {t?.type}
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-700">
                            {t?.points}
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-600 font-mono">
                            {t?.referenceId || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1  gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {users.about}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {isOwnProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span>Phone Number Verification</span>
                    {phoneVerified && (
                      <Badge className="bg-green-100 text-green-800 border border-green-300">
                        Verified
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91XXXXXXXXXX"
                      disabled={isSendingOtp || isVerifyingOtp}
                    />
                    <p className="text-xs text-gray-500">
                      Use international format (e.g., +91XXXXXXXXXX). OTP will be sent via SMS.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={isSendingOtp || (!phoneInput && !phoneInput.trim())}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSendingOtp ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
                    </Button>
                    {otpSent && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendPhoneOtp}
                        disabled={isSendingOtp || resendCooldown > 0}
                      >
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend OTP"}
                      </Button>
                    )}
                  </div>

                  {otpSent && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <div className="flex gap-2">
                        <Input
                          id="otp"
                          value={otpInput}
                          onChange={(e) =>
                            setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          placeholder="000000"
                          maxLength={6}
                          disabled={isVerifyingOtp}
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyPhoneOtp}
                          disabled={isVerifyingOtp || otpInput.length !== 6}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isVerifyingOtp ? "Verifying..." : "Verify"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {users.friends && users.friends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Friends ({users.friends.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {users.friends.map((f: any) => (
                      <Link
                        key={f._id}
                        href={`/users/${f._id}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {f.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{f.name}</span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {users.tags && users.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.tags.map((tag: string) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                        >
                          {tag}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </div>
    </Mainlayout>
  );
};

export default index;
