import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer, StandardScaler

# Load the dataset
df = pd.read_csv('data.csv')

# Example schema (customize based on your dataset):
# symptoms: ['fever', 'cough', 'headache']
# metrics: ['bp', 'glucose', 'pulse']
# diagnosis: ['Diabetes']
# recommended_meds: ['Metformin', 'Insulin']

# ===================== Preprocessing =====================

symptom_cols = ['fever', 'cough', 'headache']  # binary 0/1 columns
metric_cols = ['bp', 'glucose', 'pulse']
diagnosis_col = 'diagnosis'
meds_col = 'recommended_meds'  # comma-separated string

# Scale metrics
scaler = StandardScaler()
df[metric_cols] = scaler.fit_transform(df[metric_cols])

# Encode diagnosis
diagnosis_encoder = LabelEncoder()
df['diagnosis_encoded'] = diagnosis_encoder.fit_transform(df[diagnosis_col])

# Encode meds
df['recommended_meds'] = df['recommended_meds'].apply(lambda x: x.split(','))
med_encoder = MultiLabelBinarizer()
med_labels = med_encoder.fit_transform(df['recommended_meds'])

# Prepare inputs & outputs
X_symptoms = df[symptom_cols].values
X_metrics = df[metric_cols].values
y_diagnosis = df['diagnosis_encoded'].values
y_meds = med_labels

# Split the data
X_symp_train, X_symp_test, X_met_train, X_met_test, y_diag_train, y_diag_test, y_meds_train, y_meds_test = train_test_split(
    X_symptoms, X_metrics, y_diagnosis, y_meds, test_size=0.2, random_state=42
)

# ===================== Model Definition =====================

# Symptom input
input_symptoms = tf.keras.Input(shape=(len(symptom_cols),), name='symptoms')
x1 = tf.keras.layers.Dense(32, activation='relu')(input_symptoms)

# Metric input
input_metrics = tf.keras.Input(shape=(len(metric_cols),), name='metrics')
x2 = tf.keras.layers.Dense(32, activation='relu')(input_metrics)

# Combine
combined = tf.keras.layers.Concatenate()([x1, x2])
x = tf.keras.layers.Dense(64, activation='relu')(combined)

# Diagnosis output
diagnosis_output = tf.keras.layers.Dense(len(np.unique(y_diagnosis)), activation='softmax', name='diagnosis_output')(x)

# Medicine recommendation output
meds_output = tf.keras.layers.Dense(len(med_encoder.classes_), activation='sigmoid', name='meds_output')(x)

# Final model
model = tf.keras.Model(inputs=[input_symptoms, input_metrics], outputs=[diagnosis_output, meds_output])

model.compile(
    optimizer='adam',
    loss={
        'diagnosis_output': 'sparse_categorical_crossentropy',
        'meds_output': 'binary_crossentropy'
    },
    metrics={
        'diagnosis_output': 'accuracy',
        'meds_output': 'accuracy'
    }
)

model.summary()

# ===================== Training =====================

history = model.fit(
    {'symptoms': X_symp_train, 'metrics': X_met_train},
    {'diagnosis_output': y_diag_train, 'meds_output': y_meds_train},
    validation_split=0.1,
    epochs=50,
    batch_size=32
)

# ===================== Save Model and Encoders =====================
model.save('health_diagnosis_model.h5')

# Save encoders and scaler
import joblib
joblib.dump(diagnosis_encoder, 'diagnosis_encoder.pkl')
joblib.dump(med_encoder, 'med_encoder.pkl')
joblib.dump(scaler, 'scaler.pkl')
