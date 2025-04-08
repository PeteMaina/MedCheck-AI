from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///health_ai.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ===================== MODELS =====================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    ai_response = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class HealthMetric(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    metric_name = db.Column(db.String(100), nullable=False)
    value = db.Column(db.String(100), nullable=False)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

class Diagnosis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    diagnosis = db.Column(db.Text, nullable=False)
    recommended_meds = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Symptom(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    reported_at = db.Column(db.DateTime, default=datetime.utcnow)

class Allergy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    allergen = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(50), nullable=True)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

# ===================== ROUTES =====================

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    new_user = User(username=data['username'], email=data['email'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/chat', methods=['POST'])
def store_chat():
    data = request.json
    new_chat = Chat(user_id=data['user_id'], message=data['message'], ai_response=data['ai_response'])
    db.session.add(new_chat)
    db.session.commit()
    return jsonify({"message": "Chat saved"}), 201

@app.route('/metric', methods=['POST'])
def store_metric():
    data = request.json
    new_metric = HealthMetric(user_id=data['user_id'], metric_name=data['metric_name'], value=data['value'])
    db.session.add(new_metric)
    db.session.commit()
    return jsonify({"message": "Metric stored"}), 201

@app.route('/diagnosis', methods=['POST'])
def store_diagnosis():
    data = request.json
    new_diagnosis = Diagnosis(user_id=data['user_id'], diagnosis=data['diagnosis'], recommended_meds=data['recommended_meds'])
    db.session.add(new_diagnosis)
    db.session.commit()
    return jsonify({"message": "Diagnosis stored"}), 201

@app.route('/symptom', methods=['POST'])
def store_symptom():
    data = request.json
    new_symptom = Symptom(user_id=data['user_id'], description=data['description'])
    db.session.add(new_symptom)
    db.session.commit()
    return jsonify({"message": "Symptom recorded"}), 201

@app.route('/allergy', methods=['POST'])
def store_allergy():
    data = request.json
    new_allergy = Allergy(user_id=data['user_id'], allergen=data['allergen'], severity=data.get('severity'))
    db.session.add(new_allergy)
    db.session.commit()
    return jsonify({"message": "Allergy recorded"}), 201

@app.route('/user/<int:user_id>/data', methods=['GET'])
def get_user_data(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    chats = Chat.query.filter_by(user_id=user_id).all()
    metrics = HealthMetric.query.filter_by(user_id=user_id).all()
    diagnoses = Diagnosis.query.filter_by(user_id=user_id).all()
    symptoms = Symptom.query.filter_by(user_id=user_id).all()
    allergies = Allergy.query.filter_by(user_id=user_id).all()

    return jsonify({
        "user": {"username": user.username, "email": user.email},
        "chats": [{"message": c.message, "response": c.ai_response, "timestamp": c.timestamp} for c in chats],
        "metrics": [{"name": m.metric_name, "value": m.value, "recorded_at": m.recorded_at} for m in metrics],
        "diagnoses": [{"diagnosis": d.diagnosis, "meds": d.recommended_meds, "created_at": d.created_at} for d in diagnoses],
        "symptoms": [{"description": s.description, "reported_at": s.reported_at} for s in symptoms],
        "allergies": [{"allergen": a.allergen, "severity": a.severity, "recorded_at": a.recorded_at} for a in allergies]
    })

# ===================== MAIN =====================

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
