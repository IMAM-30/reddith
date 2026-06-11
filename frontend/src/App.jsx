import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import GuestRoute from './components/layout/GuestRoute';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { FEATURES } from './config/features';

const Home = lazy(() => import('./pages/Home'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail'));
const CommunityManage = lazy(() => import('./pages/CommunityManage'));
const CreateCommunity = lazy(() => import('./pages/CreateCommunity'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Search = lazy(() => import('./pages/Search'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Popular = lazy(() => import('./pages/Popular'));
const Rules = lazy(() => import('./pages/Rules'));
const Guide = lazy(() => import('./pages/Guide'));
const ModeratorReports = lazy(() => import('./pages/ModeratorReports'));

function RouteFallback() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Page({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Page><LandingPage /></Page>} />
          <Route element={<AppLayout />}>
            {/* Public */}
            <Route path="/beranda" element={<Page><Home /></Page>} />
            <Route path="/home" element={<Navigate to="/beranda" replace />} />
            {FEATURES.popular && <Route path="/popular" element={<Page><Popular /></Page>} />}
            <Route path="/r/:slug" element={<Page><CommunityDetail /></Page>} />
            {FEATURES.communityManagement && <Route path="/r/:slug/manage" element={<ProtectedRoute><Page><CommunityManage /></Page></ProtectedRoute>} />}
            <Route path="/post/:id" element={<Page><PostDetail /></Page>} />
            <Route path="/user/:username" element={<Page><UserProfile /></Page>} />
            <Route path="/profile/:id" element={<Page><ProfilePage /></Page>} />
            {FEATURES.profileEditing && <Route path="/profile/:id/edit" element={<ProtectedRoute><Page><EditProfile /></Page></ProtectedRoute>} />}
            <Route path="/communities" element={<Page><Communities /></Page>} />
            {FEATURES.advancedSearch && <Route path="/search" element={<Page><Search /></Page>} />}
            {FEATURES.infoPages && <Route path="/rules" element={<Page><Rules /></Page>} />}
            {FEATURES.infoPages && <Route path="/guide" element={<Page><Guide /></Page>} />}

            {/* Guest only */}
            <Route path="/login" element={<GuestRoute><Page><Login /></Page></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Page><Register /></Page></GuestRoute>} />

            {/* Protected */}
            <Route path="/create-post" element={<ProtectedRoute><Page><CreatePost /></Page></ProtectedRoute>} />
            {FEATURES.createCommunity && <Route path="/create-community" element={<ProtectedRoute><Page><CreateCommunity /></Page></ProtectedRoute>} />}
            {FEATURES.notifications && <Route path="/notifications" element={<ProtectedRoute><Page><Notifications /></Page></ProtectedRoute>} />}
            <Route path="/moderation/reports" element={<ProtectedRoute><Page><ModeratorReports /></Page></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/beranda" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
