#!/usr/bin/env python3
"""
Simple database seeder for GreenerTech
Run this from the backend directory or inside the Docker container
"""

import sys
import os
from datetime import datetime, timedelta, timezone
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


def create_authorization(user: User, serre: Serre):
    """Create serre authorization if it doesn't exist"""
    if not Autorisation_serre.query.filter_by(id_user=user.id, id_serre=serre.id).first():
        db.session.add(Autorisation_serre(id_user=user.id, id_serre=serre.id))
        print(f"✓ Created authorization for {user.email} on {serre.nom}")
    else:
        print(f"✓ Authorization exists for {user.email} on {serre.nom}")


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
            status_alert=randint(1, 10),
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
    print("🌱 Starting GreenerTech database seeding...")
    
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
            
            # 2. Company
            print("\n🏢 Creating company...")
            company = create_company(director)
            tech_sup.id_entreprise = company.id
            tech.id_entreprise = company.id
            
            # 3. Domaines
            print("\n🗺️ Creating domaines...")
            domaine_a = create_domain(company, "Domaine Nord", 1001, 45.764, 4.835)
            domaine_b = create_domain(company, "Domaine Sud", 1002, 45.754, 4.845)
            
            # 4. Serres
            print("\n🏗️ Creating serres...")
            serre_1 = create_serre(domaine_a, "Serre A1", 2001, 45.7645, 4.8355)
            serre_2 = create_serre(domaine_b, "Serre B1", 2002, 45.7545, 4.8455)
            
            # 5. Bilans
            print("\n📊 Creating bilans...")
            bilan_1 = create_bilan(serre_1, "Bilan A1-2025-01", 3001)
            bilan_2 = create_bilan(serre_1, "Bilan A1-2025-02", 3002)
            bilan_3 = create_bilan(serre_2, "Bilan B1-2025-01", 3003)
            
            # 6. Authorizations
            print("\n🔐 Creating authorizations...")
            create_authorization(tech_sup, serre_1)
            create_authorization(tech_sup, serre_2)
            create_authorization(tech, serre_1)
            
            # 7. Alerts
            print("\n🚨 Creating alerts...")
            create_alerts(bilan_1, 6)
            create_alerts(bilan_2, 4)
            create_alerts(bilan_3, 5)
            
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
            print(f"  Alerts: {Alerte.query.count()}")
            print(f"  Authorizations: {Autorisation_serre.query.count()}")
            print(f"  Polygons: {GroupCor.query.count()}")
            
            print("\n🎉 Database seeded successfully!")
            
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
