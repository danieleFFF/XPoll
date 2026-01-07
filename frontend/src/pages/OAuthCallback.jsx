import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * OAuth callback page that handles the redirect from Google OAuth.
 * Extracts the JWT token from URL and stores it in the same format as email/password login.
 */
function OAuthCallback() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const token = searchParams.get('token')

        if (token) {
            try {
                // Decode JWT to get user info (payload is the second part of the JWT)
                const base64Url = token.split('.')[1]
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                )
                const payload = JSON.parse(jsonPayload)

                // Store in the same format as email/password login
                const userData = {
                    token: token,
                    id: payload.sub, // JWT subject (user ID)
                    email: payload.email || payload.sub,
                    username: payload.username || payload.email || 'User'
                }

                localStorage.setItem('user', JSON.stringify(userData))

                // Redirect to dashboard
                navigate('/dashboard', { replace: true })
            } catch (error) {
                console.error('Failed to parse JWT token:', error)
                navigate('/', { replace: true })
            }
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
