import React, { useEffect, useState } from "react";
import { useUserPreferencesStore } from "@/store/useUserPreferencesStore";
import { X } from "lucide-react";

export const PreferencesModal: React.FC = () => {
  const { 
    preferences, 
    savePreferences, 
    showOnboarding, 
    isSettingsOpen, 
    setIsSettingsOpen 
  } = useUserPreferencesStore();

  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sync state when preferences are loaded or modal is opened
  useEffect(() => {
    if (!preferences) return;
    const timer = setTimeout(() => {
      setTeacherName(preferences.teacherName);
      setSchoolName(preferences.schoolName);
      setSchoolAddress(preferences.schoolAddress);
    }, 0);
    return () => clearTimeout(timer);
  }, [preferences, isSettingsOpen]);

  // The modal is visible if onboarding is required, or if the user manually opened settings
  const isVisible = showOnboarding || isSettingsOpen;
  if (!isVisible) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !teacherName.trim() ||
      !schoolName.trim() ||
      !schoolAddress.trim()
    ) {
      setError("Please fill out all fields.");
      return;
    }

    savePreferences({
      teacherName: teacherName.trim(),
      schoolName: schoolName.trim(),
      schoolAddress: schoolAddress.trim(),
    });
    setError(null);
    setIsSettingsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] no-print">
      <div 
         className="w-full max-w-[420px] bg-white rounded-[24px] border border-black/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] mx-4 text-left relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button (only shown in manual settings mode, hidden during forced onboarding) */}
        {!showOnboarding && (
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="absolute top-4 right-4 text-[#8E8E93] hover:text-[#303030] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="space-y-4">
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-[#303030]">
              {showOnboarding ? "Welcome to Vedam AI" : "Teacher Profile Settings"}
            </h2>
            <p className="text-[14px] text-[#5e5e5e]/80 mt-1">
              {showOnboarding 
                ? "Configure your school profile to personalize generated question papers and PDFs."
                : "Update your profile details below to dynamically refresh all headers and reports."}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Teacher Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="teacher-name" className="text-[14px] font-bold text-[#303030]">
                Teacher Name
              </label>
              <input
                id="teacher-name"
                type="text"
                placeholder="e.g., Prof. Sarah Jenkins"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-black/10 text-[15px] outline-none focus:border-black/25 transition-standard bg-white text-black"
                required
                autoComplete="off"
              />
            </div>

            {/* School Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="school-name" className="text-[14px] font-bold text-[#303030]">
                School/Academy Name
              </label>
              <input
                id="school-name"
                type="text"
                placeholder="e.g., Westwood High School"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-black/10 text-[15px] outline-none focus:border-black/25 transition-standard bg-white text-black"
                required
                autoComplete="off"
              />
            </div>

            {/* School Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="school-address" className="text-[14px] font-bold text-[#303030]">
                School Address / City
              </label>
              <input
                id="school-address"
                type="text"
                placeholder="e.g., Sector-4, Bokaro"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-black/10 text-[15px] outline-none focus:border-black/25 transition-standard bg-white text-black"
                required
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-[13px] font-medium text-[#c53535]">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center rounded-full bg-[#181818] hover:bg-neutral-800 text-white text-[15px] font-bold tracking-tight transition-standard cursor-pointer border-none"
            >
              Save Details
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
