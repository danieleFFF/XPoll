import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/AuthService'

function Home() {
    const [pollCode, setPollCode] = useState('')
    const [showLoginOptions, setShowLoginOptions] = useState(false)
    const navigate = useNavigate()
    const user = getCurrentUser()

    //Automatic logout when visiting home page
    /* useEffect(() => {
        const performLogout = async () => { if(getCurrentUser()){ await logout() } }
        performLogout()
    }, []) */

    const handleJoinPoll = () => {
        if (pollCode.trim()) {
            navigate(`/lobby/${pollCode.trim().toUpperCase()}`)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleJoinPoll()
        }
    }

    //If user is already logged in show simplified view
    if (user && !showLoginOptions) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                { /*Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold text-primary mb-4">XPoll</h1>
                    <p className="text-xl text-primary-container max-w-md">
                        Welcome back, {user.username || user.user?.username || user.email}!
                    </p>
                </div>

                {/* 'Enter XPoll' Button */}
                <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] w-full max-w-md">
                    <button onClick={() => navigate('/dashboard')}
                        className="block w-full py-4 px-5 rounded-btn font-semibold text-lg text-center text-on-primary bg-primary cursor-pointer transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]">
                        Enter XPoll
                    </button>
                    <button onClick={async () => {
                        const { logout } = await import('../services/AuthService')
                        await logout()
                        window.location.reload()
                    }}
                        className="block w-full py-3 px-5 mt-3 rounded-btn font-medium text-center text-primary-container border border-primary-container cursor-pointer transition-all duration-200 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400">
                        Logout
                    </button>
                    <button
                        onClick={() => setShowLoginOptions(true)}
                        className="block w-full py-3 px-5 mt-3 rounded-btn font-medium text-center text-primary-container hover:bg-primary-container/10 transition-all duration-200">
                        Change Account
                    </button>
                </div>

                { /*Join Poll quick access */}
                <div className="mt-8 w-full max-w-md">
                    <p className="text-primary-container mb-3 text-center">Or join with a code</p>
                    <div className="flex gap-3">
                        <input type="text" value={pollCode} onChange={(e) => setPollCode(e.target.value)} onKeyPress={handleKeyPress} placeholder="Enter Code"
                            className="flex-1 py-3 px-4 rounded-btn bg-surface border-2 border-primary-container text-on-primary text-center tracking-widest font-medium outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                            maxLength={10} />
                        <button
                            onClick={handleJoinPoll}
                            className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary cursor-pointer transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]">
                            Join
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    //User not logged in , show login/register options
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
            {/* Hero Section */}
            <div className="text-center mb-12">
                <h1 className="text-6xl font-bold text-primary mb-4">XPoll</h1>
                <p className="text-xl text-primary-container max-w-md">
                    Create interactive polls
                </p>
            </div>

            {/* Auth Options */}
            <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] w-full max-w-md">
                <h2 className="text-2xl font-semibold text-center mb-6 text-on-primary">
                    Start now
                </h2>

                {/* Email Login/Signup */}
                <Link
                    to="/login"
                    className="block w-full py-3 px-5 mb-3 rounded-btn font-medium text-center text-on-primary bg-primary cursor-pointer transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]">
                    Login with Email
                </Link>

                <Link
                    to="/signup"
                    className="block w-full py-3 px-5 rounded-btn font-medium text-center text-primary-container border border-primary-container cursor-pointer transition-all duration-200 hover:bg-primary-container/10 hover:-translate-y-0.5">
                    Sign up with Email
                </Link>
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-primary-container/30"></div>
                    <span className="text-primary-container text-sm">or</span>
                    <div className="flex-1 h-px bg-primary-container/30"></div>
                </div>
                {/* Google Login */}
                <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/google`}
                    className="w-full py-3 px-5 mb-4 rounded-btn font-medium text-base bg-white text-gray-700 flex items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </a>
            </div>

            {/* Join Poll Quick Access */}
            <div className="mt-8 w-full max-w-md">
                <p className="text-primary-container mb-3 text-center">Do you have a code?</p>
                <div className="flex gap-3">
                    <input
                        type="text" value={pollCode} onChange={(e) => setPollCode(e.target.value)} onKeyPress={handleKeyPress} placeholder="Enter Code as Guest"
                        className="flex-1 py-3 px-4 rounded-btn bg-surface border-2 border-primary-container text-on-primary text-center tracking-widest font-medium outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                        maxLength={10} />
                    <button
                        onClick={handleJoinPoll}
                        className="py-3 px-6 rounded-btn font-medium text-on-primary bg-primary cursor-pointer transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]">
                        Join
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Home