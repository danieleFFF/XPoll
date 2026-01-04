import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/AuthService'

function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!email || !password) {
            setError('Insert email and password')
            return
        }

        try {
            await login(email, password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.message || 'Login failed')
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
            <Link to="/" className="text-4xl font-bold text-primary mb-8">XPoll</Link>

            <div className="bg-surface rounded-card p-8 shadow-[0_4px_6px_rgba(0,0,0,0.2)] w-full max-w-md">
                <h2 className="text-2xl font-semibold text-center mb-6 text-on-primary">
                    Login
                </h2>

                {error && (
                    <div className="bg-danger/20 border border-danger text-danger rounded-lg p-3 mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-primary-container text-sm mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                            placeholder="nome@email.com"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-primary-container text-sm mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full py-3 px-4 rounded-btn bg-primary-container/10 border-2 border-primary-container text-on-primary outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(98,151,177,0.2)]"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="text-right mb-6">
                        <Link to="/recovery" className="text-primary text-sm hover:underline">
                            Password recovery?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-5 rounded-btn font-medium text-on-primary bg-primary transition-all duration-200 hover:bg-[#527d91] hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(98,151,177,0.3)]"
                    >
                        Login
                    </button>
                </form>

                <p className="text-center text-primary-container mt-6 text-sm">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary font-medium hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login
