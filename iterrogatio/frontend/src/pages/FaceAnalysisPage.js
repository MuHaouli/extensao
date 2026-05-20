import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./FaceAnalysisPage.css";

export default function FaceAnalysisPage() {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  const recordingActiveRef = useRef(false);
  const facePresentRef = useRef(false);
  const lastTickAtRef = useRef(null);
  const uiLastUpdateAtRef = useRef(0);
  const accumRef = useRef({
    seconds_eyes_open: 0,
    seconds_eyes_closed: 0,
    seconds_posture_good: 0,
    seconds_posture_bad: 0,
  });

  const [status, setStatus] = useState({
    rosto_detectado: false,
    olhos: null,
    postura: null,
  });

  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    seconds_eyes_open: 0,
    seconds_eyes_closed: 0,
    seconds_posture_good: 0,
    seconds_posture_bad: 0,
  });

  async function saveRecording() {
    const payload = { ...accumRef.current };
    try {
      const res = await fetch("http://localhost:8000/api/face/save/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      await res.json();
    } catch (e) {
      // evita spam em caso de backend off
    }
  }

  function startRecording() {
    if (recordingActiveRef.current) return;
    recordingActiveRef.current = true;
    facePresentRef.current = false;
    lastTickAtRef.current = performance.now();
    uiLastUpdateAtRef.current = 0;

    accumRef.current = {
      seconds_eyes_open: 0,
      seconds_eyes_closed: 0,
      seconds_posture_good: 0,
      seconds_posture_bad: 0,
    };

    setRecordingState({
      isRecording: true,
      seconds_eyes_open: 0,
      seconds_eyes_closed: 0,
      seconds_posture_good: 0,
      seconds_posture_bad: 0,
    });
  }

  function stopRecording() {
    if (!recordingActiveRef.current) return;
    recordingActiveRef.current = false;
    facePresentRef.current = false;
    lastTickAtRef.current = null;
    setRecordingState((prev) => ({ ...prev, isRecording: false }));
    saveRecording();
  }

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function ensureCanvasesSized() {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return false;

      const overlay = overlayCanvasRef.current;
      const capture = captureCanvasRef.current;
      if (!overlay || !capture) return false;

      if (overlay.width !== w) overlay.width = w;
      if (overlay.height !== h) overlay.height = h;
      if (capture.width !== w) capture.width = w;
      if (capture.height !== h) capture.height = h;
      return true;
    }

    function drawOverlay(result) {
      const canvas = overlayCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result?.rosto_detectado && result?.bbox) {
        const { x, y, w, h } = result.bbox;
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
      }

      const olhosText = result?.olhos
        ? `Olhos: ${result.olhos === "abertos" ? "abertos" : "fechados"}`
        : "Olhos: -";
      const posturaText = result?.postura
        ? `Postura: ${result.postura === "boa" ? "Boa postura" : "Fora de posição"}`
        : "Postura: -";

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(10, 10, 260, 62);
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.fillText(olhosText, 20, 34);
      ctx.fillText(posturaText, 20, 58);
    }

    async function sendFrameOnce() {
      if (inFlightRef.current) return;
      if (!ensureCanvasesSized()) return;

      const capture = captureCanvasRef.current;
      const ctx = capture.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, capture.width, capture.height);

      inFlightRef.current = true;
      try {
        const blob = await new Promise((resolve) =>
          capture.toBlob(resolve, "image/jpeg", 0.7)
        );
        if (!blob) return;

        const form = new FormData();
        form.append("frame", blob, "frame.jpg");

        const res = await fetch("http://localhost:8000/api/face/analyze/", {
          method: "POST",
          body: form,
        });
        if (!res.ok) return;

        const json = await res.json();
        setStatus({
          rosto_detectado: !!json.rosto_detectado,
          olhos: json.olhos ?? null,
          postura: json.postura ?? null,
        });
        drawOverlay(json);

        if (recordingActiveRef.current) {
          const now = performance.now();
          const prevAt = lastTickAtRef.current ?? now;
          const dtSeconds = Math.max(0, (now - prevAt) / 1000);
          lastTickAtRef.current = now;

          if (json.rosto_detectado) {
            if (!facePresentRef.current) {
              facePresentRef.current = true;
              lastTickAtRef.current = now;
            } else {
              if (json.olhos === "abertos") {
                accumRef.current.seconds_eyes_open += dtSeconds;
              } else if (json.olhos === "fechados") {
                accumRef.current.seconds_eyes_closed += dtSeconds;
              }

              if (json.postura === "boa") {
                accumRef.current.seconds_posture_good += dtSeconds;
              } else if (json.postura === "fora") {
                accumRef.current.seconds_posture_bad += dtSeconds;
              }
            }
          } else {
            facePresentRef.current = false;
          }

          if (now - uiLastUpdateAtRef.current > 250) {
            uiLastUpdateAtRef.current = now;
            setRecordingState((prev) => ({
              ...prev,
              seconds_eyes_open: accumRef.current.seconds_eyes_open,
              seconds_eyes_closed: accumRef.current.seconds_eyes_closed,
              seconds_posture_good: accumRef.current.seconds_posture_good,
              seconds_posture_bad: accumRef.current.seconds_posture_bad,
            }));
          }
        }
      } catch (e) {
        // evita spam no console em caso de backend off
      } finally {
        inFlightRef.current = false;
      }
    }

    function startLoop() {
      if (timerRef.current) return;
      timerRef.current = setInterval(sendFrameOnce, 100);
    }

    function stopLoop() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    const onLoaded = () => {
      ensureCanvasesSized();
      startLoop();
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("playing", onLoaded);
    return () => {
      stopLoop();
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("playing", onLoaded);
      recordingActiveRef.current = false;
    };
  }, []);

  return (
    <div className="face-page">
      <p className="face-back">
        <Link className="face-back-link" to="/">
          ← Interrogatio
        </Link>
      </p>
      <h1 className="face-title">Análise Facial em Tempo Real</h1>

      <div className="cameraWrap">
        <video
          ref={videoRef}
          className="video"
          autoPlay
          playsInline
          muted
        />
        <canvas ref={overlayCanvasRef} className="overlay" />
        <canvas ref={captureCanvasRef} className="capture" />
      </div>

      <div className="status">
        <div><strong>Rosto:</strong> {status.rosto_detectado ? "Detectado" : "Não detectado"}</div>
        <div><strong>Olhos:</strong> {status.olhos ? (status.olhos === "abertos" ? "Abertos" : "Fechados") : "-"}</div>
        <div><strong>Postura:</strong> {status.postura ? (status.postura === "boa" ? "Boa postura" : "Fora de posição") : "-"}</div>
      </div>

      <div className="status recordingBox">
        <div className="recordingButtons">
          <button type="button" className="btn" onClick={startRecording} disabled={recordingState.isRecording}>
            Iniciar
          </button>
          <button type="button" className="btn danger" onClick={stopRecording} disabled={!recordingState.isRecording}>
            Parar
          </button>
        </div>

        <div className="recordingMeta">
          <div><strong>Contador (somente quando rosto detectado):</strong> {recordingState.isRecording ? "Ativo" : "Inativo"}</div>
          <div>Olho aberto: {recordingState.seconds_eyes_open.toFixed(1)}s</div>
          <div>Olho fechado: {recordingState.seconds_eyes_closed.toFixed(1)}s</div>
          <div>Postura boa: {recordingState.seconds_posture_good.toFixed(1)}s</div>
          <div>Postura ruim: {recordingState.seconds_posture_bad.toFixed(1)}s</div>
        </div>
      </div>
    </div>
  );
}
