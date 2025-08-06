import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleCompanySetup,
  handleCompleteSetup,
  handleGetCompanies,
} from "./routes/company";
import {
  handleLogin,
  handleRegister,
  handleLogout,
  handleGetCurrentUser,
  handleTechnicianAffiliation,
  handleTechnicienCheck,
  handleTechnicienCompleteRegistration,
} from "./routes/auth";
import { handleCreateEntreprise } from "./routes/entreprise";
import {
  handleCreateDomain,
  handleGetDomainsByCompany,
} from "./routes/domains";
import {
  handleCreateSerre,
  handleGetSerresByDomain,
  handleCreateGuideDeCulture,
  handleGetGuidesDeCulture,
} from "./routes/serres";
import {
  handleCreateTechnicien,
  handleGetTechniciensByCompany,
} from "./routes/technicien";
import {
  createMission,
  getAllMissions,
  getMission,
  updateMission,
  deleteMission,
} from "./routes/missions";
  handleGetAllAlertes,
  handleGetAlerte,
  handleUpdateAlerte,
  handleCreateAlerte,
  handleDeleteAlerte,
} from "./routes/alerts";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.post("/api/login", handleLogin);
  app.post("/api/register", handleRegister);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/user", handleGetCurrentUser);
  app.post("/api/technicien/register", handleTechnicianAffiliation);

  // New technicien routes
  app.post("/api/technicien", handleTechnicienCheck);
  app.post("/api/technicien/complete", handleTechnicienCompleteRegistration);

  // Company routes
  app.post("/api/company/setup", handleCompanySetup);
  app.post("/api/company/complete-setup", handleCompleteSetup);
  app.get("/api/companies", handleGetCompanies);

  // Separated API routes for company setup
  app.post("/api/entreprise", handleCreateEntreprise);
  app.post("/api/domains", handleCreateDomain);
  app.get("/api/domains/company/:companyId", handleGetDomainsByCompany);
  app.post("/api/guides-culture", handleCreateGuideDeCulture);
  app.get("/api/guides-culture", handleGetGuidesDeCulture);
  app.post("/api/serres", handleCreateSerre);
  app.get("/api/serres/domain/:domainId", handleGetSerresByDomain);
  app.post("/api/technicien", handleCreateTechnicien);
  app.get("/api/technicien/company/:companyId", handleGetTechniciensByCompany);

  // Mission routes
  app.post("/api/missions", createMission);
  app.get("/api/missions", getAllMissions);
  app.get("/api/missions/:id", getMission);
  app.put("/api/missions/:id", updateMission);
  app.delete("/api/missions/:id", deleteMission);
  
  // Alerts routes
  app.get("/api/alertes", handleGetAllAlertes);
  app.get("/api/alertes/:id", handleGetAlerte);
  app.put("/api/alertes/:id", handleUpdateAlerte);
  app.post("/api/alertes", handleCreateAlerte);
  app.delete("/api/alertes/:id", handleDeleteAlerte);

  return app;
}
