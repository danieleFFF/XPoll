import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * OAuth callback page that handles the redirect from Google OAuth.
 * Extracts the JWT token from URL, fetches user profile, and stores it.
 */
function OAuthCallback() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [error, setError] = useState('')

    useEffect(() => {
        const handleOAuthCallback = async () => {
            const token = searchParams.get('token')

            if (token) {
                try {
                    //Fetches user profile using the token
                    const response = await fetch('http://localhost:8080/api/users/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })

                    if (response.ok) {
                        const userProfile = await response.json()
                        // Store user data in the format expected by AuthService
                        const userData = {
                            token,
                            user: userProfile,
                            ...userProfile
                        }
                        localStorage.setItem('user', JSON.stringify(userData))
                        // Store email in sessionStorage for THIS tab's identity
                        sessionStorage.setItem('xpoll_my_email', userProfile.email)
                        navigate('/dashboard', { replace: true })
                    } else {
                        setError('Failed to fetch user profile')
                        setTimeout(() => navigate('/', { replace: true }), 2000)
                    }
                } catch (err) {
                    console.error('OAuth callback error:', err)
                    setError('Authentication error')
                    setTimeout(() => navigate('/', { replace: true }), 2000)
                }
            } else {
                // No token received, redirect to home with error
                navigate('/', { replace: true })
            }
        }

        handleOAuthCallback()
    }, [searchParams, navigate])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
            <div className="text-center">
                {error ? (
                    <>
                        <h1 className="text-2xl font-bold text-red-400 mb-4">{error}</h1>
                        <p className="text-primary-container">Redirecting...</p>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-primary mb-4">Logging in...</h1>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    </>
                )}
            </div>
        </div>
    )
}

export default OAuthCallback
