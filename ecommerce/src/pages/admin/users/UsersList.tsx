import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../../components/admin/AdminLayout'
import DataTable from '../../../components/admin/DataTable'
import { getAllUsers, updateUserRole, deleteUser, type User } from '../../../services/userService'
import toast from 'react-hot-toast'

const UsersList = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await getAllUsers()
      setUsers(usersData)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, currentRole: string | null) => {
    if (updatingRole) return // Prevent multiple simultaneous updates
    
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return
    }

    try {
      setUpdatingRole(userId)
      await updateUserRole(userId, newRole as 'admin' | 'user')
      toast.success(`User role updated to ${newRole}`)
      
      // Reload users to get updated data
      await loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role')
      console.error(error)
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (deletingUser) return // Prevent multiple simultaneous deletes
    
    if (!window.confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingUser(userId)
      await deleteUser(userId)
      toast.success('User deleted successfully')
      
      // Reload users to get updated data
      await loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
      console.error(error)
    } finally {
      setDeletingUser(null)
    }
  }

  const handleEditUser = (userId: string) => {
    navigate(`/admin/users/${userId}`)
  }

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = !roleFilter || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const columns = [
    {
      header: 'User',
      accessor: (row: User) => (
        <div>
          <p className="font-medium text-gray-900">{row.name || 'No name'}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (row: User) => (
        <button
          onClick={() => handleRoleChange(row.id, row.role || 'user')}
          disabled={updatingRole === row.id}
          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full transition-all ${
            row.role === 'admin'
              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          } ${updatingRole === row.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={`Click to change role to ${row.role === 'admin' ? 'user' : 'admin'}`}
        >
          {updatingRole === row.id ? 'Updating...' : row.role === 'admin' ? 'Admin' : 'User'}
        </button>
      ),
    },
    {
      header: 'Joined',
      accessor: (row: User) => (
        <span className="text-sm text-gray-600">
          {new Date(row.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      ),
    },
    {
      header: 'Last Sign In',
      accessor: (row: User) => (
        <span className="text-sm text-gray-600">
          {row.last_sign_in_at
            ? new Date(row.last_sign_in_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'Never'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEditUser(row.id)
            }}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Edit user"
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteUser(row.id, row.email)
            }}
            disabled={deletingUser === row.id}
            className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete user"
          >
            {deletingUser === row.id ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </>
            )}
          </button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage user accounts and roles. Click on a role badge to change it.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length > 0 ? (
          <>
            <DataTable columns={columns} data={filteredUsers} />
            
            {/* Info Message */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Click on a role badge (Admin/User) to change the user's role. 
                Changes take effect immediately, but users may need to log out and log back in.
              </p>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No users found matching your search criteria.</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Admins</p>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Regular Users</p>
            <p className="text-2xl font-bold text-gray-600">
              {users.filter(u => u.role !== 'admin').length}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default UsersList
