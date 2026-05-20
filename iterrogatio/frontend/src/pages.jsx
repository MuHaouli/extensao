import { useState, useEffect } from "react";
import { SideNav } from "./components/SideNav";
export function LandingPage({ goToAuth }) {
  return (
    <div className="landing-view">
      <div className="landing-header">
        <h1 className="landing-logo">Interrogatio</h1>
        <button className="landing-login" onClick={goToAuth}>
          Logar
        </button>
      </div>
      <div className="landing-main">
        <div className="landing-content">
          <h1 className="landing-headline">Análise profissional de entrevistas com IA.</h1>
          <p className="landing-subtitle">
            Transforme suas entrevistas em insights claros e objetivos com feedback automático e inteligente
          </p>
        </div>
        <div className="landing-hero">
          <img 
            src="/logoMenuHomem.png" 
            alt="Illustration" 
            className="landing-hero-image" 
          />
        </div>
      </div>
    </div>
  );
}

export function AuthPage({ handleLogin, handleRegister, authError, authMessage }) {
  const [authMode, setAuthMode] = useState("login");
  const [fields, setFields] = useState({
    username: "",
    email: "",
    login: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
  });
  const [localError, setLocalError] = useState(null);

  const onChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setLocalError(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLocalError(null);

    if (authMode === "login") {
      if (!fields.login || !fields.password) {
        setLocalError("Preencha usuário/e-mail e senha.");
        return;
      }
      await handleLogin({
        login: fields.login,
        password: fields.password,
        remember_me: fields.rememberMe,
      });
      return;
    }

    if (!fields.username || !fields.email || !fields.password || !fields.confirmPassword) {
      setLocalError("Preencha todos os campos.");
      return;
    }
    if (fields.password !== fields.confirmPassword) {
      setLocalError("As senhas não coincidem.");
      return;
    }

    await handleRegister({
      username: fields.username,
      email: fields.email,
      password1: fields.password,
      password2: fields.confirmPassword,
    });
  };

  return (
    <div className="auth-view">
      <div className="auth-card">
        <h1 className="auth-logo">Interrogatio</h1>
        <p className="auth-mode-label">{authMode === "login" ? "LOGIN" : "CADASTRO"}</p>

        <form className="auth-form" onSubmit={submit}>
          {authMode === "register" && (
            <input
              type="text"
              placeholder="USUÁRIO"
              className="auth-input"
              value={fields.username}
              onChange={(e) => onChange('username', e.target.value)}
            />
          )}
          <input
            type="text"
            placeholder={authMode === "login" ? "USUÁRIO OU E-MAIL" : "E-MAIL"}
            className="auth-input"
            value={authMode === "login" ? fields.login : fields.email}
            onChange={(e) => onChange(authMode === "login" ? 'login' : 'email', e.target.value)}
          />
          <input
            type="password"
            placeholder="SENHA"
            className="auth-input"
            value={fields.password}
            onChange={(e) => onChange('password', e.target.value)}
          />
          {authMode === "register" && (
            <input
              type="password"
              placeholder="CONFIRMAR SENHA"
              className="auth-input"
              value={fields.confirmPassword}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
            />
          )}
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={fields.rememberMe}
              onChange={(e) => onChange('rememberMe', e.target.checked)}
            />
            Lembrar sessão
          </label>
          <button type="submit" className="btn btn-auth">
            {authMode === "login" ? "LOGIN" : "CRIAR CONTA"}
          </button>
        </form>

        {(localError || authError || authMessage) && (
          <div
            className={`message ${authMessage ? "success" : "error"}`}
            style={
              !authMessage && (localError || authError)
                ? { whiteSpace: "pre-line", textAlign: "left" }
                : undefined
            }
          >
            {localError || authError || authMessage}
          </div>
        )}

        <div className="auth-toggle">
          {authMode === "login" ? (
            <p>
              Não tem conta?{' '}
              <a
                href="#register"
                onClick={(e) => {
                  e.preventDefault();
                  setAuthMode('register');
                }}
              >
                REGISTRE-SE
              </a>
            </p>
          ) : (
            <p>
              Já tem conta?{' '}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  setAuthMode('login');
                }}
              >
                FAÇA LOGIN
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MenuPage({
  goToInterviews,
  goToManageUser,
  goToAnalysis,
  goToDashboards,
  goToCompareReports,
  onLogout,
}) {
  return (
    <div className="menu-view">
      <SideNav onLogout={onLogout} />
      <div className="menu-content">
        <h1 className="menu-title">Menu Principal</h1>
        <div className="menu-grid">
          <button
            className="menu-card"
            onClick={goToAnalysis}
          >
            <span className="menu-icon">🎥</span>
            <span className="menu-label">Fazer nova Entrevista</span>
          </button>
          <button
            className="menu-card"
            onClick={goToDashboards}
          >
            <span className="menu-icon">📊</span>
            <span className="menu-label">Dashboards</span>
          </button>
          <button
            className="menu-card"
            onClick={goToInterviews}
          >
            <span className="menu-icon">📋</span>
            <span className="menu-label">Minhas Entrevistas</span>
          </button>
          <button
            className="menu-card"
            onClick={goToManageUser}
          >
            <span className="menu-icon">👤</span>
            <span className="menu-label">Gerenciar Usuário</span>
          </button>
          <button
            className="menu-card"
            onClick={goToCompareReports}
          >
            <span className="menu-icon">📈</span>
            <span className="menu-label">Comparar Relatórios</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function InterviewsPage({ interviews, selectedInterview, onLogout, onSelectInterview }) {
  return (
    <div className="interviews-view">
      <SideNav onLogout={onLogout} />
      <div className="interviews-content">
        <h1 className="interviews-title">MINHAS ENTREVISTAS</h1>
        
        {selectedInterview ? (
          <div className="interview-detail">
            <button 
              className="btn secondary" 
              onClick={() => onSelectInterview(null)}
              style={{ marginBottom: '1.5rem' }}
            >
              &lt; Voltar
            </button>
            
            <div className="interview-detail-header">
              <h2>{selectedInterview.title || 'Entrevista'}</h2>
              <span className="interview-detail-area">{selectedInterview.professional_area}</span>
              <p className="interview-detail-date">
                {selectedInterview.date_formatted} às {selectedInterview.time_formatted}
              </p>
            </div>

            <div className="interview-sections">
              <section className="interview-section">
                <h3>Área Profissional</h3>
                <p>{selectedInterview.professional_area}</p>
              </section>

              <section className="interview-section">
                <h3>Transcrição</h3>
                <div className="interview-transcript">
                  {selectedInterview.transcript}
                </div>
              </section>

              <section className="interview-section">
                <h3>Análise da IA</h3>
                <div className="interview-analysis">
                  {selectedInterview.analysis && (
                    <>
                      {['coerencia', 'dominio_assunto', 'clareza_objetividade', 'organizacao_ideias'].map((key) => {
                        const item = selectedInterview.analysis[key];
                        const label = {
                          coerencia: 'Coerência',
                          dominio_assunto: 'Domínio do Assunto',
                          clareza_objetividade: 'Clareza e Objetividade',
                          organizacao_ideias: 'Organização das Ideias'
                        }[key];
                        
                        return item ? (
                          <div key={key} className="analysis-item">
                            <h4>{label}</h4>
                            <p className="analysis-score">Nota: {item.nota}/10</p>
                            <p className="analysis-justification">{item.justificativa}</p>
                          </div>
                        ) : null;
                      })}
                    </>
                  )}
                </div>
              </section>

              <section className="interview-section">
                <h3>Relatório Personalizado</h3>
                <div className="interview-report">
                  {selectedInterview.report}
                </div>
              </section>

              {selectedInterview.behavioral_data && Object.keys(selectedInterview.behavioral_data).length > 0 && (
                <section className="interview-section">
                  <h3>Dados Comportamentais</h3>
                  <div className="interview-behavioral">
                    <div className="behavioral-item">
                      <span>Olhos Abertos:</span>
                      <strong>{selectedInterview.behavioral_data.seconds_eyes_open?.toFixed(1) || '0'}s</strong>
                    </div>
                    <div className="behavioral-item">
                      <span>Olhos Fechados:</span>
                      <strong>{selectedInterview.behavioral_data.seconds_eyes_closed?.toFixed(1) || '0'}s</strong>
                    </div>
                    <div className="behavioral-item">
                      <span>Postura Boa:</span>
                      <strong>{selectedInterview.behavioral_data.seconds_posture_good?.toFixed(1) || '0'}s</strong>
                    </div>
                    <div className="behavioral-item">
                      <span>Má Postura:</span>
                      <strong>{selectedInterview.behavioral_data.seconds_posture_bad?.toFixed(1) || '0'}s</strong>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="interviews-list">
            {interviews.length === 0 ? (
              <p className="no-interviews">Nenhuma entrevista realizada ainda.</p>
            ) : (
              interviews.map((interview) => (
                <div key={interview.id} className="interview-card">
                  <div className="interview-header">
                    <h3 className="interview-name">{interview.title}</h3>
                    <span className="interview-date">{interview.date}</span>
                  </div>
                  <div className="interview-card-middle">
                    <div className="interview-area-tag">{interview.professional_area}</div>
                    <div className="interview-score-display">
                      <div className="score-label">Média</div>
                      <div className="score-value">{interview.average_score?.toFixed(1) || '0'}/10</div>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill"
                          style={{ width: `${(interview.average_score || 0) * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="interview-footer">
                    <span
                      className={`interview-status ${
                        interview.status === "Concluída" ? "completed" : "analyzing"
                      }`}
                    >
                      {interview.status === "Concluída" ? "✓" : "⏳"} {interview.status}
                    </span>
                    <button 
                      className="btn btn-small"
                      onClick={() => onSelectInterview(interview.id)}
                    >
                      Ver Relatório &gt;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardPage({ interviews, onLogout, onSelectInterview }) {
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  return (
    <div className="dashboard-view">
      <SideNav onLogout={onLogout} />
      <div className="dashboard-content">
        {selectedDashboard ? (
          <div className="dashboard-detail">
            <button 
              className="btn secondary" 
              onClick={() => setSelectedDashboard(null)}
              style={{ marginBottom: '1.5rem' }}
            >
              &lt; Voltar
            </button>
            
            <div className="dashboard-header">
              <h2>{selectedDashboard.title}</h2>
              <span className="dashboard-area">{selectedDashboard.professional_area}</span>
              <p className="dashboard-date">
                {selectedDashboard.date} às {selectedDashboard.time}
              </p>
            </div>

            <div className="dashboards-grid">
              <section className="dashboard-card">
                <h3>Notas da Avaliação</h3>
                <div className="scores-display">
                  <div className="score-item">
                    <span>Coerência</span>
                    <div className="score-value-large">{selectedDashboard.coerencia || '-'}/10</div>
                  </div>
                  <div className="score-item">
                    <span>Domínio</span>
                    <div className="score-value-large">{selectedDashboard.dominio_assunto || '-'}/10</div>
                  </div>
                  <div className="score-item">
                    <span>Clareza</span>
                    <div className="score-value-large">{selectedDashboard.clareza_objetividade || '-'}/10</div>
                  </div>
                  <div className="score-item">
                    <span>Organização</span>
                    <div className="score-value-large">{selectedDashboard.organizacao_ideias || '-'}/10</div>
                  </div>
                </div>
              </section>

              <section className="dashboard-card">
                <h3>Dados Comportamentais</h3>
                <div className="behavioral-stats">
                  <div className="stat-item">
                    <span className="stat-label">Olhos Abertos</span>
                    <span className="stat-value">{selectedDashboard.seconds_eyes_open || '0'}s</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Olhos Fechados</span>
                    <span className="stat-value">{selectedDashboard.seconds_eyes_closed || '0'}s</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Boa Postura</span>
                    <span className="stat-value">{selectedDashboard.seconds_posture_good || '0'}s</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Má Postura</span>
                    <span className="stat-value">{selectedDashboard.seconds_posture_bad || '0'}s</span>
                  </div>
                </div>
              </section>

              <section className="dashboard-card dashboard-card-full">
                <h3>Resumo da Avaliação</h3>
                <div className="evaluation-summary">
                  {selectedDashboard.coerencia_justificativa && (
                    <div className="summary-item">
                      <h4>Coerência</h4>
                      <p>{selectedDashboard.coerencia_justificativa}</p>
                    </div>
                  )}
                  {selectedDashboard.dominio_assunto_justificativa && (
                    <div className="summary-item">
                      <h4>Domínio do Assunto</h4>
                      <p>{selectedDashboard.dominio_assunto_justificativa}</p>
                    </div>
                  )}
                  {selectedDashboard.clareza_objetividade_justificativa && (
                    <div className="summary-item">
                      <h4>Clareza e Objetividade</h4>
                      <p>{selectedDashboard.clareza_objetividade_justificativa}</p>
                    </div>
                  )}
                  {selectedDashboard.organizacao_ideias_justificativa && (
                    <div className="summary-item">
                      <h4>Organização das Ideias</h4>
                      <p>{selectedDashboard.organizacao_ideias_justificativa}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <button 
              className="btn primary" 
              onClick={() => onSelectInterview(selectedDashboard.id)}
              style={{ marginTop: '1.5rem' }}
            >
              Ver Relatório Completo
            </button>
          </div>
        ) : (
          <div className="dashboards-list-view">
            <h1>Dashboards de Desempenho</h1>
            <p className="dashboards-subtitle">Selecione uma entrevista para visualizar seu dashboard</p>
            
            {interviews.length === 0 ? (
              <div className="no-dashboards">
                <p>Nenhuma entrevista realizada ainda.</p>
              </div>
            ) : (
              <div className="dashboards-list">
                {interviews.map((interview) => (
                  <div key={interview.id} className="dashboard-list-item">
                    <div className="dashboard-list-header">
                      <h3>{interview.title}</h3>
                      <span className="dashboard-list-date">{interview.date}</span>
                    </div>
                    <div className="dashboard-list-area">
                      <span className="area-tag">{interview.professional_area}</span>
                      <span className="avg-score">Média: {interview.average_score}/10</span>
                    </div>
                    <button 
                      className="btn primary btn-view-dashboard"
                      onClick={async () => {
                        const res = await fetch(`/api/interview/${interview.id}/`);
                        if (res.ok) {
                          const data = await res.json();
                          setSelectedDashboard({
                            id: interview.id,
                            title: interview.title,
                            date: interview.date,
                            time: data.time_formatted,
                            professional_area: interview.professional_area,
                            average_score: interview.average_score,
                            coerencia: data.analysis?.coerencia?.nota,
                            dominio_assunto: data.analysis?.dominio_assunto?.nota,
                            clareza_objetividade: data.analysis?.clareza_objetividade?.nota,
                            organizacao_ideias: data.analysis?.organizacao_ideias?.nota,
                            coerencia_justificativa: data.analysis?.coerencia?.justificativa,
                            dominio_assunto_justificativa: data.analysis?.dominio_assunto?.justificativa,
                            clareza_objetividade_justificativa: data.analysis?.clareza_objetividade?.justificativa,
                            organizacao_ideias_justificativa: data.analysis?.organizacao_ideias?.justificativa,
                            seconds_eyes_open: data.behavioral_data?.seconds_eyes_open?.toFixed(1),
                            seconds_eyes_closed: data.behavioral_data?.seconds_eyes_closed?.toFixed(1),
                            seconds_posture_good: data.behavioral_data?.seconds_posture_good?.toFixed(1),
                            seconds_posture_bad: data.behavioral_data?.seconds_posture_bad?.toFixed(1),
                          });
                        }
                      }}
                    >
                      Ver Dashboard →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function UserPage({ onLogout }) {
  const [userData, setUserData] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    fetchUserData();
  }, []);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/user/', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUserData(data.user);
          setFormData(data.user);
        } else {
          setError('Usuário não autenticado.');
        }
      } else {
        setError('Erro ao carregar dados do usuário.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/update/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setUserData(data.user);
        setMessage('Perfil atualizado com sucesso.');
        setEditing(false);
      } else {
        setError(data.detail || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('As senhas não coincidem.');
      return;
    }
    try {
      const response = await fetch('/api/auth/change_password/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(passwordData),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.detail);
        setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      } else {
        setError(data.detail || 'Erro ao alterar senha.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
  };

  if (loading) {
    return (
      <div className="user-view">
        <SideNav onLogout={onLogout} />
        <div className="user-content">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-view">
      <SideNav onLogout={onLogout} />
      <div className="user-content">
        <h1>Gerenciar Usuário</h1>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
        <div className="user-profile">
          <h2>Dados Pessoais</h2>
          {!editing ? (
            <div>
              <p><strong>Usuário:</strong> {userData.username}</p>
              <p><strong>E-mail:</strong> {userData.email}</p>
              <button onClick={() => setEditing(true)}>Editar</button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile}>
              <label>
                Usuário:
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                E-mail:
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <div className="button-row">
                <button type="submit">Salvar</button>
                <button type="button" onClick={() => { setEditing(false); setFormData(userData); }}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
        <div className="user-password">
          <h2>Alterar Senha</h2>
          <form onSubmit={handleChangePassword}>
            <label>
              Senha Antiga:
              <input
                type="password"
                name="old_password"
                value={passwordData.old_password}
                onChange={handlePasswordChange}
                required
              />
            </label>
            <label>
              Nova Senha:
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
              />
            </label>
            <label>
              Confirmar Nova Senha:
              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                required
              />
            </label>
            <button type="submit">Alterar Senha</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ReportsPage({ onLogout }) {
  const [interviews, setInterviews] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);

  // Buscar lista de entrevistas ao carregar
  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/list/", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Erro ao buscar entrevistas");
      }
      setInterviews(data.interviews || []);
    } catch (err) {
      setError(err.message || "Falha ao carregar entrevistas");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError("Selecione pelo menos 2 entrevistas para comparar");
      return;
    }

    setCompareLoading(true);
    setError(null);
    setComparison(null);

    try {
      const res = await fetch("/api/interview/compare/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ interview_ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Erro ao comparar entrevistas");
      }

      setComparison(data);
    } catch (err) {
      setError(err.message || "Falha ao comparar entrevistas");
    } finally {
      setCompareLoading(false);
    }
  };

  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  return (
    <div className="reports-view">
      <SideNav onLogout={onLogout} />
      <div className="reports-content">
        <h1>Comparar Relatórios</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="comparison-container">
          {!comparison ? (
            <div className="selection-section">
              <h2>Selecione as Entrevistas para Comparar</h2>
              <p className="selection-info">
                Selecione pelo menos 2 entrevistas para visualizar a comparação detalhada
              </p>

              {loading ? (
                <div className="loading">Carregando entrevistas...</div>
              ) : interviews.length === 0 ? (
                <div className="no-interviews">
                  Nenhuma entrevista encontrada. Realize entrevistas para poder compará-las.
                </div>
              ) : (
                <>
                  <div className="interviews-selection">
                    {interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className={`interview-checkbox-item ${
                          selectedIds.includes(interview.id) ? "selected" : ""
                        }`}
                        onClick={() => toggleSelection(interview.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(interview.id)}
                          onChange={() => toggleSelection(interview.id)}
                          className="interview-checkbox"
                        />
                        <div className="interview-info">
                          <div className="interview-number-label">Entrevista {interview.sequence}</div>
                          <div className="interview-area">
                            {interview.professional_area}
                          </div>
                          <div className="interview-date">
                            {interview.date_formatted} às {interview.time_formatted}
                          </div>
                          <div className="interview-score">
                            Média: {interview.average_score}/10
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="selection-actions">
                    <div className="selected-count">
                      {selectedIds.length} entrevista(s) selecionada(s)
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleCompare}
                      disabled={selectedIds.length < 2 || compareLoading}
                    >
                      {compareLoading ? "Comparando..." : "Comparar Entrevistas"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="comparison-results">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setComparison(null);
                  setSelectedIds([]);
                }}
              >
                ← Voltar à Seleção
              </button>

              <h2>Análise Comparativa</h2>

              {/* Resumo das entrevistas */}
              <div className="comparison-interviews-summary">
                <h3>Entrevistas Analisadas</h3>
                <div className="interviews-row">
                  {comparison.interviews.map((interview) => (
                    <div key={interview.id} className="interview-summary-card">
                      <div className="position-badge">#{interview.sequence}</div>
                      <div className="interview-number">Entrevista {interview.sequence}</div>
                      <div className="area-tag">{interview.professional_area}</div>
                      <div className="date-info">{interview.date_formatted}</div>
                      <div className="time-info">{interview.time_formatted}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparação de Critérios */}
              <div className="criteria-comparison">
                <h3>Evolução dos Critérios de Avaliação</h3>
                <div className="criteria-grid">
                  {Object.entries(comparison.criteria_comparison || {}).map(
                    ([key, criterion]) => (
                      <div key={key} className="criterion-card">
                        <div className="criterion-header">
                          <h4>{criterion.label}</h4>
                          <div
                            className={`trend-badge ${criterion.trend.replace(
                              /ã/g,
                              "a"
                            )}`}
                          >
                            {criterion.trend === "melhorou"
                              ? "📈 Melhorou"
                              : criterion.trend === "piorou"
                              ? "📉 Piorou"
                              : "➡️ Manteve"}
                          </div>
                        </div>

                        <div className="score-evolution">
                          <div className="score-item">
                            <span className="label">Primeira Entrevista</span>
                            <span className="score">{criterion.first_score}/10</span>
                          </div>
                          <div className="score-change">
                            {criterion.difference > 0
                              ? `+${criterion.difference}`
                              : criterion.difference}
                          </div>
                          <div className="score-item">
                            <span className="label">Última Entrevista</span>
                            <span className="score">{criterion.last_score}/10</span>
                          </div>
                        </div>

                        <div className="criterion-details">
                          <div className="detail-average">
                            Média: {criterion.average}/10
                          </div>
                          {criterion.details.map((detail, idx) => (
                            <div key={idx} className="detail-item">
                              <span className="detail-index">Entrevista {idx + 1}</span>
                              <span className="detail-score">
                                {detail.score}/10
                              </span>
                            </div>
                          ))}
                        </div>

                        {criterion.details[0]?.justification && (
                          <div className="justification-section">
                            <p className="justification-label">Primeira análise:</p>
                            <p className="justification-text">
                              {criterion.details[0].justification.substring(0, 150)}
                              ...
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Comparação de Comportamento */}
              <div className="behavioral-comparison">
                <h3>Análise Comportamental</h3>
                <div className="behavioral-grid">
                  {Object.entries(comparison.behavioral_comparison || {}).map(
                    ([key, metric]) => (
                      <div key={key} className="behavioral-card">
                        <div className="behavioral-header">
                          <h4>{metric.label}</h4>
                          <div
                            className={`trend-badge ${metric.trend.replace(
                              /ã/g,
                              "a"
                            )}`}
                          >
                            {metric.trend === "melhorou"
                              ? "📈 Melhorou"
                              : metric.trend === "piorou"
                              ? "📉 Piorou"
                              : "➡️ Manteve"}
                          </div>
                        </div>

                        <div className="value-evolution">
                          <div className="value-item">
                            <span className="label">Primeira</span>
                            <span className="value">{metric.first_value}s</span>
                          </div>
                          <div className="value-change">
                            {metric.difference > 0
                              ? `+${metric.difference}s`
                              : `${metric.difference}s`}
                          </div>
                          <div className="value-item">
                            <span className="label">Última</span>
                            <span className="value">{metric.last_value}s</span>
                          </div>
                        </div>

                        <div className="metric-average">
                          Média: {metric.average}s
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Resumo de Melhorias */}
              {comparison.improvements && (
                <div className="improvements-summary">
                  <h3>Resumo de Evolução</h3>

                  {comparison.improvements.strengths.length > 0 && (
                    <div className="improvement-section strengths">
                      <h4>✨ Melhorias Identificadas</h4>
                      <ul>
                        {comparison.improvements.strengths.map((item, idx) => (
                          <li key={idx}>
                            <span className="criterion">
                              {item.criterion}
                            </span>
                            <span className="change">
                              {item.from}/10 → {item.to}/10 (+
                              {item.improvement})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {comparison.improvements.weaknesses.length > 0 && (
                    <div className="improvement-section weaknesses">
                      <h4>⚠️ Áreas que Recuaram</h4>
                      <ul>
                        {comparison.improvements.weaknesses.map((item, idx) => (
                          <li key={idx}>
                            <span className="criterion">
                              {item.criterion}
                            </span>
                            <span className="change">
                              {item.from}/10 → {item.to}/10 (-
                              {item.decline})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {comparison.improvements.consistent.length > 0 && (
                    <div className="improvement-section consistent">
                      <h4>➡️ Áreas Consistentes</h4>
                      <ul>
                        {comparison.improvements.consistent.map((item, idx) => (
                          <li key={idx}>
                            <span className="criterion">
                              {item.criterion}
                            </span>
                            <span className="score">{item.score}/10</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {comparison.improvements.summary && (
                    <div className="comparison-meta">
                      <p>
                        <strong>Período:</strong>{" "}
                        {comparison.improvements.summary.date_range}
                      </p>
                      <p>
                        <strong>Total de Entrevistas:</strong>{" "}
                        {comparison.improvements.summary.total_interviews}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const OLHAR_LABELS = {
  camera: "Na câmera (atento)",
  baixo: "Para baixo",
  cima: "Para cima",
  lateral_esquerda: "Lateral esquerda",
  lateral_direita: "Lateral direita",
};

function formatOlhar(key) {
  if (!key) return "-";
  return OLHAR_LABELS[key] ?? key;
}

export function AnalysisPage({
  videoRef,
  overlayCanvasRef,
  captureCanvasRef,
  status,
  recordingState,
  startRecording,
  stopRecording,
  cancelRecording,
  transcript,
  interimTranscript,
  isListening,
  speechError,
  llmAnalysis,
  llmLoading,
  llmError,
  goToMenu,
  onLogout,
}) {
  const em = status.emocao;
  const sc = status.scores;
  const gz = status.gaze;

  return (
    <div className="analysis-view">
      <div className="analysis-header">
        <button
          className="btn btn-back"
          onClick={goToMenu}
        >
          ← Menu
        </button>
        <h1 className="title">Análise Facial em Tempo Real</h1>
      </div>

      <div className="analysis-content-wrapper">
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

        <div className="status recordingBox">
          <div className="recordingButtons">
            <button className="btn" onClick={startRecording} disabled={recordingState.isRecording}>
              ▶ Iniciar Entrevista
            </button>
            <button className="btn danger" onClick={stopRecording} disabled={!recordingState.isRecording}>
              ⏹ Encerrar
            </button>
            <button className="btn secondary" onClick={cancelRecording} disabled={!recordingState.isRecording}>
              ✕ Cancelar
            </button>
          </div>
        </div>

        <div className="status analysis-transcript">
          <div className="analysis-insights-title">
            🎤 Transcrição em Tempo Real {isListening && <span className="recording-indicator">● ao vivo</span>}
          </div>
          {transcript || interimTranscript ? (
            <div className="transcript-text">
              <span className="transcript-final">{transcript}</span>
              <span className="transcript-interim">{interimTranscript}</span>
            </div>
          ) : (
            <div className="analysis-muted">
              {recordingState.isRecording
                ? "Falando... o texto aparecerá aqui"
                : "Clique em 'Iniciar Entrevista' para começar"}
            </div>
          )}
        </div>

        {speechError && (
          <div className="status analysis-warning">
            <div className="analysis-insights-title">⚠️ Erro de Microfone</div>
            <div>{speechError}</div>
          </div>
        )}

        {(llmLoading || llmError || llmAnalysis) && (
          <div className="status analysis-llm">
            <div className="analysis-insights-title">📊 Análise da Entrevista</div>
            {llmLoading && <div className="analysis-muted">Analisando resposta...</div>}
            {llmError && !llmLoading && (
              <div className="analysis-warning" role="alert">
                {llmError}
              </div>
            )}
            {llmAnalysis && !llmLoading && (
              <div className="llm-result">
                {["coerencia", "dominio_assunto", "clareza_objetividade", "organizacao_ideias"].map((key) => {
                  const block = llmAnalysis[key];
                  if (!block || typeof block !== "object") return null;
                  const labels = {
                    coerencia: "Coerência",
                    dominio_assunto: "Domínio",
                    clareza_objetividade: "Clareza",
                    organizacao_ideias: "Organização",
                  };
                  return (
                    <div key={key} className="llm-criterion">
                      <div className="llm-criterion-head">
                        <strong>{labels[key]}</strong>
                        <span className="llm-nota">{block.nota != null ? Number(block.nota).toFixed(1) : "—"}/10</span>
                      </div>
                      {block.justificativa && (
                        <p className="llm-justificativa">{block.justificativa}</p>
                      )}
                    </div>
                  );
                })}
                {Array.isArray(llmAnalysis.sugestoes) && llmAnalysis.sugestoes.length > 0 && (
                  <div className="llm-sugestoes">
                    <strong>Sugestões</strong>
                    <ul>
                      {llmAnalysis.sugestoes.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
