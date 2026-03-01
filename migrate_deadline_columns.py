import asyncio
import sqlite3
import os
from database import DATABASE_URL

async def add_deadline_columns():
    """Add deadline columns to existing tables"""
    db_path = DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    
    print(f"Adding deadline columns to database: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA table_info(bookings)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'deadline' not in columns:
            print("Adding deadline column to bookings table...")
            cursor.execute("ALTER TABLE bookings ADD COLUMN deadline DATETIME")
            print("✅ Added deadline column to bookings")
        else:
            print("✅ deadline column already exists in bookings")
        
        cursor.execute("PRAGMA table_info(group_batches)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'deadline' not in columns:
            print("Adding deadline column to group_batches table...")
            cursor.execute("ALTER TABLE group_batches ADD COLUMN deadline DATETIME")
            print("✅ Added deadline column to group_batches")
        else:
            print("✅ deadline column already exists in group_batches")
        
        conn.commit()
        conn.close()
        
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(add_deadline_columns())
