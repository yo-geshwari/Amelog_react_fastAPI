from keras.models import model_from_json

with open("models/emotion_model.json", "r") as f:
    model_json = f.read()

model = model_from_json(model_json)
model.load_weights("models/emotion_model.h5")

print("✅ Emotion model loaded successfully")