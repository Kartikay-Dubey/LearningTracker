import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Download, 
  Upload,
  Edit,
  Save,
  X,
  Calendar,
  Target,
  Award,
  Clock,
  TrendingUp,
  Trophy,
  Lock,
  Unlock,
  Star,
  Zap,
  Flame
} from "lucide-react";
import { useStore } from "../stores/useStore";
import toast from "react-hot-toast";
import AchievementCard from "../components/features/achievements/AchievementCard";
import AchievementModal from "../components/features/achievements/AchievementModal";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import type { Achievement } from "../stores/useStore";

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    bio: "Passionate learner focused on web development and design.",
    timezone: "UTC-5",
    notifications: {
      email: true,
      push: true,
      weekly: false
    }
  });

  const goals = useStore((state) => state.goals);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const achievements = useStore((state) => state.achievements);
  const userStats = useStore((state) => state.userStats);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (!data.session?.user) {
        navigate("/auth");
      }
    };
    getUser();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const fetchOrCreateProfile = async () => {
        setLoading(true);
        // Try to fetch the profile
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // Handle error (not found is OK, other errors should be shown)
          console.error("Error fetching profile:", error);
          setLoading(false);
          return;
        }

        if (!data) {
          // Create profile if it doesn't exist
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || "",
                avatar_url: user.user_metadata?.avatar_url || "",
                xp: 0,
                level: 1,
                current_streak: 0,
                longest_streak: 0,
                achievements: [],
                last_active: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            setProfile(newProfile);
            setNewName(newProfile.full_name || "");
            setProfileData(prev => ({
              ...prev,
              bio: newProfile.bio || "",
            }));
          }
        } else {
          setProfile(data);
          setNewName(data.full_name || "");
          setProfileData(prev => ({
            ...prev,
            bio: data.bio || "",
          }));
        }
        setLoading(false);
      };
      fetchOrCreateProfile();
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAvatar(e.target.files[0]);
    }
  };

  const handleSaveProfile = async () => {
    let avatarUrl = profile?.avatar_url;

    if (newAvatar) {
      // Upload to Supabase Storage
      const fileExt = newAvatar.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, newAvatar, { upsert: true });

      if (!error) {
        // Get the public URL
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        avatarUrl = data.publicUrl;
      } else {
        toast.error("Failed to upload avatar.");
      }
    }

    // Update profile in Supabase
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        full_name: newName, 
        avatar_url: avatarUrl,
        bio: profileData.bio
      })
      .eq("id", user.id);

    if (updateError) {
      toast.error("Failed to update profile.");
      return;
    }

    // Refetch profile
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(updatedProfile);
    setIsEditing(false);
    setNewAvatar(null);
    toast.success('Profile updated successfully!');
  };

  const stats = {
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.status === 'Completed').length,
    inProgressGoals: goals.filter(g => g.status === 'In Progress').length,
    averageProgress: goals.length > 0 
      ? Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length)
      : 0
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const exportData = () => {
    const dataStr = JSON.stringify(goals, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'learning-goals.json';
    link.click();
    toast.success('Data exported successfully!');
  };

  if (loading) {
    return <div className="text-center py-20">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your account and preferences</p>
            </div>
            <div className="flex space-x-3">
              <motion.button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
              </motion.button>
              {isEditing && (
                <motion.button
                  onClick={handleSaveProfile}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div 
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
                {isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-input"
                    />
                    <label htmlFor="avatar-input" className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer shadow">
                      <Upload className="w-5 h-5 text-blue-600" />
                    </label>
                  </>
                )}
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-xl"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {profile?.full_name || "No Name"}
                  </h2>
                )}
                <p className="text-gray-600 dark:text-gray-300">{profile?.email}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-600">{profile?.xp ?? 0} XP</span>
                  <span className="font-semibold text-purple-600">Level {profile?.level ?? 1}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">{profileData.bio}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learning Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Total Goals</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalGoals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
                </div>
                <span className="text-lg font-bold text-green-600">{stats.completedGoals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">In Progress</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{stats.inProgressGoals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Avg Progress</span>
                </div>
                <span className="text-lg font-bold text-purple-600">{stats.averageProgress}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Total XP</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{userStats.totalXP}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Settings Section */}
        <motion.div 
          className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profileData.notifications.email}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Email notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profileData.notifications.push}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Push notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={profileData.notifications.weekly}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, weekly: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Weekly reports</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Preferences</span>
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Dark mode</span>
                  </label>
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    onClick={exportData}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Export Data</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievements Section */}
        <motion.div 
          className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
            Achievements
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.slice(0, 8).map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onClick={() => {
                  setSelectedAchievement(achievement);
                  setShowAchievementModal(true);
                }}
              />
            ))}
          </div>
          
          {achievements.length > 8 && (
            <div className="text-center mt-4">
              <button className="text-blue-600 dark:text-blue-400 hover:underline">
                View All Achievements ({achievements.length})
              </button>
            </div>
          )}
        </motion.div>
      </div>
      <AchievementModal
        achievement={selectedAchievement}
        isOpen={showAchievementModal}
        onClose={() => {
          setShowAchievementModal(false);
          setSelectedAchievement(null);
        }}
      />
    </div>
  );
};

export default ProfilePage;
