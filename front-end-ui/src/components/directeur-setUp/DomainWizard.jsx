import React, { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, LoadScript, DrawingManager } from "@react-google-maps/api";
import { AnimatePresence } from "framer-motion";
import DomainStep from "./DomainStep";
import SerresStep from "./SerresStep";
import TechnicianStep from "./TechnicianStep";
import EntrepriseStep from "./EntrepriseStep";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "12px",
};

const center = {
  lat: 48.8584,
  lng: 2.2945,
};

export default function DomainSetupWizard() {
  const [step, setStep] = useState("domain");
  const [domainName, setDomainName] = useState("");
  const [domainPolygon, setDomainPolygon] = useState(null);
  const [serres, setSerres] = useState([]);
  const [currentSerreIndex, setCurrentSerreIndex] = useState(null);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [technician, setTechnician] = useState({
    name: "",
    telephone: "",
    email: "",
    cin: "",
  });
  const [user, setUser] = useState();

  const mapRef = useRef(null);
  const drawingManagerRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const data = await getUser();
      if (data) {
        setUser(data);
        localStorage.setItem("user", data)
      }
      setLoading(false);
    };

    fetchUser();
  }, []);



   useEffect(() => {
    const checkEntreprise = async () => {
      if (!entrepriseId) {
        setStep("entreprise");
      } else {
        setStep("domain");
      }
    };

    checkEntreprise();
  }, [entrepriseId]);

  useEffect(() => {
    const checkEntreprise = async () => {
      if (!entrepriseId) {
        setStep("entreprise");
      } else {
        setStep("domain");
      }
    };

    checkEntreprise();
  }, [entrepriseId]);

  const onLoadMap = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handlePolygonComplete = (polygon) => {
    const path = polygon
      .getPath()
      .getArray()
      .map((latlng) => ({
        lat: latlng.lat(),
        lng: latlng.lng(),
      }));

    if (step === "domain") {
      setDomainPolygon(path);
    } else if (step === "serres" && currentSerreIndex !== null) {
      const updatedSerres = [...serres];
      updatedSerres[currentSerreIndex].polygon = path;
      setSerres(updatedSerres);
    }

    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-center mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                {step === "entreprise"
                  ? "Create Entreprise"
                  : step === "domain"
                  ? "Create Domain"
                  : step === "serres"
                  ? "Add Greenhouses"
                  : "Add Technician"}
              </h2>
              <div className="flex mt-2">
                <div
                  className={`h-1 rounded-full ${
                    step === "entreprise" ? "bg-blue-600" : "bg-green-800"
                  } flex-1 mr-1`}
                ></div>
                <div
                  className={`h-1 rounded-full ${
                    step === "domain" ? "bg-blue-600" : "bg-blue-200"
                  } flex-1 mr-1`}
                ></div>
                <div
                  className={`h-1 rounded-full ${
                    step === "serres" || step === "technician"
                      ? "bg-green-600"
                      : "bg-green-200"
                  } flex-1 mr-1`}
                ></div>
                <div
                  className={`h-1 rounded-full ${
                    step === "technician" ? "bg-indigo-600" : "bg-indigo-200"
                  } flex-1`}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              {step !== "technician" && step !== "entreprise" ? (
                <LoadScript
                  googleMapsApiKey="AIzaSyBU1VhlgGYX7SXOH1EIGIxkeF7C8YTEomk"
                  libraries={["drawing"]}
                >
                  <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={center}
                      zoom={13}
                      onLoad={onLoadMap}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        styles: [
                          {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                          },
                        ],
                      }}
                    >
                      <DrawingManager
                        onLoad={(drawingManager) => {
                          drawingManagerRef.current = drawingManager;
                        }}
                        onPolygonComplete={handlePolygonComplete}
                        options={{
                          drawingControl: true,
                          drawingControlOptions: {
                            drawingModes: ["polygon"],
                            position:
                              window.google?.maps?.ControlPosition?.TOP_CENTER,
                          },
                          polygonOptions: {
                            fillColor: step === "domain" ? "#3B82F6" : "#10B981",
                            fillOpacity: 0.3,
                            strokeWeight: 2,
                            strokeColor: step === "domain" ? "#1D4ED8" : "#047857",
                            editable: true,
                            draggable: false,
                          },
                        }}
                      />
                    </GoogleMap>
                  </div>
                </LoadScript>
              ) : step === "technician" ? (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-indigo-50 to-blue-50 h-full flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Technician Profile
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Complete the form to finish setup
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {step === "entreprise" && (
                  <EntrepriseStep
                    key="entreprise"
                    setStep={setStep}
                    setEntrepriseId={setEntrepriseId}
                    onSkip={() => setStep("domain")}
                  />
                )}
                {step === "domain" && (
                  <DomainStep
                    key="domain"
                    domainName={domainName}
                    setDomainName={setDomainName}
                    domainPolygon={domainPolygon}
                    setStep={setStep}
                  />
                )}
                {step === "serres" && (
                  <SerresStep
                    key="serres"
                    domainName={domainName}
                    serres={serres}
                    setSerres={setSerres}
                    currentSerreIndex={currentSerreIndex}
                    setCurrentSerreIndex={setCurrentSerreIndex}
                    setStep={setStep}
                  />
                )}
                {step === "technician" && (
                  <TechnicianStep
                    key="technician"
                    technician={technician}
                    setTechnician={setTechnician}
                    setStep={setStep}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
