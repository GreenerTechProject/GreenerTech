#!/usr/bin/env python3
"""
Simple script to reload the seed database and verify technician assignments
"""

import sys
import os

# Add the app directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from app import create_app
from database.config import db
from app.models.user import User

def reload_seed_database():
    """Reload the seed database"""
    try:
        print("🌱 Reloading seed database...")
        from database.seed import seed
        seed()
        print("✅ Seed database reloaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error reloading seed database: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_technician_assignments():
    """Verify that technicians are properly assigned to supervisors"""
    try:
        print("\n🔍 Verifying technician assignments...")
        app = create_app()
        
        with app.app_context():
            # Get all users
            users = User.query.all()
            
            print("\n👥 User Assignment Status:")
            print("-" * 80)
            
            for user in users:
                assigned_to = None
                if user.id_assigned:
                    assigned_user = User.query.get(user.id_assigned)
                    assigned_to = f"{assigned_user.name} ({assigned_user.email})" if assigned_user else "Unknown"
                
                print(f"📧 {user.email}")
                print(f"   👤 Name: {user.name}")
                print(f"   🏷️  Role: {user.role}")
                print(f"   🏢 Company ID: {user.id_entreprise}")
                print(f"   🔗 Assigned to: {assigned_to or 'None'}")
                print()
            
            # Check specific technician assignments
            technicians = User.query.filter_by(role='technicien').all()
            supervisors = User.query.filter_by(role='technicien_superieur').all()
            
            print("🔧 Technician Assignment Summary:")
            print("-" * 40)
            
            for tech in technicians:
                if tech.id_assigned:
                    sup = User.query.get(tech.id_assigned)
                    print(f"✅ {tech.email} → {sup.email if sup else 'Unknown'}")
                else:
                    print(f"❌ {tech.email} → NOT ASSIGNED")
            
            print(f"\n📊 Summary:")
            print(f"  - Total users: {len(users)}")
            print(f"  - Technicians: {len(technicians)}")
            print(f"  - Supervisors: {len(supervisors)}")
            print(f"  - Assigned technicians: {len([t for t in technicians if t.id_assigned])}")
            print(f"  - Unassigned technicians: {len([t for t in technicians if not t.id_assigned])}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error verifying assignments: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 GreenTech Seed Database Reload & Verification")
    print("=" * 60)
    
    # Reload the seed database
    success = reload_seed_database()
    
    if success:
        # Verify the assignments
        verify_technician_assignments()
        print("\n🎉 Process completed! Check the output above for any issues.")
    else:
        print("\n💥 Failed to reload seed database. Check the errors above.")
