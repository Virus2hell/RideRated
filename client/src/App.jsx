import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Feed from './pages/Feed';
import RoadDetail from './pages/RoadDetail';
import ReviewDetail from './pages/ReviewDetail';
import NewReview from './pages/NewReview';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Riders from './pages/Riders';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Scroll to the top whenever the page changes.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/roads/:id" element={<RoadDetail />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/riders" element={<Riders />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/reviews/new" element={<NewReview />} />
            <Route path="/settings/profile" element={<EditProfile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
