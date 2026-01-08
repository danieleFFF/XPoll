import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getCurrentUser, getUserProfile, updateUsername, changePassword } from '../services/AuthService'

//User profile page with username editing and password change.
function Profile() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    //Username editing state.
    const [isEditingUsername, setIsEditingUsername] = useState(false)
    const [newUsername, setNewUsername] = useState('')
    const [usernameLoading, setUsernameLoading] = useState(false)
    //Password change state
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)

    useEffect(() => {
        const loadProfile = async () => {
            const currentUser = getCurrentUser()
            if (!currentUser) {
                navigate('/login')

                return
            }

            try {
                const profile = await getUserProfile()
                setUser(profile)
                setNewUsername(profile.username || '')
            } catch (err) {
                setError('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [navigate])

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) {
            setError('Username cannot be empty')

            return
        }
        setUsernameLoading(true)
        setError('')
        setSuccess('')

        try {
            const updated = await updateUsername(newUsername)
            setUser(prev => ({ ...prev, username: updated.username }))
            setIsEditingUsername(false)
            setSuccess('Username updated successfully')
        } catch (err) {
            setError(err.message)
        } finally {
            setUsernameLoading(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')

            return
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')

            return
        }

        setPasswordLoading(true)
        setError('')
        setSuccess('')

        try {
            await changePassword(currentPassword, newPassword)
            setShowPasswordForm(false)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setSuccess('Password changed successfully')
        } catch (err) {
            setError(err.message)
        } finally {
            setPasswordLoading(false)
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatAccessMode = (mode) => {
        if (mode === 'LOCAL') return 'Local Account'
        if(mode === 'GOOGLE') return 'Google Account'
        return mode
    }

    if(loading){
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="flex items-center justify-center py-20">
                    <div className="text-primary-container">Loading profile...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-[800px] mx-auto px-5 py-10">
                <h1 className="text-3xl font-bold text-on-primary mb-8">Profile</h1>

                {/* Messages  */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                { /* Profile Card*/}
                <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)]">
                    { /* Username */ }
                    <div className="mb-6 pb-6 border-b border-primary-container/30">
                        <label className="block text-sm text-primary-container mb-2">Username</label>
                        {isEditingUsername ? (
                            <div className="flex gap-3">
                                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                                    className="flex-1 py-2 px-4 rounded-btn bg-background border-2 border-primary-container text-on-primary focus:border-primary outline-none"/>
                                <button onClick={handleUpdateUsername} disabled={usernameLoading}
                                    className="py-2 px-4 rounded-btn bg-primary text-on-primary font-medium hover:bg-[#527d91] transition-colors disabled:opacity-50">
                                    {usernameLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => {setIsEditingUsername(false)
                                    setNewUsername(user?.username || '')}}
                                    className="py-2 px-4 rounded-btn border-2 border-primary-container text-on-primary hover:border-primary transition-colors">
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <span className="text-xl text-on-primary">{user?.username || 'Not set'}</span>
                                <button onClick={() => setIsEditingUsername(true)} className="text-primary hover:text-primary/80 text-sm flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>

                    { /*Email (read only)*/ }
                    <div className="mb-6 pb-6 border-b border-primary-container/30">
                        <label className="block text-sm text-primary-container mb-2">Email</label>
                        <span className="text-lg text-on-primary">{user?.email}</span>
                    </div>

                    { /*Access Mode (read only)*/ }
                    <div className="mb-6 pb-6 border-b border-primary-container/30">
                        <label className="block text-sm text-primary-container mb-2">Account Type</label>
                        <div className="flex items-center gap-2">
                            {user?.accessMode === 'GOOGLE' ? (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                            <span className="text-lg text-on-primary">{formatAccessMode(user?.accessMode)}</span>
                        </div>
                    </div>

                    { /* Registration Date (read only) */ }
                    <div className="mb-6">
                        <label className="block text-sm text-primary-container mb-2">Member Since</label>
                        <span className="text-lg text-on-primary">{formatDate(user?.registrationDate)}</span>
                    </div>

                    { /*Password Change Section (local users only)*/}
                    {user?.accessMode === 'LOCAL' && (
                        <div className="mt-8 pt-6 border-t border-primary-container/30">
                            <h3 className="text-lg font-semibold text-on-primary mb-4">Security</h3>
                            {!showPasswordForm ? (
                                <button
                                    onClick={() => setShowPasswordForm(true)}
                                    className="flex items-center gap-2 text-primary hover:text-primary/80">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    Change Password
                                </button>
                            ) : (
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-primary-container mb-2">Current Password</label>
                                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full py-2 px-4 rounded-btn bg-background border-2 border-primary-container text-on-primary focus:border-primary outline-none"
                                            required />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-primary-container mb-2">New Password</label>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full py-2 px-4 rounded-btn bg-background border-2 border-primary-container text-on-primary focus:border-primary outline-none"
                                            required minLength={6} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-primary-container mb-2">Confirm New Password</label>
                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full py-2 px-4 rounded-btn bg-background border-2 border-primary-container text-on-primary focus:border-primary outline-none"
                                            required/>
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="submit" disabled={passwordLoading} className="py-2 px-4 rounded-btn bg-primary text-on-primary font-medium hover:bg-[#527d91] transition-colors disabled:opacity-50">
                                            {passwordLoading ? 'Changing...' : 'Change Password'}
                                        </button>
                                        <button type="button"
                                            onClick={() => {
                                                setShowPasswordForm(false)
                                                setCurrentPassword('')
                                                setNewPassword('')
                                                setConfirmPassword('')
                                            }}
                                            className="py-2 px-4 rounded-btn border-2 border-primary-container text-on-primary hover:border-primary transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
export default Profile
