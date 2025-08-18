#!/usr/bin/env python3
"""
Comprehensive database seeder for GreenerTech
Run this from the backend directory or inside the Docker container
"""

import sys
import os
from datetime import datetime, timedelta, timezone, date
from random import randint, choice, uniform

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from werkzeug.security import generate_password_hash

from app import create_app
from database.config import db

# Models
from app.models.user import User
from app.models.entreprise import Entreprise
from app.models.domaine import Domaine
from app.models.serre import Serre
from app.models.points_gps import GroupCor
from app.models.bilan import Bilan
from app.models.autorisation_serre import Autorisation_serre
from app.models.alerte import Alerte
from app.models.robot import Robot
from app.models.mission_robot import MissionRobot
from app.models.type_tache import TypeTache
from app.models.intervention import Intervention, StatutInterventionEnum
from app.models.rapport import Rapport
from app.models.notification import Notification
from app.models.etat_bilan import Etat_bilan
from app.models.guide_culture import GuideCulture
from app.models.autorisation_domaine import Autorisation_domaine
from app.models.autorisation_bilan import Autorisation_bilan


def create_polygon(group_id: int, center_lat: float, center_lng: float, size_deg: float = 0.001):
    """Create a simple square polygon"""
    existing = GroupCor.query.filter_by(id_group_cor=group_id).first()
    if existing:
        print(f"✓ Polygon {group_id} exists")
        return
    
    points = [
        (center_lat - size_deg, center_lng - size_deg, 1),
        (center_lat - size_deg, center_lng + size_deg, 2),
        (center_lat + size_deg, center_lng + size_deg, 3),
        (center_lat + size_deg, center_lng - size_deg, 4),
    ]
    for lat, lng, ordre in points:
        db.session.add(GroupCor(id_group_cor=group_id, point_x=lat, point_y=lng, ordre=ordre))
    print(f"✓ Created polygon {group_id}")


def create_user(email: str, role: str, name: str):
    """Create or get existing user"""
    user = User.query.filter_by(email=email).first()
    if user:
        print(f"✓ User {email} exists")
        return user
    
    user = User(
        name=name,
        email=email,
        password=generate_password_hash("Password123!"),
        role=role,
        directeur_valide=True,
        email_valide=True,
        setup_completed=True,
        created_at=datetime.now(timezone(timedelta(hours=1))),
        updated_at=datetime.now(timezone(timedelta(hours=1))),
    )
    db.session.add(user)
    db.session.flush()
    print(f"✓ Created user: {email}")
    return user


def create_company(director: User):
    """Create or get existing company"""
    company = Entreprise.query.filter_by(id_user=director.id).first()
    if company:
        print(f"✓ Company exists for {director.email}")
        return company
    
    company = Entreprise(
        nom="GreenFarm Co.",
        id_user=director.id,
        status_juridique="SARL",
        adresse="123 Rue Agricole",
        cie="CIE-12345",
        id_fiscale="IF-987654",
        email="contact@greenfarm.example",
    )
    db.session.add(company)
    db.session.flush()
    director.id_entreprise = company.id
    print(f"✓ Created company: {company.nom}")
    return company


def create_domain(company: Entreprise, name: str, group_id: int, center_lat: float, center_lng: float):
    """Create or get existing domain"""
    domaine = Domaine.query.filter_by(nom=name, id_entreprise=company.id).first()
    if domaine:
        print(f"✓ Domain {name} exists")
        return domaine
    
    create_polygon(group_id, center_lat, center_lng, size_deg=0.002)
    domaine = Domaine(
        nom=name,
        id_group_cor=group_id,
        surface=10.5,
        center_lat=center_lat,
        center_lng=center_lng,
        id_entreprise=company.id,
    )
    db.session.add(domaine)
    db.session.flush()
    print(f"✓ Created domain: {name}")
    return domaine


def create_serre(domaine: Domaine, name: str, group_id: int, center_lat: float, center_lng: float):
    """Create or get existing serre"""
    serre = Serre.query.filter_by(nom=name, id_domaine=domaine.id).first()
    if serre:
        print(f"✓ Serre {name} exists")
        return serre
    
    create_polygon(group_id, center_lat, center_lng, size_deg=0.001)
    serre = Serre(
        nom=name,
        id_group_cor=group_id,
        surface=2.5,
        center_lat=center_lat,
        center_lng=center_lng,
        id_domaine=domaine.id,
    )
    db.session.add(serre)
    db.session.flush()
    print(f"✓ Created serre: {name}")
    return serre


def create_bilan(serre: Serre, name: str, group_id: int):
    """Create or get existing bilan"""
    bilan = Bilan.query.filter_by(nom=name, id_serre=serre.id).first()
    if bilan:
        print(f"✓ Bilan {name} exists")
        return bilan
    
    center_lat = serre.center_lat or 45.764
    center_lng = serre.center_lng or 4.835
    create_polygon(group_id, center_lat, center_lng, size_deg=0.0006)
    bilan = Bilan(
        nom=name,
        id_group_cor=group_id,
        surface=1.1,
        center_lat=center_lat,
        center_lng=center_lng,
        id_serre=serre.id,
    )
    db.session.add(bilan)
    db.session.flush()
    print(f"✓ Created bilan: {name}")
    return bilan


def create_robot(name: str, reference: str):
    """Create or get existing robot"""
    robot = Robot.query.filter_by(nom=name).first()
    if robot:
        print(f"✓ Robot {name} exists")
        return robot
    
    robot = Robot(
        nom=name,
        referance=reference
    )
    db.session.add(robot)
    db.session.flush()
    print(f"✓ Created robot: {name}")
    return robot


def create_type_tache(name: str):
    """Create or get existing task type"""
    type_tache = TypeTache.query.filter_by(nom=name).first()
    if type_tache:
        print(f"✓ Task type {name} exists")
        return type_tache
    
    type_tache = TypeTache(nom=name)
    db.session.add(type_tache)
    db.session.flush()
    print(f"✓ Created task type: {name}")
    return type_tache


def create_etat_bilan(bilan: Bilan, temperature: float = 25.0, humidite: float = 60.0):
    """Create or get existing bilan state measurement"""
    etat = Etat_bilan.query.filter_by(id_bilan=bilan.id).first()
    if etat:
        print(f"✓ Bilan state for {bilan.nom} exists")
        return etat
    
    etat = Etat_bilan(
        id_bilan=bilan.id,
        temperature=temperature,
        humidite=humidite,
        luminosite=uniform(800.0, 1200.0),
        co2=uniform(400.0, 600.0),
        rendement=uniform(0.7, 0.9)
    )
    db.session.add(etat)
    db.session.flush()
    print(f"✓ Created bilan state for {bilan.nom}")
    return etat


def create_guide_culture(nom: str, variete: str, serre: Serre):
    """Create or get existing culture guide"""
    guide = GuideCulture.query.filter_by(nom=nom).first()
    if guide:
        print(f"✓ Culture guide {nom} exists")
        return guide
    
    from datetime import date
    guide = GuideCulture(
        nom=nom,
        variete=variete,
        rendement=uniform(15.0, 25.0),
        date_debut_saison=date(2025, 1, 1),
        date_fin_saison=date(2025, 12, 31),
        nombre_de_plants=randint(50, 200),
        id_serre=serre.id
    )
    db.session.add(guide)
    db.session.flush()
    print(f"✓ Created culture guide: {nom}")
    return guide


def create_mission_robot(robot: Robot, serre: Serre, rep_jr: int, rep_sem: int, jour: int, heure: int, minute: int, bilans: list = None):
    """Create or get existing robot mission"""
    mission = MissionRobot.query.filter_by(
        id_robot=robot.id, 
        id_serre=serre.id,
        jour=jour,
        heure=heure,
        minute=minute
    ).first()
    
    if mission:
        print(f"✓ Mission for robot {robot.nom} on {serre.nom} exists")
        return mission
    
    now = datetime.now(timezone(timedelta(hours=1)))
    mission = MissionRobot(
        id_robot=robot.id,
        id_serre=serre.id,
        rep_jr=rep_jr,
        rep_sem=rep_sem,
        jour=jour,
        heure=heure,
        minute=minute,
        date_debut=now,
        date_fin=now + timedelta(days=30),
        executed=False,
        bilans=bilans or []
    )
    db.session.add(mission)
    db.session.flush()
    print(f"✓ Created mission for robot {robot.nom} on {serre.nom}")
    return mission


def create_intervention(user: User, serre: Serre, type_tache: TypeTache, description: str, status: str = "encours"):
    """Create or get existing intervention"""
    intervention = Intervention.query.filter_by(
        id_user=user.id,
        id_serre=serre.id,
        description=description
    ).first()
    
    if intervention:
        print(f"✓ Intervention {description} exists")
        return intervention
    
    now = date.today()
    intervention = Intervention(
        description=description,
        status=status,
        date_debut=now,
        date_fin=now + timedelta(days=3) if status == "terminé" else None,
        total_charges=uniform(50.0, 200.0),
        id_user=user.id,
        id_serre=serre.id,
        id_type_tache=type_tache.id,
        valid=True
    )
    db.session.add(intervention)
    db.session.flush()
    print(f"✓ Created intervention: {description}")
    return intervention


def create_rapport(intervention: Intervention, titre: str, contenu: str):
    """Create or get existing report"""
    rapport = Rapport.query.filter_by(
        description=titre
    ).first()
    
    if rapport:
        print(f"✓ Report {titre} exists")
        return rapport
    
    rapport = Rapport(
        description=titre,
        date=date.today(),
        id_serre=intervention.id_serre,
        user_id=intervention.id_user
    )
    db.session.add(rapport)
    db.session.flush()
    print(f"✓ Created report: {titre}")
    return rapport


def create_notification(user: User, message: str, type_notif: str = "info"):
    """Create or get existing notification"""
    notification = Notification.query.filter_by(
        id_user=user.id,
        description=message
    ).first()
    
    if notification:
        print(f"✓ Notification {message[:30]}... exists")
        return notification
    
    notification = Notification(
        id_user=user.id,
        description=message,
        type_notification=type_notif,
        status="non_vue"
    )
    db.session.add(notification)
    db.session.flush()
    print(f"✓ Created notification for {user.email}")
    return notification


def create_authorization(user: User, serre: Serre):
    """Create serre authorization if it doesn't exist"""
    if not Autorisation_serre.query.filter_by(id_user=user.id, id_serre=serre.id).first():
        db.session.add(Autorisation_serre(id_user=user.id, id_serre=serre.id))
        print(f"✓ Created authorization for {user.email} on {serre.nom}")
    else:
        print(f"✓ Authorization exists for {user.email} on {serre.nom}")


def create_domain_authorization(user: User, domaine: Domaine):
    """Create domain authorization if it doesn't exist"""
    if not Autorisation_domaine.query.filter_by(id_user=user.id, id_domaine=domaine.id).first():
        db.session.add(Autorisation_domaine(id_user=user.id, id_domaine=domaine.id))
        print(f"✓ Created domain authorization for {user.email} on {domaine.nom}")
    else:
        print(f"✓ Domain authorization exists for {user.email} on {domaine.nom}")


def create_bilan_authorization(user: User, bilan: Bilan):
    """Create bilan authorization if it doesn't exist"""
    if not Autorisation_bilan.query.filter_by(id_user=user.id, id_bilan=bilan.id).first():
        db.session.add(Autorisation_bilan(id_user=user.id, id_bilan=bilan.id))
        print(f"✓ Created bilan authorization for {user.email} on {bilan.nom}")
    else:
        print(f"✓ Bilan authorization exists for {user.email} on {bilan.nom}")


def create_alerts(bilan: Bilan, count: int = 5):
    """Create alerts for a bilan if none exist"""
    if Alerte.query.filter_by(id_bilan=bilan.id).first():
        print(f"✓ Alerts exist for {bilan.nom}")
        return
    
    maladies = ["Mildiou détecté", "Oïdium suspecté", "Stress hydrique", "Température élevée", "Carence en azote"]
    statuses = ["non résolue", "résolue"]
    
    now = datetime.now(timezone(timedelta(hours=1)))
    for i in range(count):
        alerte = Alerte(
            id_bilan=bilan.id,
            status_alert=randint(0, 2),  # 0=Low/Faible, 1=Medium/Moyenne, 2=High/Critique
            maladie=choice(maladies),
            lien_image=f"https://picsum.photos/seed/gt{bilan.id * 100 + i}/400/300",
            x1=uniform(0.0, 1.0),
            y1=uniform(0.0, 1.0),
            date=now - timedelta(hours=i * 6),
            status=choice(statuses),
        )
        db.session.add(alerte)
    print(f"✓ Created {count} alerts for {bilan.nom}")


def main():
    """Main seeding function"""
    print("🌱 Starting GreenerTech comprehensive database seeding...")
    
    try:
        app = create_app()
        with app.app_context():
            # Create tables if they don't exist
            db.create_all()
            print("✓ Database tables ready")
            
            # 1. Users
            print("\n👥 Creating users...")
            director = create_user("director@greenfarm.dev", "directeur", "Alice Director")
            tech_sup = create_user("techsup@greenfarm.dev", "technicien_superieur", "Bob TechSup")
            tech = create_user("tech@greenfarm.dev", "technicien", "Charlie Tech")
            tech2 = create_user("tech2@greenfarm.dev", "technicien", "Diana Tech")
            
            # 2. Company
            print("\n🏢 Creating company...")
            company = create_company(director)
            tech_sup.id_entreprise = company.id
            tech.id_entreprise = company.id
            tech2.id_entreprise = company.id
            
            # 3. Domaines
            print("\n🗺️ Creating domaines...")
            domaine_a = create_domain(company, "Domaine Nord", 1001, 45.764, 4.835)
            domaine_b = create_domain(company, "Domaine Sud", 1002, 45.754, 4.845)
            domaine_c = create_domain(company, "Domaine Est", 1003, 45.774, 4.855)
            
            # 4. Serres
            print("\n🏗️ Creating serres...")
            serre_1 = create_serre(domaine_a, "Serre A1", 2001, 45.7645, 4.8355)
            serre_2 = create_serre(domaine_b, "Serre B1", 2002, 45.7545, 4.8455)
            serre_3 = create_serre(domaine_c, "Serre C1", 2003, 45.7745, 4.8555)
            serre_4 = create_serre(domaine_a, "Serre A2", 2004, 45.7648, 4.8358)
            
            # 5. Bilans
            print("\n📊 Creating bilans...")
            bilan_1 = create_bilan(serre_1, "Bilan A1-2025-01", 3001)
            bilan_2 = create_bilan(serre_1, "Bilan A1-2025-02", 3002)
            bilan_3 = create_bilan(serre_2, "Bilan B1-2025-01", 3003)
            bilan_4 = create_bilan(serre_3, "Bilan C1-2025-01", 3004)
            bilan_5 = create_bilan(serre_4, "Bilan A2-2025-01", 3005)
            
            # 6. Robots
            print("\n🤖 Creating robots...")
            robot_1 = create_robot("Robot Alpha", "RBT-001")
            robot_2 = create_robot("Robot Beta", "RBT-002")
            robot_3 = create_robot("Robot Gamma", "RBT-003")
            
            # 7. Task Types
            print("\n🔧 Creating task types...")
            maintenance = create_type_tache("Maintenance préventive")
            reparation = create_type_tache("Réparation")
            inspection = create_type_tache("Inspection")
            nettoyage = create_type_tache("Nettoyage")
            calibration = create_type_tache("Calibration")
            
            # 8. Bilan States
            print("\n📈 Creating bilan states...")
            etat_1 = create_etat_bilan(bilan_1, 24.5, 65.0)
            etat_2 = create_etat_bilan(bilan_2, 26.0, 58.0)
            etat_3 = create_etat_bilan(bilan_3, 23.8, 62.0)
            
            # 9. Culture Guides
            print("\n🌱 Creating culture guides...")
            guide_tomate = create_guide_culture("Guide Tomate", "Tomate", serre_1)
            guide_salade = create_guide_culture("Guide Salade", "Salade", serre_2)
            guide_poivron = create_guide_culture("Guide Poivron", "Poivron", serre_3)
            
            # 10. Robot Missions
            print("\n🚀 Creating robot missions...")
            mission_1 = create_mission_robot(robot_1, serre_1, 1, 0, 1, 8, 0, [bilan_1.id, bilan_2.id])
            mission_2 = create_mission_robot(robot_2, serre_2, 0, 1, 3, 14, 30, [bilan_3.id])
            mission_3 = create_mission_robot(robot_3, serre_3, 1, 2, 5, 10, 15, [bilan_4.id])
            mission_4 = create_mission_robot(robot_1, serre_4, 0, 0, 2, 16, 45, [bilan_5.id])
            
            # 11. Interventions
            print("\n🔨 Creating interventions...")
            interv_1 = create_intervention(tech, serre_1, maintenance, "Maintenance mensuelle des systèmes d'irrigation", "terminé")
            interv_2 = create_intervention(tech_sup, serre_2, reparation, "Réparation du système de ventilation", "encours")
            interv_3 = create_intervention(tech2, serre_3, inspection, "Inspection de sécurité des équipements", "encours")
            interv_4 = create_intervention(tech, serre_4, nettoyage, "Nettoyage complet de la serre", "terminé")
            interv_5 = create_intervention(tech_sup, serre_1, calibration, "Calibration des capteurs de température", "encours")
            
            # 12. Reports
            print("\n📋 Creating reports...")
            rapport_1 = create_rapport(interv_1, "Rapport Maintenance Irrigation", "Maintenance effectuée avec succès. Tous les systèmes fonctionnent correctement.")
            rapport_2 = create_rapport(interv_4, "Rapport Nettoyage Serre A2", "Nettoyage terminé. Serre prête pour la prochaine culture.")
            
            # 13. Notifications
            print("\n🔔 Creating notifications...")
            create_notification(tech, "Nouvelle intervention assignée: Maintenance Serre A1", "intervention")
            create_notification(tech_sup, "Intervention terminée par Charlie Tech", "success")
            create_notification(director, "Rapport mensuel disponible", "info")
            create_notification(tech2, "Rappel: Inspection de sécurité à effectuer", "reminder")
            
            # 14. Authorizations
            print("\n🔐 Creating authorizations...")
            create_authorization(tech_sup, serre_1)
            create_authorization(tech_sup, serre_2)
            create_authorization(tech, serre_1)
            create_authorization(tech, serre_3)
            create_authorization(tech2, serre_2)
            create_authorization(tech2, serre_4)
            
            create_domain_authorization(tech_sup, domaine_a)
            create_domain_authorization(tech_sup, domaine_b)
            create_domain_authorization(tech, domaine_a)
            create_domain_authorization(tech2, domaine_c)
            
            create_bilan_authorization(tech_sup, bilan_1)
            create_bilan_authorization(tech, bilan_2)
            create_bilan_authorization(tech2, bilan_4)
            
            # 15. Alerts
            print("\n🚨 Creating alerts...")
            create_alerts(bilan_1, 6)
            create_alerts(bilan_2, 4)
            create_alerts(bilan_3, 5)
            create_alerts(bilan_4, 3)
            create_alerts(bilan_5, 4)
            
            # Commit everything
            print("\n💾 Committing to database...")
            db.session.commit()
            
            # Summary
            print("\n📈 Seeding Summary:")
            print(f"  Users: {User.query.count()}")
            print(f"  Companies: {Entreprise.query.count()}")
            print(f"  Domaines: {Domaine.query.count()}")
            print(f"  Serres: {Serre.query.count()}")
            print(f"  Bilans: {Bilan.query.count()}")
            print(f"  Robots: {Robot.query.count()}")
            print(f"  Robot Missions: {MissionRobot.query.count()}")
            print(f"  Task Types: {TypeTache.query.count()}")
            print(f"  Interventions: {Intervention.query.count()}")
            print(f"  Reports: {Rapport.query.count()}")
            print(f"  Notifications: {Notification.query.count()}")
            print(f"  Bilan States: {Etat_bilan.query.count()}")
            print(f"  Culture Guides: {GuideCulture.query.count()}")
            print(f"  Alerts: {Alerte.query.count()}")
            print(f"  Serre Authorizations: {Autorisation_serre.query.count()}")
            print(f"  Domain Authorizations: {Autorisation_domaine.query.count()}")
            print(f"  Bilan Authorizations: {Autorisation_bilan.query.count()}")
            print(f"  Polygons: {GroupCor.query.count()}")
            
            print("\n🎉 Database comprehensively seeded successfully!")
            
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
