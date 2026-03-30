from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

conn = sqlite3.connect("contacts.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    phone TEXT,
    category TEXT,
    company TEXT,
    notes TEXT
)
""")

# ➕ ADD
@app.route('/contacts', methods=['POST'])
def add_contact():
    data = request.json

    cursor.execute("""
    INSERT INTO contacts (firstName, lastName, email, phone, category, company, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data['firstName'], data['lastName'], data['email'],
        data['phone'], data['category'], data['company'], data['notes']
    ))

    conn.commit()
    return jsonify({"message": "Contact saved!"})

# 📋 GET
@app.route('/contacts', methods=['GET'])
def get_contacts():
    cursor.execute("SELECT * FROM contacts")
    rows = cursor.fetchall()

    result = []
    for r in rows:
        result.append({
            "id": r[0],
            "firstName": r[1],
            "lastName": r[2],
            "email": r[3],
            "phone": r[4],
            "category": r[5],
            "company": r[6],
            "notes": r[7]
        })

    return jsonify(result)

# ❌ DELETE
@app.route('/contacts/<int:id>', methods=['DELETE'])
def delete_contact(id):
    cursor.execute("DELETE FROM contacts WHERE id=?", (id,))
    conn.commit()
    return jsonify({"message": "Deleted"})

# ✏️ UPDATE
@app.route('/contacts/<int:id>', methods=['PUT'])
def update_contact(id):
    data = request.json

    cursor.execute("""
    UPDATE contacts SET firstName=?, lastName=?, email=?, phone=?, category=?, company=?, notes=?
    WHERE id=?
    """, (
        data['firstName'], data['lastName'], data['email'],
        data['phone'], data['category'], data['company'], data['notes'], id
    ))

    conn.commit()
    return jsonify({"message": "Updated"})


if __name__ == '__main__':
    app.run(debug=True)
