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

        </div>
    )
}

export default PasswordRecovery
