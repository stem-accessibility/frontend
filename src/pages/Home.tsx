// src/components/HomeLanding.tsx
import React from "react";
import "../pages/styles/HomeLanding.css";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";

const HomeLanding: React.FC = () => {
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
