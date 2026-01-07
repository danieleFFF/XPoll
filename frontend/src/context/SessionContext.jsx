import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

export const SESSION_STATES = {
    WAITING: 'WAITING',
    OPEN: 'OPEN',
    CLOSED: 'CLOSED'
}

const SessionContext = createContext(null)
const API_URL = '/api'
const WS_URL = '/ws'
const USER_ID_KEY = 'xpoll_user_id'

//Generates/retrieves unique userId
const getUserId = () => {
    let userId = sessionStorage.getItem(USER_ID_KEY)

    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
        sessionStorage.setItem(USER_ID_KEY, userId)
    }
    return userId
}

//Handles session's life cycle.
export function SessionProvider({ children }) {
    const [currentSession, setCurrentSession] = useState(null)
    const stompClientRef = useRef(null)
    const subscriptionRef = useRef(null)

    //Fetches session from backend.
    const fetchSession = useCallback(async (code) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}`)

            if (response.ok) {
                const session = await response.json()
                setCurrentSession(session)

                return session
            }
            return null
        } catch (error) {
            console.error('Error fetching session:', error)

            return null
        }
    }, [])

    //Handles websocket messages.
    const handleWebSocketMessage = useCallback((data, code) => {
        switch (data.type) {
            case 'PARTICIPANT_JOINED':
                //Refreshes session to get updated participant list.
                fetchSession(code)
                break
            case 'SESSION_STATE_CHANGED':
                //Updates local session state.
                setCurrentSession(prev => prev ? { ...prev, state: data.state, timerStartedAt: data.timerStartedAt || prev.timerStartedAt } : prev)
                break
            case 'RESULTS_SHOWN':
                setCurrentSession(prev => prev ? { ...prev, resultsShown: true, state: SESSION_STATES.CLOSED } : prev)
                break
            case 'SESSION_CLOSED':
                setCurrentSession(prev => prev ? { ...prev, state: SESSION_STATES.CLOSED, exitedWithoutResults: data.exitedWithoutResults || false } : prev)
                break
            case 'SESSION_DELETED':
                setCurrentSession(null)
                break
            case 'VOTE_SUBMITTED':
                //Updates scores and vote count.
                fetchSession(code)
                break
            case 'PARTICIPANT_LEFT':
                //forces state update.
                fetchSession(code).then(session => {
                    if (session) setCurrentSession(session)
                })
                break
        }
    }, [fetchSession])

    //Connects to Websocket for a specific session.
    const connectWebSocket = useCallback((code) => {
        if (stompClientRef.current?.connected) {
            stompClientRef.current.deactivate()
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('WebSocket connected')
                subscriptionRef.current = client.subscribe(
                    `/topic/session/${code.toUpperCase()}`,
                    (message) => {
                        const data = JSON.parse(message.body)
                        console.log('WebSocket message:', data)
                        handleWebSocketMessage(data, code)
                    }
                )
            },
            onDisconnect: () => {
                console.log('WebSocket disconnected')
            }
        })
        client.activate()
        stompClientRef.current = client
    }, [handleWebSocketMessage])

    //Cleans websocket when needed (like closing the browser).
    useEffect(() => {
        return () => {
            if (subscriptionRef.current) { subscriptionRef.current.unsubscribe() }
            if (stompClientRef.current?.connected) { stompClientRef.current.deactivate() }
        }
    }, [])

    //Creates new session with poll data.
    const createSession = useCallback(async (pollData) => {
        try {
            //Gets logged user's database id if available.
            let creatorUserId = null;
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    creatorUserId = user?.user?.id || user?.id || null;
                } catch (e) {
                    console.error('Error parsing user from localStorage', e);
                }
            }

            const response = await fetch(`${API_URL}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: getUserId(),
                    creatorUserId: creatorUserId,
                    title: pollData.title,
                    timeLimit: pollData.timeLimit,
                    questions: pollData.questions
                })
            })

            if (response.ok) {
                const session = await response.json()
                setCurrentSession(session)
                connectWebSocket(session.code)
                return session
            }
            return null
        } catch (error) {
            console.error('Error creating session:', error)

            return null
        }
    }, [connectWebSocket])

    //Gets session by code (for creator and participants).
    const getSession = useCallback(async (code) => {
        const normalizedCode = code.toUpperCase()
        const session = await fetchSession(normalizedCode)
        if (session) { connectWebSocket(normalizedCode) }
        return session
    }, [fetchSession, connectWebSocket])

    //Gets current user's session via code (creator only).
    const getMySession = useCallback(async (code) => {
        const normalizedCode = code.toUpperCase()
        const creatorId = getUserId()
        const session = await fetchSession(normalizedCode)

        if (session && session.creatorId === creatorId) {
            connectWebSocket(normalizedCode)

            return session
        }
        return null
    }, [fetchSession, connectWebSocket])

    //Joins session as participant.
    const joinSession = useCallback(async (code, displayName) => {
        try {
            //Gets current user's id if authenticated.
            let userId = null;
            const storedUser = localStorage.getItem('user');

            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    userId = user?.user?.id || user?.id || null;
                } catch (e) {
                    console.error('Error parsing user from localStorage', e);
                }
            }

            const response = await fetch(`${API_URL}/sessions/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName, userId })
            })

            const result = await response.json()

            if (result.success) {
                const session = await fetchSession(code)
                connectWebSocket(code)

                return { success: true, participant: result.participant, sessionCode: code }
            }
            return result
        } catch (error) {
            console.error('Error joining session:', error)

            return { success: false, error: 'Network error' }
        }
    }, [fetchSession, connectWebSocket])

    //Launches poll and starts timer (creator action).
    const launchPoll = useCallback(async (code) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}/launch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId: getUserId() })
            })

            if (response.ok) {
                await fetchSession(code)

                return true
            }
            return false
        } catch (error) {
            console.error('Error launching poll:', error)
            return false
        }
    }, [fetchSession])

    //Closes poll (creator action).
    const closePoll = useCallback(async (code) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId: getUserId() })
            })

            if (response.ok) {
                await fetchSession(code)

                return true
            }
            return false
        } catch (error) {
            console.error('Error closing poll:', error)
            return false
        }
    }, [fetchSession])

    //Shows results to participants (creator action).
    const showResults = useCallback(async (code) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId: getUserId() })
            })

            if (response.ok) {
                await fetchSession(code)

                return true
            }
            return false
        } catch (error) {
            console.error('Error showing results:', error)

            return false
        }
    }, [fetchSession])

    //Exits without showing results (creator action).
    const exitWithoutResults = useCallback(async (code) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}/exit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId: getUserId() })
            })

            if (response.ok) {
                await fetchSession(code)

                return true
            }
            return false
        } catch (error) {
            console.error('Error exiting:', error)

            return false
        }
    }, [fetchSession])

    //Deletes session when creator leaves.
    const deleteSession = useCallback(async (code) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId: getUserId() })
            })

            if (response.ok) {
                setCurrentSession(null)
                if (subscriptionRef.current) { subscriptionRef.current.unsubscribe() }
                if (stompClientRef.current?.connected) { stompClientRef.current.deactivate() }

                return true
            }
            return false
        } catch (error) {
            console.error('Error deleting session:', error)

            return false
        }
    }, [])

    //Submits votes for a participant
    const submitVotes = useCallback(async (code, participantName, answers) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}/votes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantName, answers })
            })

            return response.ok
        } catch (error) {
            console.error('Error submitting votes:', error)

            return false
        }
    }, [])

    //Gets remaining time for a session.
    const getRemainingTime = useCallback(async (code) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}/time`)
            if (response.ok) {
                const data = await response.json()

                return data.remainingTime
            }
            return 0
        } catch (error) {
            console.error('Error getting remaining time:', error)

            return 0
        }
    }, [])

    //Calculates remaining time locally.
    const calculateRemainingTime = useCallback((session) => {
        if (!session || !session.timerStartedAt) return session?.timeLimit || 0

        const elapsed = Math.floor((Date.now() - new Date(session.timerStartedAt).getTime()) / 1000)

        return Math.max(0, session.timeLimit - elapsed)
    }, [])

    //Gets aggregate results for a session.
    const getResults = useCallback(async (code) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}/results`)

            if (response.ok) { return await response.json() }

            return null
        } catch (error) {
            console.error('Error getting results:', error)

            return null
        }
    }, [])

    //Gets personalized results for a participant.
    const getParticipantResults = useCallback(async (code, participantName) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${code}/results/${encodeURIComponent(participantName)}`)
            if (response.ok) {
                return await response.json()
            }
            return null
        } catch (error) {
            console.error('Error getting participant results:', error)
            return null
        }
    }, [])

    const value = {
        currentSession, setCurrentSession, createSession, getSession,
        getMySession, joinSession, launchPoll, closePoll, showResults,
        exitWithoutResults, deleteSession, submitVotes, getRemainingTime,
        calculateRemainingTime, getResults, getParticipantResults,
        SESSION_STATES, getUserId
    }

    return (<SessionContext.Provider value={value}> {children} </SessionContext.Provider>)
}

export function useSession() {
    const context = useContext(SessionContext)
    if (!context) { throw new Error('useSession must be used within a SessionProvider') }

    return context
}
