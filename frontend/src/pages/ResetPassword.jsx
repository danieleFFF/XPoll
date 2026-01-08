import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/ResetPasswordService'

function ResetPassword() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [token, setToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const tokenParam = searchParams.get('token')
        if (!tokenParam) {
            setError('Invalid or missing reset token')
        } else {
            setToken(tokenParam)
        }
    }, [searchParams])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields')
            return
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            await resetPassword(token, newPassword)
            setSuccess(true)
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (err) {
            setError(err.message || 'Failed to reset password. The token may be invalid or expired.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
                <Link to="/" className="text-4xl font-bold text-primary mb-8">XPoll</Link>

                <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] w-full max-w-md text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2 text-on-primary">
                        Password Reset Successful!
                    </h2>
                    <p className="text-primary-container text-sm mb-6">
                        Your password has been successfully reset. Redirecting to login...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
            <Link to="/" className="text-4xl font-bold text-primary mb-8">XPoll</Link>

            <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] w-full max-w-md">
                <h2 className="text-2xl font-semibold text-center mb-2 text-on-primary">
                    Reset Password
                </h2>
                <p className="text-primary-container text-center text-sm mb-6">
                    Enter your new password below
                </p>

                {error && (
                    <div className="bg-danger/20 border border-danger text-danger rounded-lg p-3 mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-primary-container text-sm mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                            placeholder="Enter new password"
                            disabled={loading || !token}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-primary-container text-sm mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                            placeholder="Confirm new password"
                            disabled={loading || !token}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="w-full py-3 px-5 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="text-center text-primary-container mt-6 text-sm">
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        ← Back to login
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default ResetPassword
