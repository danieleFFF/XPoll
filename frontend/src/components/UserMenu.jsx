import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../services/AuthService'

//Dropdown menu for user
function UserMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const [user, setUser] = useState(null)
    const menuRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        setUser(getCurrentUser())
    }, [])

    //Closes menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        await logout()
        setUser(null)
        setIsOpen(false)
        navigate('/')
    }

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/google`
    }

    //Gets user email from various possible locations in the data structure.
    const getUserEmail = () => {
        return user?.email || user?.user?.email || null
    }

    //Gets username from various possible locations.
    const getUserName = () => {
        return user?.username || user?.user?.username || null
    }

    //User initial for avatar.
    const getUserInitial = () => {
        const name = getUserName()
        const email = getUserEmail()
        if (name) return name.charAt(0).toUpperCase()
        if (email) return email.charAt(0).toUpperCase()
        return 'U'
    }

    return (
        <div className="relative" ref={menuRef}>
            { /* Avatar button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-semibold cursor-pointer transition-transform duration-200 hover:scale-105 text-on-primary">
                {getUserInitial()}
            </button>

            { /* Dropdown menu*/}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface rounded-lg shadow-xl border border-primary-container/30 py-2 z-50">
                    {user ? (
                        <>
                            { /*User info header*/}
                            <div className="px-4 py-3 border-b border-primary-container/30">
                                <p className="text-sm text-on-primary font-medium truncate">
                                    {getUserName() || getUserEmail()}
                                </p>
                                <p className="text-xs text-primary-container truncate">
                                    {getUserEmail()}
                                </p>
                            </div>
                            {/* Menu items */}
                            <Link
                                to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-on-primary hover:bg-primary/10 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile
                            </Link>

                            <Link
                                to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-on-primary hover:bg-primary/10 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                My Polls
                            </Link>

                            <Link to="/dashboard#history" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-on-primary hover:bg-primary/10 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                History
                            </Link>

                            <div className="border-t border-primary-container/30 my-2"></div>

                            <button
                                onClick={() => {
                                    logout()
                                    setUser(null)
                                    setIsOpen(false)
                                    navigate('/login')
                                }}
                                className="flex items-center gap-3 px-4 py-2 text-on-primary hover:bg-primary/10 transition-colors w-full text-left cursor-pointer">

                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Change Account
                            </button>

                            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left cursor-pointer">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            { /* Anonymous user menu */}
                            <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-on-primary hover:bg-primary/10 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-on-primary hover:bg-primary/10 transition-colors">

                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Sign Up
                            </Link>

                            <div className="border-t border-primary-container/30 my-2"></div>

                            <button onClick={handleGoogleLogin} className="flex items-center gap-3 px-4 py-2 text-on-primary hover:bg-primary/10 transition-colors w-full text-left">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign in with Google
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
export default UserMenu