import { RequestHandler } from "express";

// Mock data structure for missions - replace with your actual database models
interface MissionRobot {
  id?: number;
  id_robot: number;
  id_serre: number;
  rep_jr: number;
  rep_sem: number;
  date_debut?: string;
  date_fin?: string;
  executed?: boolean;
}

interface MissionResponse {
  status: string;
  message?: string;
  mission?: MissionRobot;
}

// In-memory storage for demo purposes - replace with actual database
let missions: MissionRobot[] = [];
let nextId = 1;

// Create mission
export const createMission: RequestHandler = (req, res) => {
  try {
    const {
      id_robot,
      id_serre,
      rep_jr,
      rep_sem,
      date_debut,
      date_fin,
      executed
    } = req.body;

    // Basic validation
    if (!id_robot || !id_serre || rep_jr === undefined || rep_sem === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: id_robot, id_serre, rep_jr, rep_sem"
      });
    }

    const mission: MissionRobot = {
      id: nextId++,
      id_robot,
      id_serre,
      rep_jr,
      rep_sem,
      date_debut,
      date_fin,
      executed: executed || false
    };

    missions.push(mission);

    const response: MissionResponse = {
      status: "success",
      message: "Mission created successfully",
      mission
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get all missions
export const getAllMissions: RequestHandler = (req, res) => {
  res.json(missions);
};

// Get mission by ID
export const getMission: RequestHandler = (req, res) => {
  const missionId = parseInt(req.params.id);
  const mission = missions.find(m => m.id === missionId);

  if (!mission) {
    return res.status(404).json({
      status: "error",
      message: "Mission not found"
    });
  }

  res.json(mission);
};

// Update mission
export const updateMission: RequestHandler = (req, res) => {
  try {
    const missionId = parseInt(req.params.id);
    const missionIndex = missions.findIndex(m => m.id === missionId);

    if (missionIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Mission not found"
      });
    }

    const updatedMission = {
      ...missions[missionIndex],
      ...req.body,
      id: missionId // Ensure ID doesn't change
    };

    missions[missionIndex] = updatedMission;

    const response: MissionResponse = {
      status: "success",
      message: "Mission updated successfully",
      mission: updatedMission
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Delete mission
export const deleteMission: RequestHandler = (req, res) => {
  try {
    const missionId = parseInt(req.params.id);
    const missionIndex = missions.findIndex(m => m.id === missionId);

    if (missionIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Mission not found"
      });
    }

    missions.splice(missionIndex, 1);

    res.json({
      status: "success",
      message: "Mission deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
