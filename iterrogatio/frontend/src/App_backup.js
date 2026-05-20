import { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import {
  LandingPage,
  AuthPage,
  MenuPage,
  InterviewsPage,
  DashboardPage,
  UserPage,
  ReportsPage,
  AnalysisPage,
} from "./pages";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const [interviews, setInterviews] = useState([
    { id: 1, title: "Entrevista 01", date: "12/10/2025", status: "Concluída" },
    { id: 2, title: "Entrevista 02", date: "15/10/2025", status: "Concluída" },
    { id: 3, title: "Entrevista 03", date: "20/10/2025", status: "Em Análise" },
  ]);

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

  function goToAnalysis() {
    navigate("/analise");
  }

  function goToMenu() {
    navigate("/menu");
  }

  function goToInterviews() {
    navigate("/entrevistas");
  }

  function goToDashboards() {
    navigate("/dashboards");
  }

  function goToManageUser() {
    navigate("/usuario");
  }

  function goToCompareReports() {
    navigate("/comparar-relatorios");
  }

  function handleLogin() {
    navigate("/menu");
  }

  function handleRegister() {
    navigate("/menu");
  }

  function goToAuth() {
    navigate("/auth");
  }

  function goToLanding() {
    navigate("/");
  }

  useEffect(() => {
    if (location.pathname !== "/analise") {
      return;
    }

    let localStream = null;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error(err));

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/analise") {
      return;
    }

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

        // Modo gravação: acumula tempo por categoria enquanto o rosto está detectado.
        if (recordingActiveRef.current) {
          const now = performance.now();
          const prevAt = lastTickAtRef.current ?? now;
          const dtSeconds = Math.max(0, (now - prevAt) / 1000);
          lastTickAtRef.current = now;

          if (json.rosto_detectado) {
            // Só conta o tempo depois que o rosto foi detectado pela primeira vez.
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
            // Quando perde o rosto, não acumula tempo (e reseta a condição de "começar a contar").
            facePresentRef.current = false;
          }

          // Throttle pra não dar re-render a cada frame.
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
  }, [location.pathname]);

  return (
    <div className="page">
      <Routes>
        <Route path="/" element={<LandingPage goToAuth={goToAuth} />} />
        <Route path="/auth" element={<AuthPage handleLogin={handleLogin} handleRegister={handleRegister} />} />
        <Route path="/menu" element={<MenuPage goToInterviews={goToInterviews} goToManageUser={goToManageUser} goToAnalysis={goToAnalysis} goToDashboards={goToDashboards} goToCompareReports={goToCompareReports} />} />
        <Route path="/entrevistas" element={<InterviewsPage interviews={interviews} goToInterviews={goToInterviews} goToManageUser={goToManageUser} goToAnalysis={goToAnalysis} goToCompareReports={goToCompareReports} />} />
        <Route path="/dashboards" element={<DashboardPage goToInterviews={goToInterviews} goToManageUser={goToManageUser} goToAnalysis={goToAnalysis} goToCompareReports={goToCompareReports} />} />
        <Route path="/usuario" element={<UserPage goToInterviews={goToInterviews} goToManageUser={goToManageUser} goToAnalysis={goToAnalysis} goToCompareReports={goToCompareReports} />} />
        <Route path="/comparar-relatorios" element={<ReportsPage goToInterviews={goToInterviews} goToManageUser={goToManageUser} goToAnalysis={goToAnalysis} goToCompareReports={goToCompareReports} />} />
        <Route path="/analise" element={<AnalysisPage videoRef={videoRef} overlayCanvasRef={overlayCanvasRef} captureCanvasRef={captureCanvasRef} status={status} recordingState={recordingState} startRecording={startRecording} stopRecording={stopRecording} goToMenu={goToMenu} />} />
      </Routes>
    </div>
  );
}

export default App;