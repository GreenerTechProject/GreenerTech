import React, { createContext, useContext, useEffect, useState } from "react";

type TechnicianSidebarContextType = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const TechnicianSidebarContext = createContext<TechnicianSidebarContextType | undefined>(undefined);

export function TechnicianSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      // Keep collapsed by default on desktop, closed on mobile
      if (typeof window !== "undefined") {
        setIsOpen(false);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <TechnicianSidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </TechnicianSidebarContext.Provider>
  );
}

export function useTechnicianSidebar() {
  const ctx = useContext(TechnicianSidebarContext);
  if (!ctx) throw new Error("useTechnicianSidebar must be used within TechnicianSidebarProvider");
  return ctx;
}


