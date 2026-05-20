"""
Análise de transcrição de entrevista via Groq (LLM).
"""
from __future__ import annotations

import json
import re
from typing import Any

from django.conf import settings


RH_SYSTEM_PROMPT = """Aja como um profissional de RH altamente experiente, com atuação em múltiplos setores e sólida vivência na condução e avaliação de entrevistas. Sua função é analisar criticamente as respostas do candidato, considerando não apenas o conteúdo, mas também a forma como as ideias são estruturadas, comunicadas e sustentadas ao longo da entrevista, além dos aspectos comportamentais observados durante a gravação.

Realize uma avaliação detalhada do desempenho do candidato, atribuindo notas (de 0 a 10) para os seguintes critérios:

Coerência das respostas

Domínio do assunto abordado

Clareza e objetividade na comunicação

Organização e estruturação das ideias

Manutenção de contato visual (baseado no tempo com olhos abertos/fechados)

Postura corporal (baseado no tempo com boa/má postura)

Sempre que possível, justifique brevemente as notas atribuídas com base em evidências observadas nas respostas e nos dados comportamentais.

Ao final, apresente sugestões práticas, específicas e construtivas, indicando pontos de melhoria e orientações claras para que o candidato possa evoluir e obter um melhor desempenho em futuras entrevistas."""

JSON_FORMAT_INSTRUCTION = """

Depois de concluir a análise, responda APENAS com um objeto JSON válido (sem texto antes ou depois, sem blocos markdown), exatamente neste formato:
{
  "coerencia": { "nota": <número de 0 a 10>, "justificativa": "<texto>" },
  "dominio_assunto": { "nota": <número de 0 a 10>, "justificativa": "<texto>" },
  "clareza_objetividade": { "nota": <número de 0 a 10>, "justificativa": "<texto>" },
  "organizacao_ideias": { "nota": <número de 0 a 10>, "justificativa": "<texto>" },
  "contato_visual": { "nota": <número de 0 a 10>, "justificativa": "<texto>" },
  "postura_corporal": { "nota": <número de 0 a 10>, "justificativa": "<texto>" },
  "sugestoes": [ "<sugestão 1>", "<sugestão 2>" ]
}

Use notas com no máximo uma casa decimal quando necessário."""


def _strip_code_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        t = "\n".join(lines)
    return t.strip()


def _parse_llm_json(content: str) -> dict[str, Any]:
    if not content or not content.strip():
        raise ValueError("Resposta vazia do LLM. Conteúdo não recebido.")
    
    raw = _strip_code_fence(content)
    
    if not raw or not raw.strip():
        raise ValueError(f"Resposta inválida após limpeza. Conteúdo original: {content[:100]}")
    
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        m = re.search(r"\{[\s\S]*\}", raw)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError as e2:
                raise ValueError(f"JSON inválido extraído: {e2}. Conteúdo: {m.group(0)[:200]}")
        raise ValueError(f"Nenhum JSON encontrado na resposta: {raw[:200]}")


def _normalize_result(content: str, model: str) -> dict[str, Any]:
    parsed = _parse_llm_json(content)
    return {
        "coerencia": parsed.get("coerencia"),
        "dominio_assunto": parsed.get("dominio_assunto"),
        "clareza_objetividade": parsed.get("clareza_objetividade"),
        "organizacao_ideias": parsed.get("organizacao_ideias"),
        "contato_visual": parsed.get("contato_visual"),
        "postura_corporal": parsed.get("postura_corporal"),
        "sugestoes": parsed.get("sugestoes") or [],
        "provider": "groq",
        "model": model,
        "raw_text": content,
    }


def analyze_transcript_with_llm(transcript: str, behavioral_data: dict[str, float]) -> dict[str, Any]:
    api_key = settings.GROQ_API_KEY
    
    print("DEBUG settings:", settings.GROQ_API_KEY)

    print("KEY EM USO:", api_key)

    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY não configurada. Defina no .env (pasta iterrogatio)."
        )
    if not api_key.startswith("gsk_"):
        raise RuntimeError(
            "GROQ_API_KEY inválida: a chave da Groq deve começar com gsk_. "
            "Gere uma API Key em https://console.groq.com/ e cole o valor completo, sem aspas."
        )

    from groq import Groq

    client = Groq(api_key=api_key)
    model = (getattr(settings, "GROQ_MODEL", "llama-3.1-8b-instant") or "").strip()
    system = RH_SYSTEM_PROMPT + JSON_FORMAT_INSTRUCTION

    user_content = f"""
Transcrição da entrevista:
{transcript}

Dados comportamentais da gravação:
- Tempo com olhos abertos: {behavioral_data['seconds_eyes_open']:.2f} segundos
- Tempo com olhos fechados: {behavioral_data['seconds_eyes_closed']:.2f} segundos
- Tempo com boa postura: {behavioral_data['seconds_posture_good']:.2f} segundos
- Tempo com má postura: {behavioral_data['seconds_posture_bad']:.2f} segundos
"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
        temperature=0.35,
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Resposta vazia do modelo. O LLM não retornou conteúdo.")
    
    try:
        return _normalize_result(content, model=model)
    except ValueError as e:
        raise RuntimeError(f"Erro ao processar resposta do LLM: {str(e)}")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Erro JSON: {str(e)}. Resposta: {content[:300]}")


REPORT_SYSTEM_PROMPT = """Você é um especialista em seleção e desenvolvimento de talentos em diferentes áreas profissionais. 
Sua tarefa é gerar um relatório executivo detalhado baseado na análise de uma entrevista, considerando os critérios de avaliação 
e adaptando as recomendações para a área profissional específica.

O relatório deve incluir:
1. Resumo da Avaliação - síntese dos pontos-chave observados
2. Pontos Fortes - relacionados à área profissional
3. Áreas de Melhoria - específicas da profissão
4. Alinhamento com a Área Profissional - análise do fit do candidato
5. Recomendações Finais - ações concretas para desenvolvimento
6. Parecer Final - recomendação clara (Recomendado, Recomendado com Ressalvas, Não Recomendado)

Mantenha um tom profissional, construtivo e objetivo. Use linguagem clara e evite jargões técnicos desnecessários."""


def generate_interview_report(
    interview_analysis: dict[str, Any],
    professional_area: str,
) -> dict[str, Any]:
    """Gera um relatório personalizado baseado na análise da entrevista e área profissional."""
    raw_key = getattr(settings, "GROQ_API_KEY", "") or ""
    api_key = raw_key.strip().strip('"').strip("'")

    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY não configurada. Defina no .env (pasta iterrogatio)."
        )
    if not api_key.startswith("gsk_"):
        raise RuntimeError("GROQ_API_KEY inválida.")

    from groq import Groq

    client = Groq(api_key=api_key)
    model = (getattr(settings, "GROQ_MODEL", "llama-3.1-8b-instant") or "").strip()

    analysis_summary = json.dumps(interview_analysis, ensure_ascii=False, indent=2)

    user_content = f"""
Baseado na seguinte análise de entrevista:

{analysis_summary}

Gere um relatório executivo para a área profissional: {professional_area}

O relatório deve ser estruturado, prático e fornecer insights que ajudem na tomada de decisão sobre o candidato para essa área específica.
"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": REPORT_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.35,
    )

    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Resposta vazia do modelo ao gerar relatório.")

    return {
        "report": content,
        "professional_area": professional_area,
        "provider": "groq",
        "model": model,
        "generated_at": str(__import__("datetime").datetime.now().isoformat()),
    }

