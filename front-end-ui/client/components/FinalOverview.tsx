import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  MapPin,
  Home,
  Users,
  Leaf,
  Calendar,
  Eye,
  Building,
  CheckCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import GoogleMapsWrapper from "./GoogleMapsWrapper";
import { Label } from "@/components/ui/label";


interface Domain {
  id: string;
  name: string;
  area: number;
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
    plantingDate?: Date;
    harvestDate?: Date;
    irrigationType?: string;
    notes?: string;
  };
}

interface Technician {
  id: string;
  fullName: string;
  birthday: Date;
  telephone: string;
  cin: string;
  email: string;
  password: string;
  role: "technicien_superieur" | "technicien";
  supervisorId?: string;
}

interface SerreAssignment {
  serreId: string;
  supervisorIds: string[];
}

interface CompanyInfo {
  companyName: string;
  companyAddress: string;
  cie: string;
  legalStatus: string;
  companyEmail: string;
}

interface FinalOverviewProps {
  companyInfo: CompanyInfo;
  domains: Domain[];
  technicians: Technician[];
  serreAssignments?: SerreAssignment[];
  onComplete: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

type SelectedItem = {
  type: "company" | "domain" | "serre";
  id: string;
  name: string;
  center?: google.maps.LatLng;
} | null;



export default function FinalOverview({
  companyInfo,
  domains,
  technicians,
  serreAssignments = [],
  onComplete,
  onBack,
  isSubmitting = false,
}: FinalOverviewProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Calculate statistics
  const totalDomains = domains.length;
  const totalSerres = domains.reduce((total, domain) => total + domain.serres.length, 0);
  const totalDomainArea = domains.reduce((total, domain) => total + domain.area, 0);
  const totalSerreArea = domains.reduce((total, domain) => 
    total + domain.serres.reduce((serreTotal, serre) => serreTotal + serre.surface, 0), 0
  );
  const totalTechnicians = technicians.length;
  const totalSupervisors = technicians.filter(t => t.role === "technicien_superieur").length;
  const totalRegularTechnicians = technicians.filter(t => t.role === "technicien").length;
  const assignedTechnicians = technicians.filter(t => t.role === "technicien" && t.id_assigned).length;
  
  // Calculate assigned serres from serreAssignments data
  const assignedSerres = serreAssignments.reduce((total, assignment) => {
    return total + assignment.supervisorIds.length;
  }, 0);
  
  const unassignedSerres = totalSerres - assignedSerres;
  
  console.log("FinalOverview calculations:", {
    totalSerres,
    assignedSerres,
    unassignedSerres,
    techniciansCount: technicians.length,
    serreAssignments: serreAssignments.map(a => ({
      serreId: a.serreId,
      supervisorIds: a.supervisorIds
    }))
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 46.603354, lng: 1.888334 }, // Center of France
      zoom: 6,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
    });

    setMap(newMap);

    // Render all domains and serres on map
    domains.forEach((domain) => {
      // Render domain
      const domainPolygon = new google.maps.Polygon({
        paths: domain.path,
        fillColor: "#B4CC5F",
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: "#8FA53A",
        clickable: true,
        zIndex: 1,
      });

      domainPolygon.setMap(newMap);

      // Add domain click listener
      domainPolygon.addListener("click", () => {
        setSelectedItem({
          type: "domain",
          id: domain.id,
          name: domain.name,
          center: domain.center,
        });
      });

      // Render serres in this domain
      domain.serres.forEach((serre) => {
        const serrePolygon = new google.maps.Polygon({
          paths: serre.position,
          fillColor: "#FF6B6B",
          fillOpacity: 0.4,
          strokeWeight: 2,
          strokeColor: "#E53E3E",
          clickable: true,
          zIndex: 2,
        });

        serrePolygon.setMap(newMap);

        // Add serre click listener
        serrePolygon.addListener("click", () => {
          setSelectedItem({
            type: "serre",
            id: serre.id,
            name: serre.nom,
            center: serre.center,
          });
        });
      });
    });

    // Fit map to show all domains if any exist
    if (domains.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      domains.forEach((domain) => {
        domain.path.forEach((point) => bounds.extend(point));
      });
      newMap.fitBounds(bounds);
    }
  }, [mapRef.current, domains]);

  // Handle item selection and map centering
  const handleItemSelect = (item: SelectedItem) => {
    setSelectedItem(item);
    if (item?.center && map) {
      map.setCenter(item.center);
      map.setZoom(item.type === "serre" ? 18 : 15);
    }
  };

  const getTechnicianForSerre = (serreId: string | number) => {
    const serreIdStr = serreId.toString();
    // Find serre assignment for this serre
    const assignment = serreAssignments.find(a => a.serreId === serreIdStr);
    if (!assignment) return null;
    
    // Find the first supervisor assigned to this serre
    const supervisorId = assignment.supervisorIds[0];
    if (!supervisorId) return null;
    
    // Find the technician with this ID
    return technicians.find(tech => tech.id === supervisorId);
  };

  const getDomainsWithSerres = () => {
    return domains.map((domain) => ({
      ...domain,
      serresWithTechnicians: domain.serres.map((serre) => ({
        ...serre,
        assignedTechnician: getTechnicianForSerre(serre.id),
      })),
    }));
  };

  return (
    <div className="h-screen flex">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center mb-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Aperçu final</h2>
              <p className="text-gray-600 text-sm">
                Vérifiez votre configuration avant finalisation
              </p>
            </div>
          </div>

          {/* Company Summary */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Building className="h-5 w-5 text-[#B4CC5F]" />
                <h3 className="font-semibold text-gray-900">
                  {companyInfo.companyName}
                </h3>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{companyInfo.companyAddress}</div>
                <div>CIE: {companyInfo.cie}</div>
                <div>{companyInfo.companyEmail}</div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-lg font-bold text-blue-600">
                {domains.length}
              </div>
              <div className="text-xs text-blue-600">Domaines</div>
              <div className="text-xs text-gray-500">
                {(totalDomainArea / 10000).toFixed(1)} ha
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-lg font-bold text-green-600">
                {totalSerres}
              </div>
              <div className="text-xs text-green-600">Serres</div>
              <div className="text-xs text-gray-500">
                {totalSerreArea.toFixed(0)} m²
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <div className="text-lg font-bold text-purple-600">
                {technicians.length}
              </div>
              <div className="text-xs text-purple-600">Techniciens</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <div className="text-lg font-bold text-orange-600">
                {assignedSerres}
              </div>
              <div className="text-xs text-orange-600">Serres assignées</div>
              {unassignedSerres > 0 && (
                <div className="text-xs text-red-500">
                  {unassignedSerres} non assignées
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Domains and Serres */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Domaines et Serres
              </h3>

              {getDomainsWithSerres().map((domain) => (
                <Card key={domain.id} className="mb-3">
                  <CardContent className="p-4">
                    <button
                      onClick={() =>
                        handleItemSelect({
                          type: "domain",
                          id: domain.id,
                          name: domain.name,
                          center: domain.center,
                        })
                      }
                      className="w-full text-left hover:bg-gray-50 rounded p-2 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-[#B4CC5F]" />
                          <span className="font-medium">{domain.name}</span>
                          {selectedItem?.type === "domain" &&
                            selectedItem.id === domain.id && (
                              <Eye className="h-4 w-4 text-blue-500" />
                            )}
                        </div>
                        <Badge variant="outline">
                          {(domain.area / 10000).toFixed(1)} ha
                        </Badge>
                      </div>
                    </button>

                    {domain.serresWithTechnicians.length > 0 && (
                      <div className="mt-3 ml-6 space-y-2">
                        {domain.serresWithTechnicians.map((serre) => (
                          <button
                            key={serre.id}
                            onClick={() =>
                              handleItemSelect({
                                type: "serre",
                                id: serre.id,
                                name: serre.nom,
                                center: serre.center,
                              })
                            }
                            className="w-full text-left hover:bg-gray-50 rounded p-2 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Home className="h-3 w-3 text-red-500" />
                                <span className="text-sm">{serre.nom}</span>
                                {selectedItem?.type === "serre" &&
                                  selectedItem.id === serre.id && (
                                    <Eye className="h-3 w-3 text-blue-500" />
                                  )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  {serre.variety}
                                </Badge>
                                {serre.assignedTechnician && (
                                  <Badge variant="outline" className="text-xs">
                                    {
                                      serre.assignedTechnician.fullName.split(
                                        " ",
                                      )[0]
                                    }
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Technicians Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Techniciens ({totalTechnicians})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Supervisors */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      Techniciens Supérieurs ({totalSupervisors})
                    </h4>
                    <div className="space-y-2">
                      {technicians
                        .filter((tech) => tech.role === "technicien_superieur")
                        .map((tech) => (
                          <div key={tech.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{tech.fullName}</p>
                              <p className="text-xs text-gray-600">{tech.email}</p>
                            </div>
                            <Badge variant="default" className="text-xs">
                              Superviseur
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Regular Technicians */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      Techniciens ({totalRegularTechnicians})
                    </h4>
                    <div className="space-y-2">
                      {technicians
                        .filter((tech) => tech.role === "technicien")
                        .map((tech) => {
                          const supervisor = technicians.find(t => t.id === tech.supervisorId);
                          return (
                            <div key={tech.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                              <div>
                                <p className="font-medium text-sm">{tech.fullName}</p>
                                <p className="text-xs text-gray-600">{tech.email}</p>
                                {supervisor && (
                                  <p className="text-xs text-blue-600">
                                    Supervisé par: {supervisor.fullName}
                                  </p>
                                )}
                              </div>
                              <Badge 
                                variant={tech.supervisorId ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                {tech.supervisorId ? "Assigné" : "Non assigné"}
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Hierarchy Summary */}
                {totalSupervisors > 0 && totalRegularTechnicians > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-sm text-gray-700 mb-2">
                      Résumé de la hiérarchie:
                    </h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Techniciens assignés:</span>
                        <span className="font-medium ml-2">{assignedTechnicians}/{totalRegularTechnicians}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Taux d'assignation:</span>
                        <span className="font-medium ml-2">
                          {totalRegularTechnicians > 0 
                            ? Math.round((assignedTechnicians / totalRegularTechnicians) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Serre Assignments Section */}
            {serreAssignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    Assignations des Serres ({assignedSerres})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {serreAssignments.map((assignment) => {
                      const serre = domains
                        .flatMap(d => d.serres)
                        .find(s => s.id === assignment.serreId);
                      const assignedSupervisors = technicians
                        .filter(t => t.role === "technicien_superieur" && assignment.supervisorIds.includes(t.id));

                      if (!serre) return null;

                      return (
                        <div key={assignment.serreId} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{serre.nom}</span>
                              <Badge variant="outline" className="text-xs">
                                {domains.find(d => d.serres.some(s => s.id === serre.id))?.name}
                              </Badge>
                            </div>
                            <Badge variant="default" className="text-xs">
                              {assignedSupervisors.length} superviseur(s)
                            </Badge>
                          </div>
                          
                          <div className="ml-6">
                            <Label className="text-sm text-gray-600">
                              Techniciens Supérieurs assignés:
                            </Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {assignedSupervisors.map((supervisor) => (
                                <Badge key={supervisor.id} variant="secondary" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {supervisor.fullName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center text-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span className="text-sm font-medium">Configuration prête</span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              Votre entreprise est configurée et prête à utiliser la plateforme
            </div>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              Retour
            </Button>
            <Button
              onClick={onComplete}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalisation...
                </>
              ) : (
                "Finaliser la configuration"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 relative">
        <GoogleMapsWrapper>
          <div ref={mapRef} className="w-full h-full" />
        </GoogleMapsWrapper>

        {/* Selected Item Info Overlay */}
        {selectedItem && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center space-x-2 mb-2">
              {selectedItem.type === "domain" ? (
                <MapPin className="h-4 w-4 text-[#B4CC5F]" />
              ) : (
                <Home className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">{selectedItem.name}</span>
            </div>

            {selectedItem.type === "domain" && (
              <div className="text-sm text-gray-600">
                {(() => {
                  const domain = domains.find((d) => d.id === selectedItem.id);
                  return domain ? (
                    <div>
                      <div>
                        Surface: {(domain.area / 10000).toFixed(2)} hectares
                      </div>
                      <div>
                        {domain.serres.length} serre
                        {domain.serres.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {selectedItem.type === "serre" && (
              <div className="text-sm text-gray-600">
                {(() => {
                  const serre = domains
                    .flatMap((d) => d.serres)
                    .find((s) => s.id === selectedItem.id);
                  const technician = getTechnicianForSerre(selectedItem.id);
                  return serre ? (
                    <div>
                      <div>Variété: {serre.variety}</div>
                      <div>Surface: {serre.surface.toFixed(0)} m²</div>
                      <div>Rendement: {serre.yield} kg/m²</div>
                      {technician && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <div className="font-medium text-blue-900">
                            Assigné à:
                          </div>
                          <div className="text-blue-700">
                            {technician.fullName}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
 
