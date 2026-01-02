from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
from keras.models import model_from_json

app = FastAPI(title="AmeLog Emotion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("models/emotion_model.json", "r") as f:
    model_json = f.read()

emotion_model = model_from_json(model_json)
emotion_model.load_weights("models/emotion_model.h5")

EMOTION_LABELS = [
    "Angry",
    "Disgust",
    "Fear",
    "Happy",
    "Sad",
    "Surprise",
    "Neutral"
]

def preprocess_image(image_bytes):
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)

    if image is None:
        return None

    image = cv2.resize(image, (48, 48))
    image = image / 255.0
    image = image.reshape(1, 48, 48, 1)

    return image

@app.post("/predict-emotion")
async def predict_emotion(file: UploadFile = File(...)):
    image_bytes = await file.read()
    processed = preprocess_image(image_bytes)

    if processed is None:
        return {"error": "Invalid image"}

    predictions = emotion_model.predict(processed, verbose=0)
    emotion_index = int(np.argmax(predictions))
    confidence = float(np.max(predictions))

    return {
        "emotion": EMOTION_LABELS[emotion_index],
        "confidence": round(confidence, 3)
    }