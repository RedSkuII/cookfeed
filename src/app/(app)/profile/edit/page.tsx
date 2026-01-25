"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load existing profile data from localStorage or session
    const savedProfile = JSON.parse(localStorage.getItem("cookfeed_profile") || "{}");
    setName(savedProfile.name || session?.user?.name || "");
    setBio(savedProfile.bio || "");
    setProfileImage(savedProfile.profileImage || null);
  }, [session]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 2MB for localStorage)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Please choose an image under 2MB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Save profile to localStorage (temporary until database is set up)
    const profile = {
      name,
      bio,
      email: session?.user?.email,
      image: session?.user?.image,
      profileImage: profileImage, // Custom uploaded image
    };
    localStorage.setItem("cookfeed_profile", JSON.stringify(profile));
    
    setIsSaving(false);
    router.push("/profile");
  };

  return (
    <main className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/profile" className="flex items-center text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="text-primary-500 font-semibold disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-linear-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center overflow-hidden mb-3">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : session?.user?.image ? (
              <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-white font-bold">
                {name?.charAt(0) || session?.user?.name?.charAt(0) || "?"}
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-primary-500 font-medium"
          >
            Change Photo
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="input-field"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={session?.user?.email || ""}
            disabled
            className="input-field bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about yourself..."
            className="input-field min-h-24 resize-none"
            rows={4}
          />
        </div>
      </div>
    </main>
  );
}
