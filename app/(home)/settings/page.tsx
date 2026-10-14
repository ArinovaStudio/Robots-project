import { User, Bell, ArrowRight } from "lucide-react";
import Link from "next/link";
import ChangePasswordSection from "@/components/settings/change-password-section";

export default function SettingsPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-2">Manage your profile, notifications, and account security.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Link href="/profile" className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Update your personal details, company information, and change your avatar.
          </p>
          <div className="text-sm font-medium text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            Edit Profile <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Notification Settings */}
        <Link href="/notifications" className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Review and manage your Connecto notifications.
          </p>
          <div className="text-sm font-medium text-amber-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            Manage Alerts <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

      </div>

      {/* Change Password — fully functional */}
      <ChangePasswordSection />
    </section>
  );
}
