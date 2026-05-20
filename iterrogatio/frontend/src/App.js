import { useCallback, useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import { ProfessionalAreaModal } from "./components/ProfessionalAreaModal";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import {
    AnalysisPage,
    AuthPage,
    DashboardPage,
    InterviewsPage,
    LandingPage,
    MenuPage,
    ReportsPage,
    UserPage,
} from "./pages";

/** Mensagens do Django (UserCreationForm, etc.), sem repetir o mesmo texto duas vezes. */
function formatAuthApiError(data) {
  const detail = data?.detail;
  const errors = data?.errors;
  if (!errors || typeof errors !== "object") {
    return detail || "Erro.";
  }

  const labels = {
    username: "Usuário",
    email: "E-mail",
    password1: "Senha",
    password2: "Confirmar senha",
    __all__: "Formulário",
  };

  const fieldOrder = ["username", "email", "password1", "password2", "__all__"];
  const seenMsg = new Set();
  const bullets = [];

  const pushField = (field) => {
    const msgs = errors[field];
    if (!Array.isArray(msgs)) return;
    const label = labels[field] || field;
    for (const raw of msgs) {
      const text = String(raw).trim();
      if (!text) continue;
      const key = text.toLowerCase();
      if (seenMsg.has(key)) continue;
      seenMsg.add(key);
      bullets.push(`• ${label}: ${text}`);
    }
  };

  for (const f of fieldOrder) {
    if (errors[f]) pushField(f);
  }
  for (const f of Object.keys(errors)) {
    if (!fieldOrder.includes(f)) pushField(f);
  }

  if (bullets.length === 0) {
    return detail || "Erro de validação.";
  }

  return (
    "O servidor não aceitou estes dados. Motivo:\n\n" + bullets.join("\n")
  );
}

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

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authMessage, setAuthMessage] = useState(null);

  const [status, setStatus] = useState({
    rosto_detectado: false,
    olhos: null,
    postura: null,
    ear: null,
    gaze: null,
    atencao: null,
    emocao: null,
    scores: null,
    analiseAviso: null,
  });

  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    seconds_eyes_open: 0,
    seconds_eyes_closed: 0,
    seconds_posture_good: 0,
    seconds_posture_bad: 0,
  });

  const {
    transcript,
    interimTranscript,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  const [llmAnalysis, setLlmAnalysis] = useState(null);
  const [llmError, setLlmError] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [recordingId, setRecordingId] = useState(null);

  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState(null);

  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  async function saveRecording() {
    const payload = { ...accumRef.current };
    try {
      const res = await fetch("/api/face/save/", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setRecordingId(data.id);
      return data.id;
    } catch (e) {
      // evita spam em caso de backend off
      return null;
    }
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  async function ensureAuthState() {
    try {
      await fetch('/api/auth/csrf/', {
        credentials: 'include',
      });
      const response = await fetch('/api/auth/user/', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogin(payload) {
    setAuthError(null);
    setAuthMessage(null);
    try {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(formatAuthApiError(data) || "Falha ao autenticar.");
        return false;
      }

      setUser(data.user);
      setAuthMessage('Login efetuado com sucesso.');
      navigate('/menu');
      return true;
    } catch (error) {
      setAuthError('Não foi possível conectar ao servidor.');
      return false;
    }
  }

  async function handleRegister(payload) {
    setAuthError(null);
    setAuthMessage(null);
    try {
      const response = await fetch('/api/auth/register/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(formatAuthApiError(data) || "Falha ao registrar.");
        return false;
      }

      setUser(data.user);
      setAuthMessage('Registrado com sucesso.');
      navigate('/menu');
      return true;
    } catch (error) {
      setAuthError('Não foi possível conectar ao servidor.');
      return false;
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });
    } catch (error) {
      // ignore failure, clear local session state anyway
    }
    setUser(null);
    navigate('/auth');
  }

  const startRecording = useCallback(() => {
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
    setLlmAnalysis(null);
    setLlmError(null);
    startListening();
    clearTranscript();
  }, [startListening, clearTranscript]);

  const stopRecording = useCallback(async () => {
    if (!recordingActiveRef.current) return;
    recordingActiveRef.current = false;
    facePresentRef.current = false;
    lastTickAtRef.current = null;
    setRecordingState((prev) => ({ ...prev, isRecording: false }));
    stopListening();

    const fullTranscript = `${transcript}${interimTranscript || ""}`
      .trim()
      .replace(/\s+/g, " ");

    const recId = await saveRecording();

    if (!fullTranscript) {
      setLlmError("Nenhum texto foi transcrito para analisar.");
      setLlmAnalysis(null);
      return;
    }

    if (!recId) {
      setLlmError("Falha ao salvar a gravação.");
      setLlmAnalysis(null);
      return;
    }

    setLlmLoading(true);
    setLlmError(null);
    setLlmAnalysis(null);

    fetch("/api/interview/analyze-transcript/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ transcript: fullTranscript, recording_id: recId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || `Erro ${res.status}`);
        }
        setLlmAnalysis(data);
        setShowProfessionalModal(true);
      })
      .catch((e) => {
        setLlmError(e.message || "Falha ao analisar a transcrição.");
      })
      .finally(() => setLlmLoading(false));
  }, [transcript, interimTranscript, stopListening]);

  const cancelRecording = useCallback(async () => {
    if (!recordingActiveRef.current) return;
    recordingActiveRef.current = false;
    facePresentRef.current = false;
    lastTickAtRef.current = null;
    setRecordingState((prev) => ({ ...prev, isRecording: false }));
    stopListening();
    clearTranscript();

    // Deletar a gravação se ela foi salva
    if (recordingId) {
      try {
        await fetch("/api/face/delete/", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({ recording_id: recordingId }),
        });
      } catch (e) {
        console.error("Erro ao deletar gravação:", e);
      }
      setRecordingId(null);
    }

    // Limpar análises
    setLlmAnalysis(null);
    setLlmError(null);
    
    // Voltar ao menu
    navigate("/menu");
  }, [recordingId, stopListening, clearTranscript, navigate]);

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
    navigate('/comparar-relatorios');
  }

  async function handleGenerateReport(professionalArea) {
    if (!llmAnalysis) {
      setReportError("Nenhuma análise disponível.");
      return;
    }

    setReportLoading(true);
    setReportError(null);
    setReport(null);

    try {
      const res = await fetch("/api/interview/generate-report/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          interview_analysis: llmAnalysis,
          professional_area: professionalArea,
          transcript: transcript,
          recording_id: recordingId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Erro ${res.status}`);
      }

      setReport(data);
      setShowProfessionalModal(false);
      
      // Recarregar lista de entrevistas após gerar novo relatório
      fetchInterviews();
    } catch (e) {
      setReportError(e.message || "Falha ao gerar o relatório.");
    } finally {
      setReportLoading(false);
    }
  }

  async function fetchInterviews() {
    setLoadingInterviews(true);
    try {
      const res = await fetch("/api/interview/list/", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const interviewsList = data.interviews.map((iv, index) => ({
          id: iv.id,
          title: `Entrevista ${String(index + 1).padStart(2, '0')}`,
          date: iv.date_formatted,
          average_score: iv.average_score,
          professional_area: iv.professional_area,
          status: "Concluída",
        }));
        setInterviews(interviewsList);
      }
    } catch (e) {
      console.error("Erro ao carregar entrevistas:", e);
    } finally {
      setLoadingInterviews(false);
    }
  }

  async function fetchInterviewDetail(interviewId) {
    try {
      const res = await fetch(`/api/interview/${interviewId}/`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedInterview(data);
      } else {
        console.error("Erro ao carregar detalhes da entrevista");
      }
    } catch (e) {
      console.error("Erro:", e);
    }
  }

  function handleCancelReport() {
    setShowProfessionalModal(false);
    setReportError(null);
  }

  function handleSaveReport() {
    if (!report) return;

    const blob = new Blob([report.report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date(report.generated_at).toISOString().replace(/[:.]/g, '-');
    const filename = `relatorio_${report.professional_area.replace(/\s+/g, '_')}_${timestamp}.txt`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function goToAuth() {
    navigate('/auth');
  }

  // ÚNICO useEffect que gerencia câmera e análise
  useEffect(() => {
    if (location.pathname !== "/analise") {
      // Limpar quando sair da página de análise
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      recordingActiveRef.current = false;
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let localStream = null;
    let videoElementForCleanup = null;
    let isMounted = true;

    async function initializeAnalysis() {
      console.log("Inicializando análise facial...");
      try {
        // 1. Obter stream de câmera (frente quando existir; evita quadro 0×0 em vários browsers)
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          videoElementForCleanup = videoRef.current;
          console.log("Stream atribuído ao videoRef");
        }

        // 2. Esperar metadados + reprodução ativa e dimensões > 0 (senão o canvas manda JPEG preto)
        const video = videoRef.current;
        if (!video) return;

        await new Promise((resolve) => {
          const handleMetadata = () => {
            resolve();
            video.removeEventListener("loadedmetadata", handleMetadata);
          };
          if (video.readyState >= 2) {
            resolve();
          } else {
            video.addEventListener("loadedmetadata", handleMetadata);
          }
        });

        try {
          await video.play();
        } catch (e) {
          console.warn("video.play():", e);
        }

        const deadline = performance.now() + 8000;
        while (
          isMounted &&
          (video.videoWidth === 0 || video.videoHeight === 0) &&
          performance.now() < deadline
        ) {
          await new Promise((r) => requestAnimationFrame(r));
        }

        if (!isMounted) return;
        if (!video.videoWidth || !video.videoHeight) {
          console.error(
            "Vídeo sem dimensões (videoWidth/videoHeight). Verifique permissões da câmera e drivers."
          );
        }

        // 3. Setup de funções de análise
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
            if (!blob) {
              console.log("Blob criação falhou");
              return;
            }

            const form = new FormData();
            form.append("frame", blob, "frame.jpg");

            console.log("Enviando frame para API...");
            const res = await fetch("/api/face/analyze/", {
              method: "POST",
              credentials: 'include',
              body: form,
            });
            
            if (!res.ok) {
              console.error("API Error:", res.status, res.statusText);
              return;
            }

            const json = await res.json();
            console.log("API Response:", json);
            
            if (isMounted) {
              console.log("Atualizando status:", json);
              setStatus({
                rosto_detectado: !!json.rosto_detectado,
                olhos: json.olhos ?? null,
                postura: json.postura ?? null,
                ear: json.ear ?? null,
                gaze: json.gaze ?? null,
                atencao: json.atencao ?? null,
                emocao: json.emocao ?? null,
                scores: json.scores ?? null,
                analiseAviso: json.rosto_detectado
                  ? null
                  : json.detail
                    ? String(json.detail)
                    : null,
              });
              drawOverlay(json);
            }

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
                if (isMounted) {
                  setRecordingState((prev) => ({
                    ...prev,
                    seconds_eyes_open: accumRef.current.seconds_eyes_open,
                    seconds_eyes_closed: accumRef.current.seconds_eyes_closed,
                    seconds_posture_good: accumRef.current.seconds_posture_good,
                    seconds_posture_bad: accumRef.current.seconds_posture_bad,
                  }));
                }
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

        // 4. Iniciar loop de análise
        startLoop();
        console.log("Loop de análise iniciado a cada 100ms");
      } catch (err) {
        console.error("Erro ao inicializar câmera:", err);
      }
    }

    initializeAnalysis();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (videoElementForCleanup) {
        videoElementForCleanup.srcObject = null;
      }
      recordingActiveRef.current = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!authLoading && !user && !['/', '/auth'].includes(location.pathname)) {
      navigate('/auth');
    }
  }, [authLoading, user, location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname === '/entrevistas' || location.pathname === '/dashboards') {
      fetchInterviews();
    }
  }, [location.pathname]);

  useEffect(() => {
    ensureAuthState();
  }, []);

  return (
    <div className="page">
      <Routes>
        <Route path="/" element={<LandingPage goToAuth={goToAuth} />} />
        <Route
          path="/auth"
          element={
            <AuthPage
              handleLogin={handleLogin}
              handleRegister={handleRegister}
              authError={authError}
              authMessage={authMessage}
            />
          }
        />
        <Route
          path="/menu"
          element={
            <MenuPage
              goToInterviews={goToInterviews}
              goToManageUser={goToManageUser}
              goToAnalysis={goToAnalysis}
              goToDashboards={goToDashboards}
              goToCompareReports={goToCompareReports}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/entrevistas"
          element={<InterviewsPage 
            interviews={interviews} 
            selectedInterview={selectedInterview} 
            onLogout={handleLogout}
            onSelectInterview={(id) => {
              if (id) {
                fetchInterviewDetail(id);
              } else {
                setSelectedInterview(null);
              }
            }}
          />}
        />
        <Route path="/dashboards" element={
          <DashboardPage 
            interviews={interviews}
            onLogout={handleLogout}
            onSelectInterview={(id) => {
              if (id) {
                fetchInterviewDetail(id);
                navigate('/entrevistas');
              }
            }}
          />
        } />
        <Route path="/usuario" element={<UserPage onLogout={handleLogout} />} />
        <Route path="/comparar-relatorios" element={<ReportsPage onLogout={handleLogout} />} />
        <Route
          path="/analise"
          element={
            <AnalysisPage
              videoRef={videoRef}
              overlayCanvasRef={overlayCanvasRef}
              captureCanvasRef={captureCanvasRef}
              status={status}
              recordingState={recordingState}
              startRecording={startRecording}
              stopRecording={stopRecording}
              cancelRecording={cancelRecording}
              transcript={transcript}
              interimTranscript={interimTranscript}
              isListening={isListening}
              speechError={speechError}
              llmAnalysis={llmAnalysis}
              llmLoading={llmLoading}
              llmError={llmError}
              goToMenu={goToMenu}
              onLogout={handleLogout}
            />
          }
        />
      </Routes>

      <ProfessionalAreaModal
        isOpen={showProfessionalModal}
        onGenerate={handleGenerateReport}
        onCancel={handleCancelReport}
        isLoading={reportLoading}
      />

      {report && (
        <div className="report-display">
          <div className="report-container">
            <div className="report-header">
              <div className="report-header-title">
                <span className="report-label">Relatório</span>
                <h2>{report.professional_area}</h2>
              </div>
              <div className="report-header-actions">
                <div className="report-status-chip">Pronto para salvar</div>
                <button
                  className="btn secondary close-report"
                  onClick={() => setReport(null)}
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="report-summary">
              <div className="report-pill">Área: {report.professional_area}</div>
              <div className="report-short">
                <p>
                  Relatório gerado com base na análise da entrevista. As conclusões abaixo
                  foram adaptadas para a área profissional selecionada.
                </p>
              </div>
            </div>

            <div className="report-indicators">
              {llmAnalysis && [
                { key: 'coerencia', label: 'Coerência' },
                { key: 'dominio_assunto', label: 'Domínio' },
                { key: 'clareza_objetividade', label: 'Clareza' },
                { key: 'organizacao_ideias', label: 'Organização' },
              ].map((item) => {
                const block = llmAnalysis[item.key];
                const value = block?.nota != null ? Number(block.nota) : 0;
                return (
                  <div key={item.key} className="report-indicator">
                    <div className="report-indicator-label">
                      <span>{item.label}</span>
                      <strong>{value.toFixed(1)}</strong>
                    </div>
                    <div className="report-progress">
                      <div className="report-progress-fill" style={{ width: `${Math.min(value, 10) * 10}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="report-content">
              {report.report}
            </div>

            <div className="report-footer">
              <p className="report-meta">
                Gerado em {new Date(report.generated_at).toLocaleString("pt-BR")}
              </p>
              <button className="btn primary report-save-button" onClick={handleSaveReport}>
                Salvar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {reportError && (
        <div className="error-banner">
          <span>{reportError}</span>
          <button
            className="btn secondary"
            onClick={() => setReportError(null)}
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
