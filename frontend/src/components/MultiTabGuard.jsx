import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

const STORAGE_KEY_PREFIX = 'xpoll_active_tab_'
const SESSION_EMAIL_KEY = 'xpoll_my_email'
const HEARTBEAT_INTERVAL = 2000 // 2 seconds
const HEARTBEAT_TIMEOUT = 5000 // Tab dead after 5s without heartbeat
const PUBLIC_PATHS = ['/', '/login', '/signup', '/recovery', '/reset-password', '/oauth/callback']
//Generate unique tab id, created once per tab session
const MY_TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

//Gets email from localStorage user data
const getLocalStorageEmail = () => {
    try {
        const userData = localStorage.getItem('user')
        if (userData) {
            const user = JSON.parse(userData)
            return user?.user?.email || user?.email || null
        }
    } catch (e) { }

    return null
}

//Get this tab's email from sessionStorage
const getSessionEmail = () => sessionStorage.getItem(SESSION_EMAIL_KEY) || null

//Set this tab's email in sessionStorage
const setSessionEmail = (email) => {
    if (email) {
        sessionStorage.setItem(SESSION_EMAIL_KEY, email)
    } else {
        sessionStorage.removeItem(SESSION_EMAIL_KEY)
    }
}

//Enforces single tab session per email address,only applies to authenticated pages, public pages are always allowed.
function MultiTabGuard({ children }) {
    const [isBlocked, setIsBlocked] = useState(false)
    const location = useLocation()

    //Checks if current path is public
    const isPublicPath = useCallback(() => {
        const path = location.pathname
        return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))
    }, [location.pathname])

    //Gets the effective email for this tab - only use sessionStorage (what THIS tab explicitly logged in with)
    //This ensures tabs don't inherit emails from other tabs via shared localStorage
    const getEffectiveEmail = useCallback(() => {
        return getSessionEmail()
    }, [])

    //Checks if another tab with same email is alive
    const isOtherTabAlive = useCallback((email) => {
        if (!email) return false

        const storageKey = `${STORAGE_KEY_PREFIX}${email}`
        try {
            const stored = localStorage.getItem(storageKey)
            if (!stored) return false

            const data = JSON.parse(stored)
            if (data.tabId === MY_TAB_ID) return false

            const age = Date.now() - data.timestamp
            return age < HEARTBEAT_TIMEOUT
        } catch (e) {
            return false
        }
    }, [])

    //Updates heartbeat for this email (checks if same email is used in other tabs every n seconds)
    const updateHeartbeat = useCallback((email) => {
        if (!email) return

        const storageKey = `${STORAGE_KEY_PREFIX}${email}`
        localStorage.setItem(storageKey, JSON.stringify({
            tabId: MY_TAB_ID,
            timestamp: Date.now()
        }))
    }, [])

    //Clears heartbeat
    const clearHeartbeat = useCallback((email) => {
        if (!email) return

        const storageKey = `${STORAGE_KEY_PREFIX}${email}`
        try {
            const stored = localStorage.getItem(storageKey)
            if (stored) {
                const data = JSON.parse(stored)
                if (data.tabId === MY_TAB_ID) {
                    localStorage.removeItem(storageKey)
                }
            }
        } catch (e) { }
    }, [])

    //Main check logic
    useEffect(() => {
        let intervalId = null
        let currentEmail = null

        const checkAndUpdate = () => {
            //public paths are never blocked
            if (isPublicPath()) {
                setIsBlocked(false)

                return
            }

            const email = getEffectiveEmail()

            //Tracks email changes for cleanup
            if (currentEmail && currentEmail !== email) {
                clearHeartbeat(currentEmail)
            }
            currentEmail = email

            //No email = guest = always allow
            if (!email) {
                setIsBlocked(false)

                return
            }

            //Checks if another tab is already using this email
            if (isOtherTabAlive(email)) {
                //Blocked: another tab already has this email
                setIsBlocked(true)
                setSessionEmail(email) // Remember what email is blocked
            } else {
                //Not Blocked: claims the slot
                setSessionEmail(email)
                updateHeartbeat(email)
                setIsBlocked(false)
            }
        }

        //Initial check
        checkAndUpdate()
        //Keeps checking every second.
        intervalId = setInterval(checkAndUpdate, 1000)

        //Listens for storage changes from other tabs
        const handleStorageChange = (e) => {
            //Doesn't check on public paths
            if (isPublicPath()) return

            const email = getEffectiveEmail()

            if (!email) return

            const storageKey = `${STORAGE_KEY_PREFIX}${email}`

            //If another tab claimed our email's lock
            if (e.key === storageKey && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue)
                    if (data.tabId !== MY_TAB_ID) {
                        setIsBlocked(true)
                    }
                } catch (e) { }
            }

            //if user logged out (localStorage.user removed)
            if (e.key === 'user' && !e.newValue) {
                setSessionEmail(null)
                setIsBlocked(false)
            }
        }
        window.addEventListener('storage', handleStorageChange)

        //Cleanup on tab close
        const handlePageHide = () => {
            if (currentEmail) {
                clearHeartbeat(currentEmail)
            }
        }
        window.addEventListener('pagehide', handlePageHide)

        return () => {
            if (intervalId) clearInterval(intervalId)
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('pagehide', handlePageHide)
            if (currentEmail) clearHeartbeat(currentEmail)
        }
    }, [location, isPublicPath, getEffectiveEmail, isOtherTabAlive, updateHeartbeat, clearHeartbeat])

    //Public paths are never blocked
    if (isPublicPath()) {
        return children
    }

    //Gets current email for render decision
    const effectiveEmail = getEffectiveEmail()

    //If guest users then always allow
    if (!effectiveEmail) {
        return children
    }

    //If is blocked then  show message
    if (isBlocked) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md border border-white/10">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">XPoll already open on another page</h2>
                    <p className="text-gray-300 text-sm">
                        Please close this tab and use the existing one.
                    </p>
                </div>
            </div>
        )
    }

    return children
}

export default MultiTabGuard