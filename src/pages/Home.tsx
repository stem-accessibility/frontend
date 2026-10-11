// src/components/HomeLanding.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import "../pages/styles/HomeLanding.css";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";

const HomeLanding: React.FC = () => {
  const { user } = useAuth();

  // Signed-in people have no home page: their dashboard is the start.
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="home">
      <main className="home__main" id="main">
        <Hero />
        <HowItWorks />

        
      </main>

      
    </div>
  );
};

export default HomeLanding;
