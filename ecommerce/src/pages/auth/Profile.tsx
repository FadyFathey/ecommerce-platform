import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../../components/NavBar'
import Banner from '../../components/banner'
import type { RootState } from '../../store'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { updateUser, checkUserLogin } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'

const Profile = () => {
  const navigate = useNavigate()
  const { loading: profileLoading } = useAppSelector((state: RootState) => state.auth)
  const dispatch = useAppDispatch()
  const userSession = useAppSelector((state: RootState) => state.auth.session)
  const [name, setName] = useState(userSession?.user?.user_metadata?.name || "")
  const [email, setEmail] = useState(userSession?.user?.email || "")
  const [phone, setPhone] = useState(userSession?.user?.user_metadata?.phone || "")
  const [userId, setUserId] = useState(userSession?.user?.id || "")
  const [profileLoadingState, setProfileLoadingState] = useState(false)

  // Sync state when userSession loads or changes
  useEffect(() => {
    if (userSession?.user) {
      setName(userSession.user.user_metadata?.name || "")
      setEmail(userSession.user.email || "")
      setPhone(userSession.user.user_metadata?.phone || "")
      setUserId(userSession.user.id || "")
    }
  }, [userSession])
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
                  {(name || userSession?.user?.user_metadata?.name || "U").charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity border-2 border-white">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">{name || userSession?.user?.user_metadata?.name || "No name"}</h2>
                <p className="text-gray-600 text-sm md:text-base mb-1">{email || userSession?.user?.email || "No email"}</p>
                <p className="text-gray-600 text-sm md:text-base mb-1">{phone || userSession?.user?.user_metadata?.phone || "No phone number"}</p>
                <p className="text-gray-400 text-xs md:text-sm">User ID: {userId || userSession?.user?.id || "No user id"}</p>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-black mb-4">Account Information</h3>
                <div className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Mobile Number Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">Mobile Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
                    />
                  </div>

                  {/* User ID Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-800">User ID</label>
                    <div className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm bg-gray-50 text-gray-700 font-mono">
                      {userId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 bg-black text-white rounded-lg py-3 px-6 font-semibold hover:opacity-90 transition-opacity text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed" onClick={async () => {
                    setProfileLoadingState(true)
                    try {
                      const resultAction = await dispatch(updateUser({ name, phone }))
                      if (updateUser.fulfilled.match(resultAction)) {
                        // Refresh session to get updated metadata
                        await dispatch(checkUserLogin())
                        toast.success("Profile updated successfully")
                        setProfileLoadingState(false)
                      } else {
                        toast.error(resultAction.payload as string)
                        setProfileLoadingState(false)
                      }
                    } catch (error) {
                      toast.error(error as string)
                      setProfileLoadingState(false)
                    }
                  }} disabled={profileLoadingState || profileLoading}>
                    {profileLoadingState ? "Updating..." : "Edit Profile"}
                  </button>
                  <button className="flex-1 border border-black text-black rounded-lg py-3 px-6 font-semibold hover:bg-black hover:text-white transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => navigate("/reset-password")} disabled={profileLoadingState || profileLoading}>
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile