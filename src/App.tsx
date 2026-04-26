import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Lecturers from "./pages/Lecturers";
import Classrooms from "./pages/Classrooms";
import Generator from "./pages/Generator";
import AIScheduler from "./pages/AIScheduler";
import Conflicts from "./pages/Conflicts";
import Settings from "./pages/Settings";
import MyTimetable from "./pages/MyTimetable";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<ProtectedRoute roles={["Admin"]}><Dashboard /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute roles={["Admin"]}><Courses /></ProtectedRoute>} />
              <Route path="/lecturers" element={<ProtectedRoute roles={["Admin"]}><Lecturers /></ProtectedRoute>} />
              <Route path="/classrooms" element={<ProtectedRoute roles={["Admin"]}><Classrooms /></ProtectedRoute>} />
              <Route path="/generator" element={<ProtectedRoute roles={["Admin"]}><Generator /></ProtectedRoute>} />
              <Route path="/ai" element={<ProtectedRoute roles={["Admin"]}><AIScheduler /></ProtectedRoute>} />
              <Route path="/conflicts" element={<ProtectedRoute roles={["Admin"]}><Conflicts /></ProtectedRoute>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/my-timetable" element={<ProtectedRoute roles={["Lecturer"]}><MyTimetable /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
