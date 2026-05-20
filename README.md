# Extensão Real — Análise Facial em Tempo Real (Webcam + LLM)

## Objetivo
Este projeto abre a webcam no **React** e faz análise facial em tempo real no **Django**, sem tirar prints por botão e sem salvar imagens.

Ao parar a entrevista, a transcrição captada no frontend é enviada ao backend para a **Groq** gerar avaliação de RH com notas e sugestões.

## O que foi implementado
- Stream contínuo: frontend captura frames do vídeo a cada ~100ms e envia ao backend.
- Detecção de rosto: MediaPipe FaceMesh.
- Bounding box: caixa em volta do rosto no canvas sobre o vídeo.
- Olhos abertos/fechados: cálculo de EAR (Eye Aspect Ratio).
- Postura simples: rosto centralizado => boa postura; fora => fora de posição.
- Transcrição em tempo real: Web Speech API no frontend.
- Análise por LLM ao parar: backend chama Groq e retorna notas/sugestões estruturadas.

## Tecnologias
- Frontend: React (Create React App)
- Backend: Django
- Visão computacional: OpenCV + MediaPipe
- Banco: PostgreSQL(Lembre de instalar ele para conseguir rodar o codigo, senao ira dar erro)
- LLM: Groq API

## Pré-requisitos
- Python 3.11+
- Node.js 18+ (ou 20+)
- PostgreSQL instalado e em execução
- Chave da Groq (API Key em https://console.groq.com/)

## Como rodar

### 1) Backend (Django)
No terminal (PowerShell):

```powershell
cd iterrogatio
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ..\requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend: `http://localhost:8000`

### 2) Frontend (React)
Em outro terminal:

```powershell
cd iterrogatio\frontend
npm install
npm start
```

Frontend: `http://localhost:3000`

### 3) LLM (Groq)
No arquivo `iterrogatio/.env`, adicione (sem aspas; a chave começa com `gsk_`):

```env
GROQ_API_KEY=gsk_sua_chave_aqui
GROQ_MODEL=llama-3.1-8b-instant
DB_NAME = yourDB
```

Depois, reinicie o backend para carregar as variáveis:

```powershell
cd iterrogatio
python manage.py runserver
```

## Fluxo de teste do LLM
1. Faça login na aplicação.
2. Vá para a tela de análise.
3. Clique em **Iniciar** e fale normalmente.
4. Clique em **Parar**.
5. O app envia:
   - métricas faciais para `POST /api/face/save/`
   - transcrição para `POST /api/interview/analyze-transcript/`
6. A seção **"Análise da entrevista (IA)"** deve aparecer com:
   - nota de coerência
   - nota de domínio do assunto
   - nota de clareza/objetividade
   - nota de organização das ideias
   - sugestões de melhoria

## Endpoints principais
- `POST /api/face/analyze/` (multipart/form-data, campo `frame`)
- `POST /api/face/save/` (JSON com tempos acumulados)
- `POST /api/interview/analyze-transcript/` (JSON com `transcript`)

## Prompt fixo usado na LLM
O backend envia sempre o prompt de RH definido em:
- `iterrogatio/core/services/interview_llm.py` (`RH_SYSTEM_PROMPT`)

Depois disso, envia a transcrição do usuário para análise.

## Erros comuns
- `GROQ_API_KEY não configurada`  
  -> Adicione `GROQ_API_KEY` no `.env` e reinicie o `runserver`.

- `Transcrição vazia`  
  -> Verifique permissão de microfone e se houve fala antes de clicar em parar.

- `401 Autenticação necessária`  
  -> Faça login antes de iniciar a entrevista.

- `401` / `Invalid API Key` (Groq)  
  -> Gere uma API Key nova em https://console.groq.com/ , cole o valor completo no `.env` (uma linha, sem espaço extra), salve e reinicie o `runserver`. Não use texto placeholder.

- `Falha na análise: ...`  
  -> Verifique conexão com internet e se o modelo em `GROQ_MODEL` existe na Groq.
