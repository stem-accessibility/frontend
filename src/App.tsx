import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppRoutes from "./app/AppRoutes";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>

        <div className="app-container">
          <Header />

          <main id="main" className="main-content" tabIndex={-1}>
            <AppRoutes />
          </main>
           <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
