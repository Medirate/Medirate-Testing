"use client";

import { useState, useEffect } from "react";
import { Camera, Mail, User } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
// import SubscriptionTermsModal from '@/app/components/SubscriptionTermsModal';
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const auth = useRequireAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);



  // ✅ Fetch user profile when the page loads
  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading && auth.userEmail) {
      fetchUserProfile(auth.userEmail);
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.userEmail]);

  // ✅ Fetch user profile from API endpoint
  const fetchUserProfile = async (userEmail: string | null) => {
    if (!userEmail) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/user/profile?email=${encodeURIComponent(userEmail)}`);
      const result = await response.json();

      if (!response.ok) {
        console.error("Error fetching user profile:", result.error);
        return;
      }

      const data = result.data;
      setFirstName(data.FirstName || "");
      setLastName(data.LastName || "");
      setEmail(data.Email || "");
      setProfilePicture(data.Picture || null);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle profile updates
  const updateProfile = async () => {
    if (!auth.userEmail) return;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: auth.userEmail,
          FirstName: firstName,
          LastName: lastName,
          Picture: profilePicture
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error updating profile:", result.error);
        alert("Failed to update profile");
      } else {
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  // ✅ Handle Image Upload to Supabase
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      alert("Please select an image file.");
      return;
    }

    const file = event.target.files[0];
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file (JPG, PNG, etc.).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("File size must be less than 5MB.");
      return;
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = `profile_${timestamp}.${fileExt}`;
    const filePath = `profile_pictures/${fileName}`;

    try {
      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile_pictures")
        .upload(filePath, file, {
          contentType: file.type
        });

      if (uploadError) {
        alert(`Failed to upload image: ${uploadError.message}`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile_pictures")
        .getPublicUrl(filePath);

      // Update local state
      setProfilePicture(urlData.publicUrl);
      alert("Profile picture uploaded successfully!");
      
      // Update the database with new picture URL
      if (auth.userEmail) {
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: auth.userEmail,
            FirstName: firstName,
            LastName: lastName,
            Picture: urlData.publicUrl
          })
        });
      }

    } catch (err) {
      alert("An error occurred during upload.");
    }
  };

  return (
    <>
              <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-8 text-center">
        Profile
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Profile Picture Upload */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold text-[#012C61] mb-4">Your Photo</h2>
          <div className="relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-32 h-32 rounded-full object-cover" />
            ) : (
              <span className="text-gray-500 text-2xl font-bold">
                {`${firstName.charAt(0)}${lastName.charAt(0)}`}
              </span>
            )}
            <label htmlFor="file-upload" className="absolute bottom-0 right-0 bg-[#012C61] text-white rounded-full p-2 hover:bg-blue-800 cursor-pointer">
              <Camera className="w-5 h-5" />
              <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        {/* Personal Information */}
        <div className="col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#012C61] mb-4">Personal Information</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#012C61]"></div>
            </div>
          ) : (
            <form className="space-y-6">
              <div className="flex flex-col">
                <label className="text-gray-700 font-semibold">First Name</label>
                <div className="flex items-center space-x-4">
                  <User className="w-5 h-5 text-gray-400" />
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="flex-grow px-4 py-2 border rounded-md focus:ring-[#012C61] focus:border-[#012C61]" />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-700 font-semibold">Last Name</label>
                <div className="flex items-center space-x-4">
                  <User className="w-5 h-5 text-gray-400" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="flex-grow px-4 py-2 border rounded-md focus:ring-[#012C61] focus:border-[#012C61]" />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-700 font-semibold">Email</label>
                <div className="flex items-center space-x-4">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <input type="email" value={email} readOnly className="flex-grow px-4 py-2 border rounded-md bg-gray-100 cursor-not-allowed" />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">Cancel</button>
                <button type="button" onClick={updateProfile} className="px-4 py-2 bg-[#012C61] text-white rounded-lg hover:bg-blue-800">Save Changes</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Terms and Conditions moved to Settings page */}
    </>
  );
}
