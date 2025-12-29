import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from "./components/Layout";
import GlobalLoader from "./components/GlobalLoader";
import { useGlobalLoader } from "./store/useGlobalLoader";
import Home from "./pages/Home";
import Input from "./pages/Input";
import Results from "./pages/Results";
import Compare from "./pages/Compare";
import Report from "./pages/Report";
import AISuggestions from "./pages/AISuggestions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { isLoading, message } = useGlobalLoader();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ToastContainer position="top-right" autoClose={3000} />
        <GlobalLoader isLoading={isLoading} message={message} />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="input" element={<Input />} />
              <Route path="results" element={<Results />} />
              <Route path="compare" element={<Compare />} />
              <Route path="report" element={<Report />} />
              <Route path="ai-suggestions" element={<AISuggestions />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
