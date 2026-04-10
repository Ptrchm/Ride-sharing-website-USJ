import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import FindRide from "./pages/FindRide";
import CreateRide from "./pages/CreateRide";
import Profile from "./pages/Profile";
import Feedback from "./pages/Feedback";
import VerifyPending from "./pages/VerifyPending";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";
import RequireAuth from "@/components/RequireAuth";
import RequireDriver from "@/components/RequireDriver";
import ExternalRedirect from "./pages/ExternalRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/find-ride" element={<ExternalRedirect to="/maps/passenger-map.html" />} />
            <Route
              path="/create-ride"
              element={
                <RequireAuth>
                  <RequireDriver>
                    <ExternalRedirect to="/maps/driver-map.html" />
                  </RequireDriver>
                </RequireAuth>
              }
            />
            <Route
              path="/create-ride-form"
              element={
                <RequireAuth>
                  <CreateRide />
                </RequireAuth>
              }
            />
            <Route path="/find-ride-list" element={<FindRide />} />
            <Route path="/my-map" element={<ExternalRedirect to="/maps/my-map.html" />} />
            <Route path="/trips" element={<Navigate to="/profile" replace />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route path="/feedback" element={<Feedback />} />
            <Route
              path="/verify-pending"
              element={
                <RequireAuth requireActive={false}>
                  <VerifyPending />
                </RequireAuth>
              }
            />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
