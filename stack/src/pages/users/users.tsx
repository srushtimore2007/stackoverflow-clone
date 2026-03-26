
// import { Avatar, AvatarFallback } from "../../components/ui/avatar";
// import { Input } from "../../components/ui/input";
// import Mainlayout from "../../layout/Mainlayout";
// import axiosInstance from "../../lib/axiosinstance";
// import { Calendar, Search } from "lucide-react";
// import Link from "next/link";
// import React, { useEffect, useState } from "react";
// const users = [
//   {
//     id: 1,
//     name: "John Doe",
//     username: "johndoe",
//     joinDate: "2019-03-15",
//   },
//   {
//     id: 2,
//     name: "Felix Rodriguez",
//     username: "Felix.leg",
//     joinDate: "2020-07-22",
//   },
//   {
//     id: 3,
//     name: "Alex Smith",
//     username: "Aledi5",
//     joinDate: "2023-11-10",
//   },
//   {
//     id: 4,
//     name: "Sarah Johnson",
//     username: "PR0X",
//     joinDate: "2024-01-05",
//   },
// ];
// const index = () => {
//   const [users, setusers] = useState<any>(null);
//   const [loading, setloading] = useState(true);
//   useEffect(() => {
//     const fetchuser = async () => {
//       try {
//         const res = await axiosInstance.get("/user/getalluser");
//         setusers(res.data.data);
//       } catch (error) {
//         console.log(error);
//       } finally {
//         setloading(false);
//       }
//     };
//     fetchuser();
//   }, []);
//   if (loading) {
//     return (
//       <Mainlayout>
//         <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
//       </Mainlayout>
//     );
//   }
//   if (!users || users.length === 0) {
//     return (
//       <div className="text-center text-gray-500 mt-4">No users found.</div>
//     );
//   }
//   return (
//     <Mainlayout>
//       <div className="max-w-6xl">
//         <h1 className="text-xl lg:text-2xl font-semibold mb-6">Users</h1>

//         <div className="mb-6">
//           <div className="relative max-w-md">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <Input placeholder="Filter by user" className="pl-10" />
//           </div>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {users.map((user: any) => (
//             <Link key={user._id} href={`/users/${user._id}`}>
//               <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
//                 <div className="flex items-center mb-3">
//                   <Avatar className="w-12 h-12 mr-3">
//                     <AvatarFallback className="text-lg">
//                       {user.name
//                         .split(" ")
//                         .map((n: any) => n[0])
//                         .join("")}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div className="min-w-0 flex-1">
//                     <h3 className="font-semibold text-blue-600 hover:text-blue-800 truncate">
//                       {user.name}
//                     </h3>
//                     <p className="text-sm text-gray-600 truncate">
//                       @{user.name}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center text-sm text-gray-600 mb-3">
//                   <Calendar className="w-4 h-4 mr-1" />
//                   <span>Joined {new Date(user.joinDate).getFullYear()}</span>
//                 </div>
//               </div>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </Mainlayout>
//   );
// };

// export default index;

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, Search } from "lucide-react";

import Mainlayout from "../../layout/Mainlayout";
import axiosInstance from "../../lib/axiosinstance";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../lib/AuthContext";
import { toast } from "react-toastify";

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  const fetchUsers = async (query?: string) => {
    setLoading(true);
    try {
      const url = query
        ? `/api/auth/search?query=${encodeURIComponent(query)}`
        : "/api/auth/search";
      const res = await axiosInstance.get(url);
      setUsers(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading) {
    return (
      <Mainlayout>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      </Mainlayout>
    );
  }

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
      toast.error("Log in to add friends");
      return;
    }
    setAddingFriendId(friendId);
    try {
      await axiosInstance.post("/api/auth/add-friend", { friendId });
      toast.success("Friend added!");
      fetchUsers(searchQuery);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
      toast.error(msg || "Failed to add friend");
    } finally {
      setAddingFriendId(null);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-6xl">
        <h1 className="text-xl lg:text-2xl font-semibold mb-6">
          Users — Find friends to post in Public Space
        </h1>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name or email"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-500 mt-6">No users found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((u: any) => (
              <div
                key={u._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
              >
                <Link href={`/users/${u._id}`} className="flex-1 min-w-0">
                  <div className="flex items-center mb-3">
                    <Avatar className="w-12 h-12 mr-3 shrink-0">
                      <AvatarFallback className="text-lg">
                        {u.name?.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-blue-600 truncate hover:text-blue-800">
                        {u.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        @{u.username || u.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      Joined{" "}
                      {u.joinDate
                        ? new Date(u.joinDate).getFullYear()
                        : "—"}
                    </span>
                  </div>
                </Link>
                {currentUser && u._id !== currentUser._id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={(e) => handleAddFriend(u._id, e)}
                    disabled={addingFriendId === u._id || isFriend(u)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {addingFriendId === u._id
                      ? "Adding..."
                      : isFriend(u)
                        ? "Friends"
                        : "Add Friend"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default Users;
