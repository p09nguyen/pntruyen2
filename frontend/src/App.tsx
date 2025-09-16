import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
// Tạm comment để test
import StoryDetailPage from './pages/StoryDetailPage';
import ChapterPage from './pages/ChapterPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import FeedbackPage from './pages/FeedbackPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStats from './pages/admin/AdminStats';
import AdminStories from './pages/admin/AdminStories';
import AdminStoryForm from './pages/admin/AdminStoryForm';
import AdminChapterForm from './pages/admin/AdminChapterForm';
import BulkAddChapters from './pages/admin/BulkAddChapters';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminChapters from './pages/admin/AdminChapters';
import AdminFeaturedStories from './pages/admin/AdminFeaturedStories';
import AdminComments from './pages/admin/AdminComments';
import AdminChapterReports from './pages/admin/AdminChapterReports';
import AdminFeedback from './pages/admin/AdminFeedback';
import './App.css';
import Analytics from './Analytics';

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Analytics />
        <div className="App">
          <Routes>
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="stats" element={<AdminStats />} />
              <Route index element={<AdminDashboard />} />
              <Route path="stories" element={<AdminStories />} />
              <Route path="stories/new" element={<AdminStoryForm />} />
              <Route path="stories/:id/edit" element={<AdminStoryForm />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="chapter-reports" element={<AdminChapterReports />} />
              <Route path="chapters/new" element={<AdminChapterForm />} />
              <Route path="chapters/bulk-add" element={<BulkAddChapters />} />
              <Route path="chapters/:id/edit" element={<AdminChapterForm />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="chapters" element={<AdminChapters />} />
              <Route path="featured-stories" element={<AdminFeaturedStories />} />
              <Route path="comments" element={<AdminComments />} />
            </Route>
            
            {/* Public routes */}
            <Route path="/*" element={
              <>
                <Header />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    {/* Slug-based routes */}
                    <Route path="/truyen/:slug" element={<StoryDetailPage />} />
                    <Route path="/truyen/:storySlug/:chapterSlug" element={<ChapterPage />} />
                    {/* Legacy ID-based routes for compatibility */}
                    <Route path="/story/:id" element={<StoryDetailPage />} />
                    <Route path="/chapter/:id" element={<ChapterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    {/* Status shortcut pages */}
                    <Route path="/completed" element={<HomePage />} />
                    <Route path="/updating" element={<HomePage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                  </Routes>
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default function WrappedApp() {
  return (
    <GoogleOAuthProvider clientId="60519047481-6j6eockpffc53doah4ihu6l25ujdtnu2.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  );
}

// If you use React 18+ and index.tsx, ensure you render <WrappedApp /> instead of <App />
// Replace YOUR_GOOGLE_CLIENT_ID with your real Google OAuth Client ID
