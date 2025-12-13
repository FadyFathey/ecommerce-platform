import { NavBar } from '../../components/NavBar'
import Banner from '../../components/banner'

const Profile = () => {
  return (
    <div>
      <Banner />
      <NavBar />
      <div className="min-h-screen bg-[#f2f0f1] pt-[102px] md:pt-[118px] pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">My Profile</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage your account information and preferences</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e5e5] p-6 md:p-8 mb-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-gray-200">
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-black flex items-center justify-center text-white text-3xl md:text-4xl font-bold">
                  JD
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity border-2 border-white">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">John Doe</h2>
                <p className="text-gray-600 text-sm md:text-base mb-1">john.doe@example.com</p>
                <p className="text-gray-600 text-sm md:text-base mb-1">+1 (555) 123-4567</p>
                <p className="text-gray-400 text-xs md:text-sm">User ID: 12345678...</p>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-black mb-4">Account Information</h3>
                <div className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Full Name</label>
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Email Address</label>
                    <input
                      type="email"
                      defaultValue="john.doe@example.com"
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
                    />
                  </div>

                  {/* Mobile Number Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Mobile Number</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
                    />
                  </div>

                  {/* User ID Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">User ID</label>
                    <div className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm bg-gray-50 text-gray-700 font-mono">
                      12345678-1234-1234-1234-123456789abc
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 bg-black text-white rounded-lg py-3 px-6 font-semibold hover:opacity-90 transition-opacity text-sm md:text-base">
                    Edit Profile
                  </button>
                  <button className="flex-1 border border-black text-black rounded-lg py-3 px-6 font-semibold hover:bg-black hover:text-white transition-colors text-sm md:text-base">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e5e5] p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-black">My Orders</h3>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm md:text-base mb-4">View and track your orders</p>
            <button className="text-black hover:opacity-80 transition-opacity text-sm md:text-base font-medium">
              View All Orders →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile