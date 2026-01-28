import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'backend', 'database.sqlite')

if not os.path.exists(db_path):
    print(f"❌ Base de dados não encontrada em: {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Ver utilizadores atuais
    cursor.execute("SELECT id, username, email FROM Users;")
    users = cursor.fetchall()
    print(f"📊 Utilizadores atuais: {len(users)}")
    for user in users:
        print(f"   - ID {user[0]}: {user[1]} ({user[2]})")
    
    # Apagar todos
    cursor.execute("DELETE FROM Users;")
    conn.commit()
    
    # Verificar
    cursor.execute("SELECT COUNT(*) FROM Users;")
    count = cursor.fetchone()[0]
    print(f"\n✅ Base de dados limpa!")
    print(f"✅ Utilizadores restantes: {count}")
    
    conn.close()
except Exception as e:
    print(f"❌ Erro: {e}")
