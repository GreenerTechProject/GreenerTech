// components/Logout.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear stored auth info
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Optionally clear cookies or session storage if needed
    sessionStorage.clear();

    // Redirect to login (or home)
            navigate("/");
  }, [navigate]);

  return <p>Déconnexion en cours...</p>;
};

export default Logout;
