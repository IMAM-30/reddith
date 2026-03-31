import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import GuestRoute from './components/layout/GuestRoute';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import CreateCommunity from './pages/CreateCommunity';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import UserProfile from './pages/UserProfile';
import Search from './pages/Search';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Rules from './pages/Rules';
import Guide from './pages/Guide';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/r/:slug" element={<CommunityDetail />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/user/:username" element={<UserProfile />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/search" element={<Search />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/guide" element={<Guide />} />

            {/* Guest only */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Protected */}
            <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="/create-community" element={<ProtectedRoute><CreateCommunity /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
