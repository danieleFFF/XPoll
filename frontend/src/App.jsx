import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import PasswordRecovery from './pages/PasswordRecovery.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CreatePoll from './pages/CreatePoll.jsx'
import Lobby from './pages/Lobby.jsx'
import Vote from './pages/Vote.jsx'
import View from './pages/View.jsx'
import Master from './pages/Master.jsx'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/recovery" element={<PasswordRecovery />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create" element={<CreatePoll />} />
                <Route path="/lobby/:code" element={<Lobby />} />
                <Route path="/vote/:code" element={<Vote />} />
                <Route path="/view/:code" element={<View />} />
                <Route path="/master/:code" element={<Master />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
