# AmeLog 🎵🧠

**AmeLog** is an emotion-adaptive music web application that senses a user’s facial emotions in real time and plays background music that aligns with their emotional state.  
The goal isn’t recommendation — it’s creating a **passive, ambient, emotionally aware listening experience**.

This project was built as a **Minor Project** and as a deep exploration of real-time emotion analysis, frontend–backend integration, and creative UI design.

---

## 🌐 Tech Stack

### Frontend
- **React (Vite)** – UI, state management, and audio logic  
- **Web Audio API** – Background music playback  
- **MediaDevices API** – Webcam access  
- **CSS / Inline Styling** – Emotion-based gradients and visuals  

### Backend
- **FastAPI** – Lightweight ML inference API  
- **TensorFlow / Keras** – Emotion prediction model  
- **OpenCV** – Image preprocessing  
- **MediaPipe** – Face detection  

---

## 🎯 Features

- Real-time webcam-based emotion detection  
- Emotion buffering & confidence gating for stable predictions  
- Emotion-based **playlists** (not single-song mapping)  
- Smooth music transitions (emotion evaluated only at song boundaries)  
- Manual controls: Play / Pause / Next / Previous  
- Manual emotion override with instant return to auto mode  
- Emotion-responsive UI (dynamic background & styling)  
- No user input, no clicks required for recommendations  

---

## 🧠 How It Works

1. Webcam frames are sampled periodically on the frontend  
2. Frames are sent to the FastAPI backend  
3. A pretrained CNN predicts the dominant emotion  
4. Predictions are buffered to avoid jitter  
5. Music playlists adapt **only when a track ends**, ensuring smooth flow  

This keeps the experience calm, continuous, and non-disruptive.

---

## 📚 What I Learned

- Real-time ML inference with FastAPI  
- Handling TensorFlow environment constraints on Windows  
- Emotion stabilization using temporal buffers  
- Managing complex state interactions in React  
- Audio lifecycle handling (auto vs manual control)  
- Designing UI that reacts emotionally, not just functionally  
- Debugging real-world ML + frontend edge cases  

---

## 🚀 How to Run

### Backend
```bash
cd backend
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Then open the local React URL in your browser and allow camera access.

## ⚠️ Limitations

- Emotion accuracy depends on lighting and camera quality
- Model trained on limited facial emotion datasets
- No long-term personalization or user history
- Single-user, single-session experience

## 🔮 Future Improvements
- Mobile adaptation via contextual emotion sampling
- Multi-modal emotion input (audio + facial cues)
- Lightweight on-device inference

## 👩‍💻 Author

Yogeshwari Kanwar

B.Tech CSE — Minor Project
