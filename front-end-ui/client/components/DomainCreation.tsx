import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Plus, Trash2 } from "lucide-react";
import GoogleMapsWrapper from "./GoogleMapsWrapper";
import MapComponent, { DrawnShape } from "./MapComponent";
import { getGoogleMapsAPIKey } from "@/config/maps";

interface Domain {
  id: string;
  name: string;
  area: number; // in square meters
  center: google.maps.LatLng;
  path: google.maps.LatLng[];
  serres: Serre[];
}

interface Serre {
  id: string;
  nom: string;
  variety: string;
  yield: number;
  surface: number;
  domainId: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  additionalData?: {
    plantingDate?: string;
    harvestDate?: string;
    irrigationType?: string;
    notes?: string;
  };
}

interface DomainCreationProps {
  onContinue: (domains: Domain[]) => void;
  onBack?: () => void;
  initialDomains?: Domain[];
}

const GOOGLE_MAPS_API_KEY = getGoogleMapsAPIKey();

export default function DomainCreation({
  onContinue,
  onBack,
  initialDomains = [],
}: DomainCreationProps) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [pendingShape, setPendingShape] = useState<DrawnShape | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  const handleShapeComplete = (shape: DrawnShape) => {
    setPendingShape(shape);
    setIsDrawing(false);
  };

  const handleSaveDomain = () => {
    if (!pendingShape || !newDomainName.trim()) return;

    const newDomain: Domain = {
      id: pendingShape.id,
      name: newDomainName.trim(),
      area: pendingShape.area,
      center: pendingShape.center,
      path: pendingShape.path,
      serres: [],
    };

    setDomains((prev) => [...prev, newDomain]);
    setNewDomainName("");
    setPendingShape(null);
  };

  const handleDeleteDomain = (domainId: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== domainId));
  };

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomainId(domainId === selectedDomainId ? null : domainId);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setPendingShape(null);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setPendingShape(null);
    setNewDomainName("");
  };

  const getAllShapes = (): DrawnShape[] => {
    const shapes: DrawnShape[] = [];

    // Add existing domains
    domains.forEach((domain) => {
      shapes.push({
        id: domain.id,
        type: "domain",
        name: domain.name,
        path: domain.path,
        area: domain.area,
        center: domain.center,
        color: "#B4CC5F",
      });

      // Add serres for this domain
      domain.serres.forEach((serre) => {
        shapes.push({
          id: serre.id,
          type: "serre",
          name: serre.nom,
          path: serre.position,
          area: serre.surface,
          center: serre.center,
          color: "#FF6B6B",
          domainId: domain.id,
        });
      });
    });

    // Add pending shape
    if (pendingShape) {
      shapes.push(pendingShape);
    }

    return shapes;
  };

  return (
    <div className="h-screen flex">
      {/* Left Panel */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Créer vos domaines
          </h2>
          <p className="text-gray-600 text-sm">
            Dessinez vos domaines agricoles sur la carte. Chaque domaine peut
            contenir plusieurs serres.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Drawing Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Nouveau domaine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isDrawing && !pendingShape && (
                <Button onClick={startDrawing} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Dessiner un domaine
                </Button>
              )}

              {isDrawing && (
                <div className="space-y-3">
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                    Cliquez sur la carte pour dessiner les contours de votre
                    domaine
                  </div>
                  <Button
                    variant="outline"
                    onClick={cancelDrawing}
                    className="w-full"
                  >
                    Annuler
                  </Button>
                </div>
              )}

              {pendingShape && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="domainName">Nom du domaine</Label>
                    <Input
                      id="domainName"
                      value={newDomainName}
                      onChange={(e) => setNewDomainName(e.target.value)}
                      placeholder="Ex: Parcelle Nord"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Surface: {(pendingShape.area / 10000).toFixed(2)} hectares
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveDomain}
                      disabled={!newDomainName.trim()}
                      className="flex-1"
                    >
                      Enregistrer
                    </Button>
                    <Button variant="outline" onClick={cancelDrawing}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Domains List */}
          {domains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Domaines créés ({domains.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {domains.map((domain) => (
                    <div
                      key={domain.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDomainId === domain.id
                          ? "border-[#B4CC5F] bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleDomainSelect(domain.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {domain.name}
                          </h4>
                          <div className="text-sm text-gray-500">
                            {(domain.area / 10000).toFixed(2)} hectares
                          </div>
                          {domain.serres.length > 0 && (
                            <Badge variant="secondary" className="mt-1">
                              {domain.serres.length} serre
                              {domain.serres.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDomain(domain.id);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {selectedDomainId === domain.id && (
                        <div className="mt-2 text-sm text-blue-600">
                          ✓ Sélectionné - Vous pouvez maintenant créer des
                          serres dans ce domaine
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex space-x-3">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Retour
              </Button>
            )}
            <Button
              onClick={() => onContinue(domains)}
              disabled={domains.length === 0}
              className="flex-1"
            >
              Continuer vers les serres
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1">
        <GoogleMapsWrapper apiKey={GOOGLE_MAPS_API_KEY}>
          <MapComponent
            onShapeComplete={handleShapeComplete}
            existingShapes={getAllShapes()}
            drawingMode={isDrawing ? "domain" : null}
            className="w-full h-full"
          />
        </GoogleMapsWrapper>
      </div>
    </div>
  );
}
