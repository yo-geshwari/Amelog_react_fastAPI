import { useEffect, useRef, useState, useMemo } from "react";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);

  const EMOTION_WINDOW = 5;
  const [emotionHistory, setEmotionHistory] = useState([]);
  const CONFIDENCE_THRESHOLD = 0.5;

  const audioRef = useRef(null);
  const currentPlaylistRef = useRef([]);
  const currentTrackIndexRef = useRef(0);
  const pendingEmotionRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [manualEmotion, setManualEmotion] = useState(null);
  const manualOverrideRef = useRef(false);

  const emotionToMusicMap = {
    Happy: {
      mood: "Upbeat & Energetic",
      genres: ["Pop", "Dance", "Indie Pop"],
      tempo: "Fast",
      description: "Feel-good tracks to amplify positive energy",
    },
    Sad: {
      mood: "Calm & Reflective",
      genres: ["Acoustic", "Lo-fi", "Soft Indie"],
      tempo: "Slow",
      description: "Soothing music for emotional comfort",
    },
    Angry: {
      mood: "Intense & Powerful",
      genres: ["Rock", "Metal", "Hip-Hop"],
      tempo: "Fast",
      description: "High-energy tracks for emotional release",
    },
    Fear: {
      mood: "Grounding & Reassuring",
      genres: ["Ambient", "Instrumental", "Soft Classical"],
      tempo: "Slow",
      description: "Music to reduce anxiety and stabilize mood",
    },
    Surprise: {
      mood: "Playful & Dynamic",
      genres: ["Electronic", "Alt Pop", "Experimental"],
      tempo: "Medium",
      description: "Unpredictable sounds matching heightened alertness",
    },
    Neutral: {
      mood: "Balanced & Focused",
      genres: ["Lo-fi", "Chillhop", "Jazz"],
      tempo: "Medium",
      description: "Background music for focus and continuity",
    },
  };

  const emotionPlaylists = {
    Happy: [
      "/audio/happy/happy1.mp3",
      "/audio/happy/happy2.mp3",
      "/audio/happy/happy3.mp3",
    ],
    Sad: [
      "/audio/sad/sad1.mp3",
      "/audio/sad/sad2.mp3",
    ],
    Neutral: [
      "/audio/neutral/neutral1.mp3",
      "/audio/neutral/neutral2.mp3",
    ],
    Angry: [
      "/audio/angry/angry1.mp3",
      "/audio/angry/angry2.mp3",
    ],
    Fear: [
      "/audio/fear/fear1.mp3",
      "/audio/fear/fear2.mp3",
    ],
    Surprise: [
      "/audio/surprise/surprise1.mp3",
      "/audio/surprise/surprise2.mp3",
    ],
  };

  const stableEmotion = useMemo(() => {
    if (emotionHistory.length === 0) return "—";

    const counts = {};
    emotionHistory.forEach(e => {
      counts[e] = (counts[e] || 0) + 1;
    });

    return Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
  }, [emotionHistory]);

  const musicContext = emotionToMusicMap[stableEmotion] || null;

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

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const imageUrl = URL.createObjectURL(blob);
      setSnapshot(imageUrl);

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
        if (data.confidence >= CONFIDENCE_THRESHOLD) {
          setEmotionHistory(prev => {
            const updated = [...prev, data.emotion];
            if (updated.length > EMOTION_WINDOW) updated.shift();
            return updated;
          });
        }
        else {
          addEmotionToBuffer("Neutral");
        }
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

  const playTrack = (src) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(src);
    audio.volume = 0.6;
    audioRef.current = audio;

    audio.play().catch(() => {
      console.log("Waiting for user interaction to enable audio");
    });

    audio.onended = () => {
      handleTrackEnd();
    };
  };

  const handleTrackEnd = () => {
    manualOverrideRef.current = false;
    setManualEmotion(null);

    // If emotion changed mid-track, switch playlist now
    if (pendingEmotionRef.current) {
      const newEmotion = pendingEmotionRef.current;
      pendingEmotionRef.current = null;

      currentPlaylistRef.current = emotionPlaylists[newEmotion];
      currentTrackIndexRef.current = 0;

      playTrack(currentPlaylistRef.current[0]);
      return;
    }

    // Otherwise continue same playlist
    currentTrackIndexRef.current =
      (currentTrackIndexRef.current + 1) %
      currentPlaylistRef.current.length;

    playTrack(currentPlaylistRef.current[currentTrackIndexRef.current]);
  };

  useEffect(() => {
    if (manualOverrideRef.current) return;
    if (!stableEmotion) return;

    const newPlaylist = emotionPlaylists[stableEmotion];
    if (!newPlaylist) return;

    // First time ever
    if (!currentPlaylistRef.current.length) {
      currentPlaylistRef.current = newPlaylist;
      currentTrackIndexRef.current = 0;
      playTrack(newPlaylist[0]);
      return;
    }

    // Same emotion → do nothing
    if (currentPlaylistRef.current === newPlaylist) return;

    // Emotion changed mid-song → queue for later
    pendingEmotionRef.current = stableEmotion;

  }, [stableEmotion]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const playNextTrack = () => {
    manualOverrideRef.current = true;

    currentTrackIndexRef.current =
      (currentTrackIndexRef.current + 1) %
      currentPlaylistRef.current.length;

    playTrack(currentPlaylistRef.current[currentTrackIndexRef.current]);
  };

  const playPrevTrack = () => {
    manualOverrideRef.current = true;

    currentTrackIndexRef.current =
      (currentTrackIndexRef.current - 1 + currentPlaylistRef.current.length) %
      currentPlaylistRef.current.length;

    playTrack(currentPlaylistRef.current[currentTrackIndexRef.current]);
  };

  const switchEmotionManually = (emotion) => {
    // AUTO MODE
    if (emotion === "Auto") {
      manualOverrideRef.current = false;
      setManualEmotion(null);

      // decide emotion NOW
      const autoEmotion = stableEmotion;
      const newPlaylist = emotionPlaylists[autoEmotion];

      if (
        newPlaylist &&
        currentPlaylistRef.current !== newPlaylist
      ) {
        currentPlaylistRef.current = newPlaylist;
        currentTrackIndexRef.current = 0;
        playTrack(newPlaylist[0]);
      }
      return;
    }
    
    // MANUAL MODE
    manualOverrideRef.current = true;
    setManualEmotion(emotion);
    setEmotionHistory([emotion]); // seed buffer with manual emotion

    const playlist = emotionPlaylists[emotion];
    if (!playlist) return;

    currentPlaylistRef.current = playlist;
    currentTrackIndexRef.current = 0;

    playTrack(playlist[0]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>AmeLog 🎵</h1>
      <p>Real-time emotion sampling</p>

      <div onClick={() => audioRef.current?.play()} style={{ cursor: "pointer" }}>
        <small>Click anywhere once to enable adaptive audio</small>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "400px",
          borderRadius: "12px",
          border: "2px solid #ccc",
          transform: "scaleX(-1)",
        }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {snapshot && (
        <div style={{ marginTop: "16px" }}>
          <h3>Sampled Frame</h3>
          <img
            src={snapshot}
            alt="Snapshot"
            style={{ width: "200px", borderRadius: "8px"}}
          />
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <h2>Emotion: {stableEmotion}</h2>
        {musicContext && (
          <div style={{ marginTop: "20px" }}>
            <h3>🎵 Music Recommendation</h3>
            <p><strong>Mood:</strong> {musicContext.mood}</p>
            <p><strong>Genres:</strong> {musicContext.genres.join(", ")}</p>
            <p><strong>Tempo:</strong> {musicContext.tempo}</p>
            <p style={{ fontStyle: "italic" }}>{musicContext.description}</p>
          </div>
        )}
      </div>
      <div style={{
        marginTop: "20px",
        padding: "16px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        maxWidth: "420px"
      }}>
        <h3>🎛 Controls (Test)</h3>

        {/* Playback controls */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <button onClick={playPrevTrack}>⏮ Prev</button>

          <button onClick={togglePlayPause}>
            {isPlaying ? "⏸ Pause" : "▷ Play"}
          </button>

          <button onClick={playNextTrack}>⏭ Next</button>
        </div>

        {/* Manual emotion override */}
        <div>
          <p style={{ marginBottom: "6px" }}>🎭 Switch Emotion</p>

          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px"
          }}>
            {["Happy", "Sad", "Angry", "Fear", "Surprise", "Neutral", "Auto"].map(emotion => (
              <button
                key={emotion}
                onClick={() => switchEmotionManually(emotion)}
                style={{
                  padding: "6px 10px",
                  fontSize: "12px"
                }}
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;