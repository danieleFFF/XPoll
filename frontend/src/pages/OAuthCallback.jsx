import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * OAuth callback page that handles the redirect from Google OAuth.
 * Extracts the JWT token from URL and stores it.
 */
function OAuthCallback() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const token = searchParams.get('token')

        if (token) {
            // Store the JWT token
            localStorage.setItem('token', token)

            // Redirect to dashboard
            navigate('/dashboard', { replace: true })
        } else {
            // No token received, redirect to home with error
            navigate('/', { replace: true })
        }
    }, [searchParams, navigate])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-primary mb-4">Logging in...</h1>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
        </div>
    )
}

export default OAuthCallback
