import { User, Bell, CreditCard, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-2">Manage your account preferences, billing, and security.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Link href="#" className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-200 transition-all">
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
        <Link href="#" className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Control which email alerts and push notifications you receive from Connecto.
          </p>
          <div className="text-sm font-medium text-amber-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            Manage Alerts <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Security Settings */}
        <Link href="#" className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Change your password, enable two-factor authentication, and manage active sessions.
          </p>
          <div className="text-sm font-medium text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            Update Password <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Billing Settings */}
        <Link href="#" className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Billing & Plan</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Upgrade to Connecto Pro, view your payment history, and manage your subscription.
          </p>
          <div className="text-sm font-medium text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            View Subscription <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </section>
  );
}
