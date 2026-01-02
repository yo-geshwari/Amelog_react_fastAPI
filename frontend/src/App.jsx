import { useEffect, useRef, useState } from "react";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [snapshot, setSnapshot] = useState(null);
  const [emotion, setEmotion] = useState("—");
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);

  // Start webcam
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
    startCamera();
  }, []);

  // Capture one frame
  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Show snapshot
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const imageUrl = URL.createObjectURL(blob);
      setSnapshot(imageUrl);

      // Send to backend
      await sendToBackend(blob);
    }, "image/jpeg");
  };

  // Send image to FastAPI
  const sendToBackend = async (imageBlob) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", imageBlob, "frame.jpg");

      const response = await fetch(
        "http://127.0.0.1:8000/predict-emotion",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.emotion) {
        setEmotion(data.emotion);
        setConfidence(data.confidence);
      }
    } catch (error) {
      console.error("Error calling backend:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-capture every N ms
  useEffect(() => {
    const INTERVAL_MS = 1000; // 1 second (safe & stable)

    const interval = setInterval(() => {
      captureFrame();
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>AmeLog 🎵</h1>
      <p>Real-time emotion sampling (frontend-controlled)</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "400px",
          borderRadius: "12px",
          border: "2px solid #ccc",
        }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {snapshot && (
        <div style={{ marginTop: "16px" }}>
          <h3>Sampled Frame</h3>
          <img
            src={snapshot}
            alt="Snapshot"
            style={{ width: "200px", borderRadius: "8px" }}
          />
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <h2>
          Emotion: <span>{emotion}</span>
        </h2>
        {confidence !== null && (
          <p>Confidence: {confidence}</p>
        )}
      </div>
    </div>
  );
}

export default App;