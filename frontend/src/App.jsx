import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SessionProvider } from './context/SessionContext'
import MultiTabGuard from './components/MultiTabGuard'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import PasswordRecovery from './pages/PasswordRecovery.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import OAuthCallback from './pages/OAuthCallback.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CreatePoll from './pages/CreatePoll.jsx'
import PollDetails from './pages/PollDetails.jsx'
import EditPoll from './pages/EditPoll.jsx'
import Lobby from './pages/Lobby.jsx'
import Vote from './pages/Vote.jsx'
import View from './pages/View.jsx'
import Master from './pages/Master.jsx'
import Profile from './pages/Profile.jsx'

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <MultiTabGuard>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/recovery" element={<PasswordRecovery />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/poll-details/:id" element={<PollDetails />} />
            <Route path="/edit-poll/:id" element={<EditPoll />} />
            <Route path="/lobby/:code" element={<Lobby />} />
            <Route path="/vote/:code" element={<Vote />} />
            <Route path="/view/:code" element={<View />} />
            <Route path="/master/:code" element={<Master />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </MultiTabGuard>
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App