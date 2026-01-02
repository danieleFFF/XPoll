import { useState } from 'react'
import { Link } from 'react-router-dom'

function PasswordRecovery() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!email) {
            setError('Insert your email')
            return
        }
        // TODO: Implement actual password recovery logic
        setSubmitted(true)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
            <Link to="/" className="text-4xl font-bold text-primary mb-8">XPoll</Link>

            <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] w-full max-w-md">
                {!submitted ? (
                    <>
                        <h2 className="text-2xl font-semibold text-center mb-2 text-on-primary">
                            Password Recovery
                        </h2>
                        <p className="text-primary-container text-center text-sm mb-6">
                            Insert your email and we will send you a link to reset your password
                        </p>

                        {error && (
                            <div className="bg-danger/20 border border-danger text-danger rounded-lg p-3 mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-primary-container text-sm mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                                    placeholder="nome@email.com"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 px-5 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]"
                            >
                                Send Link
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold mb-2 text-on-primary">
                            Email Sent!
                        </h2>
                        <p className="text-primary-container text-sm mb-6">
                            Check your email for the password reset link
                        </p>
                    </div>
                )}

                <p className="text-center text-primary-container mt-6 text-sm">
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        ← Back to login
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default PasswordRecovery
