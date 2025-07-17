@startuml
title Diagramme de Classes - Projet de Surveillance Agricole

'================== CLASSES ==================
class Entreprise {
  +id : int
  +nom : string
  +id_user : string
  +status_juridique : string
  +adresse : string
  +id_fiscale : int
  +email : string
}

abstract class User {
  +id : int
  +email : string
  +password : string
  +nom_user : string
  +type : string
  +id_role : int
  +id_entreprise : int
}

class Technicien
class TechnicienSuperieur
class DirecteurProduction

User <|-- Technicien
User <|-- TechnicienSuperieur
User <|-- DirecteurProduction

class Autorisation {
  +id : int
  +id_user : int
  +id_serre : int
  +access_serre : boolean
  +id_entreprise : int
}

class Domaine {
  +id : int
  +nom_domaine : string
  +id_group_cor : int
  +id_entreprise : int
  +id_Robot : int 
}

class Serre {
  +id : int
  +nom_Serre : string
  +id_group_cor : int
  +date_creation : date
  +id_domaine : int
}

class group_cor {
  +id : int
  +id_group_cor : int
  +point_x : float
  +point_y : float
  +ordre : int
}

class GuideCulture {
  +id : int
  +nom : string
  +rendement : float
  +variete : string
  +date_debut_saison : date
  +date_fin_saison : date
  +nombre_de_plants : int
  +id_serre : int
}

class Bilan {
  +id : int
  +nom_bilan : string
  +etat : string
  +id_group_cor : int
  +id_domaine : int
  +id_Serre  : int
  +id_ : int
}

class TypeTache {
  +id : int
  +nom : string
}

class Robot {
  +id : int
  +nom : string
  +Referance : string 
  +id_serre : int
}

class Intervention {
  +id : int
  +description : string
  +status : StatutIntervention
  +date_debut : date
  +date_fin : date
  +total_charges : float
  +id_user : int
  +id_serre : int
  +id_type_tache : int
  +valid : boolean
}

enum StatutIntervention {
  encours
  terminé
}

class Notification {
  +id : int
  +description : string
  +status : string
  +date : date
}

class MissionRobot {
  +id : int
  +id_serre : int
  +couleur_temate : boolean
  +calibre_temate : boolean
  +anomalie_temate : boolean
  +couleur_feulle : boolean
  +calibre_feulle : boolean
  +anomalie_feulle : boolean
  +taille_tige : float
  +resultat_couleur_serre : string
  +resultat_calibre_serre : string
  +resultat_malade : string
  +pourcentage_rendement_serre : float
  +date_debut : date
  +rep_jr : boolean
  +rep_sem : boolean
  +date_fin : date
}

class Alerte {
  +id : int
  +id_bilan : int
  +niveau : int
  +maladie : string
  +lien_image : string
  +x1, y1 : float
  +date : date
  +status : string
}

class Etat_bilan {
  +id : int
  +id_bilan : int
  +maladie : string
  +lien_image : string
  +température : float
  +humidité : float
  +luminosité : float
  +co2 : float
  +calibre : string
  +x1, y1 : float
  +date : date
}

class Rapport {
  +id : int
  +date : date
  +description : string
  +lien_pdf : string
  +id_Serre  : int
  +id_user : int
}

'================== ASSOCIATIONS (avec flèches) ==================

' Relations
Robot "1..*"<--"1" MissionRobot : concerne <
Entreprise "1" --> "1..*" DirecteurProduction : emploie >
Entreprise "1" *-- "0..*" Domaine
Bilan "1" --> "0..*" Alerte : déclenche >
Bilan "1" --> "0..*" Etat_bilan : contient >
Serre "1" --> "0..*" Rapport : génère >
Serre "1" *-- "0..*" Bilan

Technicien "1" --> "0..*" Autorisation : a >
TechnicienSuperieur "1" --> "0..*" Autorisation : Valider >
Technicien "1" --> "0..*" Intervention : effectue >
Technicien "1" --> "0..*" Rapport : rédige >

Domaine "1" *-- "0..*" Serre

Serre "1" --> "1" GuideCulture : utilise >
Serre "1" --> "0..*" Autorisation : est autorisée >
Serre "1" --> "0..*" Intervention : reçoit >

TypeTache "1" --> "0..*" Intervention : concerne >
MissionRobot "0..*" <-- "1" Serre : inspectée par <
User "1" <-- "0..*" Notification : reçoit <

Serre "1" --> "3..*" group_cor : est défini par >
Domaine "1" --> "3..*" group_cor : localise >
Bilan "1" --> "3..*" group_cor : couvre >

Intervention "1" <-- "0..*" Notification : concerne <


'Intervention --> StatutIntervention : utilise >


@enduml








@startuml
title [1] Installation du système

actor Admin

== Installation ==
@enduml


@startuml
title [2] Authentification Admin

actor Admin
participant UI
participant API
participant Service_IA
participant DB

Admin -> UI : Admin Register + password
UI -> API : POST /admin/login
API -> DB : Vérifie identifiants
DB --> API : OK / NOK
API --> UI : JWT ou erreur

== Fin Auth Admin ==
@enduml


@startuml
title [3] Enregistrement de l'entreprise

actor Admin
participant UI
participant API
participant Service_IA
participant DB

Admin -> UI : Remplit infos entreprise
UI -> API : POST /entreprise
API -> DB : Crée nouvelle entreprise
DB --> API : Confirme création
API --> UI : Affiche succès

== Fin Enregistrement ==
@enduml


@startuml
title [4] Accès Tableau de Bord

actor Admin
participant UI
participant API
participant Service_IA
participant DB

Admin -> UI : Se connecte au dashboard map
UI -> API : GET /dashboardmap
API -> DB : Récupère données clés
DB --> API : Données Indicateurs, cartes
API --> UI : Affiche dashboard

== Fin Dashboard ==
@enduml


@startuml
title [5] Ajout Domaine (coordonnées GPS)

actor Admin
participant UI
participant API
participant Service_IA
participant DB

Admin -> UI : Selectionner et Saisit coordonnées de Domaine
UI -> API : POST /domaine
API -> DB : Stocke domaine avec GPS
DB --> API : Confirme ajout
API --> UI : Domaine ajouté

== Fin Domaine ==
@enduml


@startuml
title [6] Ajout Serres (coordonnées GPS)

actor Admin
participant UI
participant API
participant Service_IA
participant DB

Admin -> UI : Selectionner et Saisit coordonnées de Serre (coords, surface, culture)
UI -> API : POST /Serre
API -> DB : Stocke Serre liée domaine
DB --> API : Confirme ajout
API --> UI : Parcelle OK

== Fin Parcelle ==
@enduml


@startuml
title [7] Définition Bilan (import localisation)

actor Admin
participant UI
participant API
participant Service_IA
participant DB

Admin -> UI : Selectionner et Saisit coordonnées de Bilan (coords, surface)
UI -> API : POST /bilan
API -> DB : Enregistre données (numéro, position)
DB --> API : Confirme
API --> UI : Bilan défini

== Fin Bilan ==
@enduml


@startuml
title [8] Création Profil Technicien

actor Admin
participant UI
participant API
participant Service_IA
participant DB

Admin -> UI : Remplit infos technicien
UI -> API : POST /user/technicien
API -> DB : Crée user + rôle technicien
DB --> API : Confirme création
API --> UI : Donne login/password

== Fin Profil Technicien ==
@enduml


@startuml
title [9] Authentification Technicien

actor Technicien
participant UI
participant API
participant Service_IA
participant DB

Technicien -> UI : Saisit login/pass
UI -> API : POST /login
API -> DB : Vérifie
DB --> API : JWT OK/NOK
API --> UI : Token ou erreur

== Fin Auth Technicien ==
@enduml

@startuml
actor Technicien
participant UI
participant API
participant Service_IA
participant DB

Robot -> UI : Envoyer l'image
UI -> API : POST /analyse/image
API -> Service_IA : Analyse(image)
Service_IA --> API : Résultats (calibre, maladie, etc.)
API -> DB : Stocke résultat d’analyse
API --> UI : Affiche résultats à l’utilisateur
@enduml

== Fin Supervision Robot ==
@enduml


'@startuml
'title [11] Sélection/Transparence Couches

'actor Technicien
'participant UI

'Technicien -> UI : Choisit couches carto (NDVI, drone…)
'UI -> UI : Applique transparence/filtre
'UI --> Technicien : Visualisation dynamique

'== Fin Couches ==
'@enduml


@startuml
title [12] Superposition Maps

actor Technicien
participant UI
participant API
participant Service_IA
participant DB

Technicien -> UI : Sélectionne cartes multi-couches
UI -> API : GET /carto
API -> DB : Récupère couches
DB --> API : Données maps
API --> UI : Superpose & rend visuel

== Fin Superposition ==
@enduml


@startuml
title [10] Supervision (Carto/Indicateurs)

actor Technicien
participant UI
participant API
participant Service_IA
participant DB

Technicien -> UI : Ouvre module supervision Camera
UI -> API : GET /supervision
API -> DB : Données caméras, capteurs
DB --> API : Retour data
API --> UI : Affiche indicateurs

== Fin Supervision ==
@enduml


@startuml
title [15] Suivi Exécution + Alertes

actor Technicien
participant UI
participant API
participant Service_IA
participant DB

Technicien -> UI : Suit tâches en cours
UI -> API : GET /taches
API -> DB : Vérifie statut
DB --> API : Statuts + alertes
API --> UI : Affiche progression + alerte si dépassement

== Fin Suivi ==
@enduml


@startuml
title [13] Visualisation Historique Serre

actor Technicien
participant UI
participant API
participant Service_IA
participant DB

Technicien -> UI : Demande historique serre
UI -> API : GET /historique/serre
API -> DB : Données passées
DB --> API : Données time-series
API --> UI : Affiche courbes/graphes

== Fin Historique ==
@enduml


@startuml
title [16] Action Robot (Mission)

actor Technicien
participant UI
participant API
participant Service_IA
participant "Robot"

Technicien -> UI : Crée tâche robot
UI -> API : POST /robot/tache
API -> "Robot" : Envoie instructions
"Robot" --> API : Accuse réception
API --> UI : Affiche état robot

== Fin Robot ==
@enduml



@startuml
title [18] Validation d'une Intervention

actor Technicien
participant UI
participant API
participant DB

Technicien -> UI : Créer interventions
UI -> API : GET /interventions?status=attente
API -> DB : Récupère interventions en attente
DB --> API : Liste des interventions
API --> UI : Affiche tableau à valider

== Fin Creation ==
@enduml



@startuml
title [18] Validation d'une Intervention

actor "Technicien Supérieur" as TechSup
participant UI
participant API
participant DB

TechSup -> UI : Accède aux interventions à valider
UI -> API : GET /interventions?status=attente
API -> DB : Récupère interventions en attente
DB --> API : Liste des interventions
API --> UI : Affiche tableau à valider

TechSup -> UI : Clique sur \"Valider\" ou \"Rejeter\"
UI -> API : PATCH /intervention/{id}
API -> DB : Met à jour le statut intervention
DB --> API : Confirmation OK
API --> UI : Intervention validée ou refusée

== Fin Validation ==
@enduml



@startuml
title [17] Génération Rapports

actor Technicien
participant UI
participant API
participant Service_IA
participant DB
participant FS

Technicien -> UI : Demande génération rapport PDF
UI -> API : POST /rapport/generer
API -> DB : Compile data
API -> FS : Génère PDF
FS --> API : Fichier prêt
API --> UI : Lien download/partage

== Fin Rapport ==
@enduml







@startuml
title Smart Greenhouse Robot - Project Architecture

' === Hardware ===
package "Robot Hardware" {
  [Jetson Nano] 
  [Arduino UNO]
  [High-Res Camera (ZED)]
  [Sensors: Temp, Humidity, Lidar, CO2, Ultrasonic]
  [4G Module]
  [Robot Chassis + Motors + Battery]
}

' === Software ===
package "Onboard Software Ubuntu JetPack SDK" {
  [ROS]
  [Python Scripts]
}

' === Communication ===
package "Communication 4G Network" {
  [API Flask HTTP Protocol]
  [MQTT/Kafka Protocol]
  [RTMP/WebRTC Protocol]
}

' === Cloud & Backend ===
package "Back Cloud Infrastructure AWS Cloud Docker Containers" {
  [MQTT/Kafka Broker]
  [PyTorch Model]
  [OpenCV]
  [Flask API Server]
  [PostgreSQL DB]
  [RTMP/WebRTC Middleware]
  [RTMP/WebRTC Streaming]
}

' === Cloud & Backend ===
package "Front Cloud Infrastructure AWS Cloud Docker Containers" {
  [React.js Dashboard]
  [Chart.js]
  [Video.js Player]
}

' === Connections ===
[ROS] --> [Jetson Nano] : Controls motors/sensors
[Python Scripts] --> [4G Module] : Controls motors/sensors
[Jetson Nano] --> [High-Res Camera (ZED)] : Video feed
' [4G Module] --> [Jetson Nano] : Data uplink

[Jetson Nano] --> [Sensors: Temp, Humidity, Lidar, CO2, Ultrasonic] : Data uplink
[Jetson Nano] --> [Arduino UNO] : Data uplink
[Arduino UNO] --> [Robot Chassis + Motors + Battery] : Data uplink
[Python Scripts] --> [ROS] : Hardware Control

[OpenCV] --> [PyTorch Model]
[4G Module] --> [MQTT/Kafka Protocol] : Publishes sensor data
[MQTT/Kafka Protocol] --> [MQTT/Kafka Broker] : Publishes sensor data
[MQTT/Kafka Broker] --> [React.js Dashboard] : Real Time Displays data
[React.js Dashboard] --> [API Flask HTTP Protocol] : Displays data
[4G Module] --> [API Flask HTTP Protocol] : CRUD
[API Flask HTTP Protocol] --> [Flask API Server] : CRUD
[Flask API Server] --> [PostgreSQL DB] : CRUD
[4G Module] --> [RTMP/WebRTC Protocol] : Streams video
[RTMP/WebRTC Protocol] --> [RTMP/WebRTC Middleware] : Streams video
[RTMP/WebRTC Middleware] --> [OpenCV] : Analyse video
[RTMP/WebRTC Middleware] --> [PostgreSQL DB] : Save Etat
[RTMP/WebRTC Middleware] --> [RTMP/WebRTC Streaming] : Live video
[Video.js Player] --> [RTMP/WebRTC Streaming] : Live video
[Chart.js] --> [React.js Dashboard] : Graphs

@enduml






@startuml
!theme vibrant
left to right direction

' --- Acteurs Principaux ---
actor Directeur
actor "Technicien Supérieur" as TechSup
actor Technicien

' --- Acteur Secondaire ---
actor Robot <<secondary>>

' =============================================
' ===          RÔLE : DIRECTEUR             ===
' =============================================
package "Rôle : Directeur" #LightCyan {
  usecase "Gérer Entreprises (CRUD)" as UC_Entreprises
  usecase "Gérer Utilisateurs (CRUD)" as UC_Users
  usecase "Gérer Autorisations (CRUD)" as UC_Autorisations
  usecase "Gérer Domaines (CRUD)" as UC_Domaines
  usecase "Gérer Parcelles/Serres (CRUD)" as UC_Serres_Dir
  usecase "Gérer Guide de Culture (CRUD)" as UC_Guide
  usecase "Gérer Bilans (CRUD)" as UC_Bilans_Dir
  usecase "Gérer Interventions (CRUD)" as UC_Interv
  usecase "Consulter Types de Tâches" as UC_Taches
  usecase "Gérer Alertes (RUD)" as UC_AlertesDir
  usecase "Consulter/Gérer Rapports" as UC_RapportsDir

  Directeur --> UC_Entreprises
  Directeur --> UC_Users
  Directeur --> UC_Autorisations
  Directeur --> UC_Domaines
  Directeur --> UC_Serres_Dir
  Directeur --> UC_Guide
  Directeur --> UC_Bilans_Dir
  Directeur --> UC_Interv
  Directeur --> UC_Taches
  Directeur --> UC_AlertesDir
  Directeur --> UC_RapportsDir
}

' =============================================
' ===    RÔLE : TECHNICIEN SUPÉRIEUR        ===
' =============================================
package "Rôle : Technicien Supérieur" #LightGreen {
  usecase "Gérer Parcelles/Serres (CRUD)" as UC_SerresTS
  usecase "Gérer Guide de Culture" as UC_GuideTS
  usecase "Gérer Bilans (CRUD)" as UC_BilansTS
  usecase "Valider Interventions" as UC_ValidInterv
  usecase "Gérer Alertes (RUD)" as UC_AlertesTS
  usecase "Consulter Rapports" as UC_RapportsTS

  TechSup --> UC_SerresTS
  TechSup --> UC_GuideTS
  TechSup --> UC_BilansTS
  TechSup --> UC_ValidInterv
  TechSup --> UC_AlertesTS
  TechSup --> UC_RapportsTS
}

' =============================================
' ===          RÔLE : TECHNICIEN            ===
' =============================================
package "Rôle : Technicien" #LightYellow {
  usecase "Consulter Parcelles/Serres" as UC_SerresT
  usecase "Saisir Guide de Culture" as UC_GuideT
  usecase "Gérer Bilans (RUD)" as UC_BilansT
  usecase "Saisir Interventions" as UC_IntervT
  usecase "Consulter Tâches" as UC_TachesT
  usecase "Gérer Alertes (RUD)" as UC_AlertesT
  usecase "Rédiger Rapports" as UC_RapportsT
  
  ' --- Sous-fonctionnalités spécifiques ---
  usecase "consulter la caméra " as UC_Image
  usecase "Contrôler le Robot" as UC_RobotControl
  usecase "consulter les données  de sensor " as UC_Env

  Technicien --> UC_SerresT
  Technicien --> UC_GuideT
  Technicien --> UC_BilansT
  Technicien --> UC_IntervT
  Technicien --> UC_TachesT
  Technicien --> UC_AlertesT
  Technicien --> UC_RapportsT
  
  Technicien --> UC_Image
  Technicien --> UC_RobotControl
  Technicien --> UC_Env
  
  ' --- Le Robot est un acteur secondaire qui participe au cas d'usage ---
  UC_AlertesT -- Robot : << créer >>
}

' =============================================
' === RELATIONS ENTRE CAS D'UTILISATION     ===
' =============================================
UC_IntervT ..> UC_ValidInterv : <<soumet pour validation>>
UC_AlertesT ..> UC_AlertesTS : <<remonte>>
UC_AlertesTS ..> UC_AlertesDir : <<remonte>>
UC_RapportsT ..> UC_RapportsTS : <<est consulté par>>
UC_RapportsTS ..> UC_RapportsDir : <<est consulté par>>

@enduml












C:.
│   .gitignore
│   backend.Dockerfile
│   docker-compose.yml
│   frontend.Dockerfile
│   README.md
│
├───backend
│   │   .env
│   │   copy.env
│   │   main.py
│   │   requirements.txt
│   │
│   ├───app
│   │   │   __init__.py
│   │   │
│   │   ├───controllers
│   │   │       alerte.py
│   │   │       autorisation.py
│   │   │       bilan.py
│   │   │       domaine.py
│   │   │       entreprise.py
│   │   │       etat_bilans.py
│   │   │       guide_culture.py
│   │   │       intervention.py
│   │   │       mission_robot.py
│   │   │       notification.py
│   │   │       rapport.py
│   │   │       robot.py
│   │   │       serre.py
│   │   │       type_tache.py
│   │   │       user.py
│   │   │
│   │   ├───models
│   │   │       alerte.py
│   │   │       autorisation.py
│   │   │       bilan.py
│   │   │       domaine.py
│   │   │       entreprise.py
│   │   │       etat_bilans.py
│   │   │       guide_culture.py
│   │   │       intervention.py
│   │   │       mission_robot.py
│   │   │       notification.py
│   │   │       rapport.py
│   │   │       robot.py
│   │   │       serre.py
│   │   │       type_tache.py
│   │   │       user.py
│   │   │       __init__.py
│   │   │
│   │   ├───routes
│   │   │       routes.py
│   │   │
│   │   ├───services
│   │   │       robotcontrole_service.py
│   │   │       sensors_realtime_service.py
│   │   │       simulator_video_analysis_service.py
│   │   │       video_analysis_service.py
│   │   │       video_middleware.py
│   │   │       video_streaming_service.py
│   │   │
│   │   └───utils
│   │           security.py
│   │
│   └───database
│           config.py
│           init.sql
│
├───docker
├───front-end-ui
│   │   .gitignore
│   │   package-lock.json
│   │   package.json
│   │   README.md
│   │
│   ├───public
│   │       favicon.ico
│   │       index.html
│   │       logo192.png
│   │       logo512.png
│   │       manifest.json
│   │       robots.txt
│   │
│   └───src
│           App.css
│           App.js
│           App.test.js
│           index.css
│           index.js
│           logo.svg
│           reportWebVitals.js
│           setupTests.js
│
├───ia
│   ├───dataset
│   │   ├───images
│   │   └───labels
│   ├───models
│   │       tomato_disease_model.pth
│   │
│   └───train
│           preprocessing.py
│           train.py
│
└───robot
    ├───arduino
    │       battery.ino
    │       motor_control.ino
    │       sensor_interface.ino
    │
    ├───jetson
    │   │   api_client.py
    │   │   camera_stream.py
    │   │   sensors_client.py
    │   │
    │   ├───config
    │   │   └───launch_files
    │   └───ros_navigation
    │           navigation_node.py
    │
    └───jetson_client_simulator
            api_client_simulator.py
            camera_simulator.py
            sensors_simulator.py