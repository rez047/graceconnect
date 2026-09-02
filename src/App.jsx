import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Layout
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Pages
import Home from './pages/Home';
import Ushirika from './pages/Ushirika';
import Discover from './pages/Discover';
import Events from './pages/Events';
import Giving from './pages/Giving';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children, user }) {
  if (!user) return <Navigate to="/login" />;
  if (!user.onboarded) return <Navigate to="/onboarding" />;
  return children;
}

function AppContent() {
  const { user, loading, currentUser } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✝️</div>
          <div style={{ fontSize: '1.2rem', color: '#4F46E5', fontWeight: 700 }}>
            GraceConnect
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" /> : <Login />
        } />
        <Route path="/onboarding" element={
          user ? <Onboarding /> : <Navigate to="/login" />
        } />
        <Route path="/" element={
          <ProtectedRoute user={user}>
            <Header />
            <main className="main-content" style={{
              paddingTop: '70px',
              paddingBottom: '90px',
              minHeight: '100vh',
              maxWidth: '600px',
              margin: '0 auto',
              padding: '70px 16px 90px'
            }}>
              <Home />
            </main>
            <BottomNav />
          </ProtectedRoute>
        } />
        <Route path="/ushirika" element={
          <ProtectedRoute user={user}>
            <Header />
            <main className="main-content" style={{
              paddingTop: '70px', paddingBottom: '90px',
              minHeight: '100vh', maxWidth: '600px', margin: '0 auto',
              padding: '70px 16px 90px'
            }}>
              <Ushirika />
            </main>
            <BottomNav />
          </ProtectedRoute>
        } />
        <Route path="/discover" element={
          <ProtectedRoute user={user}>
            <Header />
            <main style={{
              paddingTop: '70px', paddingBottom: '90px',
              minHeight: '100vh', maxWidth: '600px', margin: '0 auto',
              padding: '70px 16px 90px'
            }}>
              <Discover />
            </main>
            <BottomNav />
          </ProtectedRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute user={user}>
            <Header />
            <main style={{
              paddingTop: '70px', paddingBottom: '90px',
              minHeight: '100vh', maxWidth: '600px', margin: '0 auto',
              padding: '70px 16px 90px'
            }}>
              <Events />
            </main>
            <BottomNav />
          </ProtectedRoute>
        } />
        <Route path="/giving" element={
          <ProtectedRoute user={user}>
            <Header />
            <main style={{
              paddingTop: '70px', paddingBottom: '90px',
              minHeight: '100vh', maxWidth: '600px', margin: '0 auto',
              padding: '70px 16px 90px'
            }}>
              <Giving />
            </main>
            <BottomNav />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}