from datetime import datetime, timedelta, timezone
from random import randint, choice, uniform
import sys
import os

# Add the app directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(current_dir)
sys.path.insert(0, app_dir)

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
from app.models.intervention import Intervention, StatutInterventionEnum
from app.models.type_tache import TypeTache
from app.models.rapport import Rapport
from app.models.notification import Notification


def _ensure_polygon(group_id: int, center_lat: float, center_lng: float, size_deg: float = 0.001) -> None:
    """Create a simple square polygon in `group_cor` for the given group id if not exists."""
    try:
        existing = GroupCor.query.filter_by(id_group_cor=group_id).first()
        if existing:
            print(f"[seed] Polygon for group {group_id} already exists, skipping...")
            return

        # Define a square around the center
        points = [
            (center_lat - size_deg, center_lng - size_deg, 1),
            (center_lat - size_deg, center_lng + size_deg, 2),
            (center_lat + size_deg, center_lng + size_deg, 3),
            (center_lat + size_deg, center_lng - size_deg, 4),
        ]
        for lat, lng, ordre in points:
            db.session.add(GroupCor(id_group_cor=group_id, point_x=lat, point_y=lng, ordre=ordre))
        print(f"[seed] Created polygon for group {group_id}")
    except Exception as e:
        print(f"[seed] Error creating polygon for group {group_id}: {e}")
        raise


def _get_or_create_user(email: str, role: str, name: str) -> User:
    try:
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"[seed] User {email} already exists, skipping...")
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
        print(f"[seed] Created user: {email} ({role})")
        return user
    except Exception as e:
        print(f"[seed] Error creating user {email}: {e}")
        raise


def _get_or_create_company(director: User) -> Entreprise:
    try:
        company = Entreprise.query.filter_by(id_user=director.id).first()
        if company:
            print(f"[seed] Company for director {director.email} already exists, skipping...")
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
        # Attach director to company
        director.id_entreprise = company.id
        print(f"[seed] Created company: {company.nom}")
        return company
    except Exception as e:
        print(f"[seed] Error creating company: {e}")
        raise


def _get_or_create_domain(company: Entreprise, name: str, group_id: int, center_lat: float, center_lng: float) -> Domaine:
    try:
        domaine = Domaine.query.filter_by(nom=name, id_entreprise=company.id).first()
        if domaine:
            print(f"[seed] Domain {name} already exists, skipping...")
            return domaine
        _ensure_polygon(group_id, center_lat, center_lng, size_deg=0.002)
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
        print(f"[seed] Created domain: {name}")
        return domaine
    except Exception as e:
        print(f"[seed] Error creating domain {name}: {e}")
        raise


def _get_or_create_serre(domaine: Domaine, name: str, group_id: int, center_lat: float, center_lng: float) -> Serre:
    try:
        serre = Serre.query.filter_by(nom=name, id_domaine=domaine.id).first()
        if serre:
            print(f"[seed] Serre {name} already exists, skipping...")
            return serre
        _ensure_polygon(group_id, center_lat, center_lng, size_deg=0.001)
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
        print(f"[seed] Created serre: {name}")
        return serre
    except Exception as e:
        print(f"[seed] Error creating serre {name}: {e}")
        raise


def _get_or_create_bilan(serre: Serre, name: str, group_id: int) -> Bilan:
    try:
        bilan = Bilan.query.filter_by(nom=name, id_serre=serre.id).first()
        if bilan:
            print(f"[seed] Bilan {name} already exists, skipping...")
            return bilan
        # Reuse serre center for a small polygon
        center_lat = serre.center_lat or 45.764
        center_lng = serre.center_lng or 4.835
        _ensure_polygon(group_id, center_lat, center_lng, size_deg=0.0006)
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
        print(f"[seed] Created bilan: {name}")
        return bilan
    except Exception as e:
        print(f"[seed] Error creating bilan {name}: {e}")
        raise


def _ensure_serre_authorization(user: User, serre: Serre) -> None:
    try:
        if not Autorisation_serre.query.filter_by(id_user=user.id, id_serre=serre.id).first():
            db.session.add(Autorisation_serre(id_user=user.id, id_serre=serre.id))
            print(f"[seed] Created authorization for user {user.email} on serre {serre.nom}")
        else:
            print(f"[seed] Authorization for user {user.email} on serre {serre.nom} already exists")
    except Exception as e:
        print(f"[seed] Error creating authorization: {e}")
        raise


def _create_alerts_for_bilan(bilan: Bilan, how_many: int = 5) -> None:
    try:
        maladies = [
            "Mildiou détecté",
            "Oïdium suspecté",
            "Stress hydrique",
            "Température élevée",
            "Carence en azote",
        ]
        statuses = ["non résolue", "résolue"]

        # Create alerts only if none exist yet for this bilan
        if Alerte.query.filter_by(id_bilan=bilan.id).first():
            print(f"[seed] Alerts already exist for bilan {bilan.nom}, skipping...")
            return

        now = datetime.now(timezone(timedelta(hours=1)))
        for i in range(how_many):
            alerte = Alerte(
                id_bilan=bilan.id,
                status_alert=randint(0, 2),  # 0=Low/Faible, 1=Medium/Moyenne, 2=High/Critique
                maladie=choice(maladies),
                lien_image="https://picsum.photos/seed/gt{}/400/300".format(bilan.id * 100 + i),
                x1=uniform(0.0, 1.0),
                y1=uniform(0.0, 1.0),
                date=now - timedelta(hours=i * 6),
                status=choice(statuses),
            )
            db.session.add(alerte)
        print(f"[seed] Created {how_many} alerts for bilan {bilan.nom}")
    except Exception as e:
        print(f"[seed] Error creating alerts for bilan {bilan.nom}: {e}")
        raise


def _create_type_taches() -> list:
    """Create common task types for interventions"""
    try:
        task_types = [
            "Traitement phytosanitaire",
            "Irrigation",
            "Ventilation",
            "Contrôle température",
            "Nettoyage",
            "Maintenance équipement",
            "Récolte",
            "Semis",
            "Taille",
            "Fertilisation"
        ]
        
        created_types = []
        for task_name in task_types:
            existing = TypeTache.query.filter_by(nom=task_name).first()
            if existing:
                created_types.append(existing)
                continue
                
            task_type = TypeTache(nom=task_name)
            db.session.add(task_type)
            db.session.flush()
            created_types.append(task_type)
            print(f"[seed] Created task type: {task_name}")
        
        return created_types
    except Exception as e:
        print(f"[seed] Error creating task types: {e}")
        raise


# Interventions creation removed - no more mock interventions


def _clear_all_notifications() -> None:
    """Clear all existing notifications from the database"""
    try:
        notification_count = Notification.query.count()
        if notification_count > 0:
            Notification.query.delete()
            print(f"[seed] Cleared {notification_count} existing notifications")
        else:
            print("[seed] No notifications to clear")
    except Exception as e:
        print(f"[seed] Error clearing notifications: {e}")
        raise


def _clear_all_interventions() -> None:
    """Clear all existing interventions from the database"""
    try:
        intervention_count = Intervention.query.count()
        if intervention_count > 0:
            Intervention.query.delete()
            print(f"[seed] Cleared {intervention_count} existing interventions")
        else:
            print("[seed] No interventions to clear")
    except Exception as e:
        print(f"[seed] Error clearing interventions: {e}")
        raise


def _auto_assign_technicians_to_supervisors():
    """Automatically assign unassigned technicians to supervisors based on serre access with load balancing"""
    try:
        # Get all unassigned technicians
        unassigned_techs = User.query.filter_by(role='technicien', id_assigned=None).all()
        if not unassigned_techs:
            print("[seed] All technicians are already assigned")
            return
        
        # Get all supervisors
        supervisors = User.query.filter_by(role='technicien_superieur').all()
        if not supervisors:
            print("[seed] No supervisors found for auto-assignment")
            return
        
        print(f"[seed] Auto-assigning {len(unassigned_techs)} unassigned technicians...")
        
        # Track current load for each supervisor
        supervisor_load = {sup.id: 0 for sup in supervisors}
        
        # Count existing assignments
        for sup in supervisors:
            existing_techs = User.query.filter_by(role='technicien', id_assigned=sup.id).count()
            supervisor_load[sup.id] = existing_techs
            print(f"[seed] Supervisor {sup.email} currently has {existing_techs} technicians")
        
        for tech in unassigned_techs:
            # Find supervisors with overlapping serre access
            tech_serres = set(auth.id_serre for auth in Autorisation_serre.query.filter_by(id_user=tech.id).all())
            
            # Find all supervisors with access to tech's serres
            eligible_supervisors = []
            for sup in supervisors:
                sup_serres = set(auth.id_serre for auth in Autorisation_serre.query.filter_by(id_user=sup.id).all())
                overlap = len(tech_serres & sup_serres)
                if overlap > 0:
                    eligible_supervisors.append((sup, overlap))
            
            if eligible_supervisors:
                # Sort by overlap (descending) and then by current load (ascending)
                eligible_supervisors.sort(key=lambda x: (-x[1], supervisor_load[x[0].id]))
                
                # Pick the supervisor with best overlap and lowest load
                best_supervisor, overlap = eligible_supervisors[0]
                
                tech.id_assigned = best_supervisor.id
                supervisor_load[best_supervisor.id] += 1
                
                print(f"[seed] Assigned {tech.email} to {best_supervisor.email} (overlap: {overlap} serres, load: {supervisor_load[best_supervisor.id]})")
            else:
                # No overlap found - assign to supervisor with lowest load
                best_supervisor = min(supervisors, key=lambda x: supervisor_load[x.id])
                tech.id_assigned = best_supervisor.id
                supervisor_load[best_supervisor.id] += 1
                
                print(f"[seed] No serre overlap - assigned {tech.email} to {best_supervisor.email} (lowest load: {supervisor_load[best_supervisor.id]})")
        
        print("[seed] Auto-assignment completed with load balancing")
        
    except Exception as e:
        print(f"[seed] Error in auto-assignment: {e}")
        raise


def _create_reports_for_serre(serre: Serre, user: User, count: int = 3) -> None:
    """Create reports for a specific serre"""
    try:
        # Check if reports already exist for this serre
        if Rapport.query.filter_by(id_serre=serre.id).first():
            print(f"[seed] Reports already exist for serre {serre.nom}, skipping...")
            return
        
        today = datetime.now(timezone(timedelta(hours=1))).date()
        
        report_types = [
            "Rapport d'inspection quotidienne",
            "Rapport de maintenance préventive",
            "Rapport de traitement phytosanitaire",
            "Rapport de récolte",
            "Rapport de contrôle qualité",
            "Rapport d'irrigation",
            "Rapport de ventilation",
            "Rapport de surveillance des maladies",
            "Rapport de fertilisation",
            "Rapport de nettoyage"
        ]
        
        for i in range(count):
            # Random report type
            report_type = choice(report_types)
            
            # Random date within last 30 days
            report_date = today - timedelta(days=randint(0, 30))
            
            # Generate realistic description
            description = f"{report_type} - {serre.nom} - {report_date.strftime('%d/%m/%Y')}"
            
            # Random PDF link (some reports have PDFs, some don't)
            pdf_link = None
            if choice([True, False]):
                pdf_link = f"https://example.com/reports/rapport_{serre.id}_{i+1}_{report_date.strftime('%Y%m%d')}.pdf"
            
            report = Rapport(
                date=report_date,
                description=description,
                lien_pdf=pdf_link,
                id_serre=serre.id,
                user_id=user.id
            )
            db.session.add(report)
        
        print(f"[seed] Created {count} reports for serre {serre.nom}")
    except Exception as e:
        print(f"[seed] Error creating reports for serre {serre.nom}: {e}")
        raise


def seed() -> None:
    """Main seeding routine. Idempotent and safe to re-run."""
    try:
        print("[seed] Starting database seeding...")
        app = create_app()
        with app.app_context():
            # Ensure tables exist (safe with SQLAlchemy)
            print("[seed] Creating database tables if they don't exist...")
            db.create_all()

            print("[seed] Starting to create entities...")
            
            # 0) Clear all existing data
            print("[seed] Clearing existing notifications...")
            _clear_all_notifications()
            
            print("[seed] Clearing existing interventions...")
            _clear_all_interventions()
            
            # 1) Users
            print("[seed] Creating users...")
            director = _get_or_create_user("director@greenfarm.dev", "directeur", "Alice Director")
            tech_sup = _get_or_create_user("techsup@greenfarm.dev", "technicien_superieur", "Bob TechSup")
            tech_sup2 = _get_or_create_user("techsup2@greenfarm.dev", "technicien_superieur", "David TechSup2")
            tech = _get_or_create_user("tech@greenfarm.dev", "technicien", "Charlie Tech")
            tech2 = _get_or_create_user("tech2@greenfarm.dev", "technicien", "Eve Tech2")
            tech3 = _get_or_create_user("tech3@greenfarm.dev", "technicien", "Frank Tech3")

            # 2) Company
            print("[seed] Creating company...")
            company = _get_or_create_company(director)
            # Make sure technicians belong to same company for role-based queries
            tech_sup.id_entreprise = company.id
            tech_sup2.id_entreprise = company.id
            tech.id_entreprise = company.id
            tech2.id_entreprise = company.id
            tech3.id_entreprise = company.id
            
            # 🔴 FIX: Link technicians to supervisors for notifications to work
            tech.id_assigned = tech_sup.id
            tech2.id_assigned = tech_sup.id
            tech3.id_assigned = tech_sup2.id
            
            print(f"[seed] Linked technician {tech.email} to supervisor {tech_sup.email}")
            print(f"[seed] Linked technician {tech2.email} to supervisor {tech_sup.email}")
            print(f"[seed] Linked technician {tech3.email} to supervisor {tech_sup2.email}")
            
            # 🔴 ADD: Auto-assignment function for future scalability
            _auto_assign_technicians_to_supervisors()

            # 3) Domaines
            print("[seed] Creating domaines...")
            domaine_a = _get_or_create_domain(company, "Domaine Nord", 1001, 45.764, 4.835)
            domaine_b = _get_or_create_domain(company, "Domaine Sud", 1002, 45.754, 4.845)

            # 4) Serres
            print("[seed] Creating serres...")
            serre_1 = _get_or_create_serre(domaine_a, "Serre A1", 2001, 45.7645, 4.8355)
            serre_2 = _get_or_create_serre(domaine_b, "Serre B1", 2002, 45.7545, 4.8455)

            # 5) Bilans
            print("[seed] Creating bilans...")
            bilan_1 = _get_or_create_bilan(serre_1, "Bilan A1-2025-01", 3001)
            bilan_2 = _get_or_create_bilan(serre_1, "Bilan A1-2025-02", 3002)
            bilan_3 = _get_or_create_bilan(serre_2, "Bilan B1-2025-01", 3003)

            # 6) Authorizations (for alert queries by assigned serres)
            print("[seed] Creating authorizations...")
            _ensure_serre_authorization(tech_sup, serre_1)
            _ensure_serre_authorization(tech_sup, serre_2)
            _ensure_serre_authorization(tech_sup2, serre_1)
            _ensure_serre_authorization(tech, serre_1)
            _ensure_serre_authorization(tech2, serre_1)
            _ensure_serre_authorization(tech3, serre_2)

            # 7) Alerts
            print("[seed] Creating alerts...")
            _create_alerts_for_bilan(bilan_1, how_many=6)
            _create_alerts_for_bilan(bilan_2, how_many=4)
            _create_alerts_for_bilan(bilan_3, how_many=5)

            # 8) Task Types
            print("[seed] Creating task types...")
            task_types = _create_type_taches()

            # 9) Interventions - REMOVED
            print("[seed] Skipping interventions creation...")

            # 10) Reports
            print("[seed] Creating reports...")
            _create_reports_for_serre(serre_1, tech, count=5)
            _create_reports_for_serre(serre_2, tech_sup, count=4)
            _create_reports_for_serre(serre_1, tech_sup, count=3)

            print("[seed] Committing all changes to database...")
            db.session.commit()
            print("[seed] Database seeded successfully with mock data!")
            
            # Print summary
            print(f"[seed] Summary:")
            print(f"  - Users: {User.query.count()}")
            print(f"  - Companies: {Entreprise.query.count()}")
            print(f"  - Domaines: {Domaine.query.count()}")
            print(f"  - Serres: {Serre.query.count()}")
            print(f"  - Bilans: {Bilan.query.count()}")
            print(f"  - Alerts: {Alerte.query.count()}")
            print(f"  - Authorizations: {Autorisation_serre.query.count()}")
            print(f"  - Polygons: {GroupCor.query.count()}")
            print(f"  - Task Types: {TypeTache.query.count()}")
            print(f"  - Interventions: 0 (cleared)")
            print(f"  - Reports: {Rapport.query.count()}")
            print(f"  - Notifications: 0 (cleared)")
            
    except Exception as e:
        print(f"[seed] Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    seed()


