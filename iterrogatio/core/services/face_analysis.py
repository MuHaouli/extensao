from __future__ import annotations

import cv2
import mediapipe as mp
import numpy as np


def _euclidean(p1: np.ndarray, p2: np.ndarray) -> float:
    return float(np.linalg.norm(p1 - p2))


def _eye_aspect_ratio(points_2d: dict[int, np.ndarray], eye_idx: list[int]) -> float:
    """
    EAR = (||p2-p6|| + ||p3-p5||) / (2*||p1-p4||)
    eye_idx must be [p1, p2, p3, p4, p5, p6] in that order.
    """
    p1, p2, p3, p4, p5, p6 = [points_2d[i] for i in eye_idx]
    vertical_1 = _euclidean(p2, p6)
    vertical_2 = _euclidean(p3, p5)
    horizontal = _euclidean(p1, p4)
    if horizontal == 0:
        return 0.0
    return (vertical_1 + vertical_2) / (2.0 * horizontal)


def _clip01(x: float) -> float:
    return float(np.clip(x, 0.0, 1.0))


def _clip_score(x: float) -> float:
    """Nota de 0 a 10 com uma casa decimal."""
    return round(float(np.clip(x, 0.0, 10.0)), 1)


def _landmark_xy(
    face,
    idx: int,
    w: int,
    h: int,
) -> np.ndarray:
    lm = face.landmark[idx]
    return np.array([lm.x * w, lm.y * h], dtype=np.float64)


def _gaze_iris_metrics(face, w: int, h: int) -> dict | None:
    """
    Usa íris refinadas (468 esquerda, 473 direita) + cantos das pálpebras.
    Retorna razões ~0.5 quando o olhar está alinhado à câmera.
    """
    n = len(face.landmark)
    if n < 478:
        return None

    # Íris (refine_landmarks=True)
    li = _landmark_xy(face, 468, w, h)
    ri = _landmark_xy(face, 473, w, h)

    # Olho esquerdo: canto externo 33, interno 133; vertical aprox. 159 (superior), 145 (inferior)
    le_o = _landmark_xy(face, 33, w, h)
    le_i = _landmark_xy(face, 133, w, h)
    le_t = _landmark_xy(face, 159, w, h)
    le_b = _landmark_xy(face, 145, w, h)

    # Olho direito: 362 interno, 263 externo; 386 sup, 374 inf
    re_i = _landmark_xy(face, 362, w, h)
    re_o = _landmark_xy(face, 263, w, h)
    re_t = _landmark_xy(face, 386, w, h)
    re_b = _landmark_xy(face, 374, w, h)

    def horiz_ratio_sym(iris: np.ndarray, a: np.ndarray, b: np.ndarray) -> float:
        hmin = min(a[0], b[0])
        hmax = max(a[0], b[0])
        span = hmax - hmin
        if span < 1e-3:
            return 0.5
        return float(_clip01((iris[0] - hmin) / span))

    def vert_ratio_sym(iris: np.ndarray, top: np.ndarray, bot: np.ndarray) -> float:
        vmin = min(top[1], bot[1])
        vmax = max(top[1], bot[1])
        span = vmax - vmin
        if span < 1e-3:
            return 0.5
        return float(_clip01((iris[1] - vmin) / span))

    h_l = horiz_ratio_sym(li, le_o, le_i)
    h_r = horiz_ratio_sym(ri, re_i, re_o)
    v_l = vert_ratio_sym(li, le_t, le_b)
    v_r = vert_ratio_sym(ri, re_t, re_b)

    avg_h = (h_l + h_r) / 2.0
    avg_v = (v_l + v_r) / 2.0

    # Classificação discreta do olhar (heurística HR / entrevista)
    if avg_v > 0.58:
        olhar = "baixo"
    elif avg_v < 0.38:
        olhar = "cima"
    elif avg_h < 0.34:
        olhar = "lateral_esquerda"
    elif avg_h > 0.66:
        olhar = "lateral_direita"
    else:
        olhar = "camera"

    return {
        "horizontal": round(avg_h, 3),
        "vertical": round(avg_v, 3),
        "olhar": olhar,
    }


def _attention_score_from_gaze(gaze: dict | None, olhos: str | None) -> float:
    """0–10: olhos abertos + íris centralizada (horizontal/vertical próximos de 0.5)."""
    if gaze is None or olhos == "fechados":
        return _clip_score(2.0 if olhos == "fechados" else 3.0)

    h = gaze["horizontal"]
    v = gaze["vertical"]
    # Penaliza desvio do centro ótimo (~0.5, ~0.45 levemente abaixo por bias típico de webcam)
    ideal_v = 0.46
    dev_h = abs(h - 0.5)
    dev_v = abs(v - ideal_v)
    # Quanto menor o desvio, maior a atenção
    raw = 10.0 - (dev_h * 22.0 + dev_v * 18.0)
    return _clip_score(raw)


def _postura_score_continuous(
    face_cx: float,
    face_cy: float,
    img_cx: float,
    img_cy: float,
    tol_x: float,
    tol_y: float,
) -> float:
    """0–10: quanto mais centrado, maior a nota."""
    if tol_x < 1e-6 or tol_y < 1e-6:
        return 5.0
    nx = abs(face_cx - img_cx) / tol_x
    ny = abs(face_cy - img_cy) / tol_y
    # Dentro da tolerância = 8–10; fora cai suavemente
    dist = max(nx, ny)
    if dist <= 1.0:
        return _clip_score(10.0 - dist * 1.5)
    return _clip_score(max(2.0, 8.5 - (dist - 1.0) * 3.0))


def _emotion_proxies_geometry(
    face,
    w: int,
    h: int,
    bbox_w: float,
    ear: float,
    gaze: dict | None,
) -> dict[str, float]:
    """
    Proxies 0–10 derivados só de geometria (sem CNN).
    Útil em tempo real; modelos ML (FER/DeepFace) podem substituir esta camada em relatórios.
    """
    def pt(i: int) -> np.ndarray:
        return _landmark_xy(face, i, w, h)

    # --- Felicidade: cantos da boca mais "altos" que o centro do sorriso (eixo Y imagem)
    y_61 = face.landmark[61].y
    y_291 = face.landmark[291].y
    y_13 = face.landmark[13].y
    corner_avg = (y_61 + y_291) / 2.0
    # Sorriso: cantos acima da linha do lábio superior → corner_avg < y_13
    smile_lift = float(y_13 - corner_avg)
    felicidade = _clip_score(5.0 + smile_lift * 120.0)

    # --- Tensão: sobrancelhas mais próximas (covinhas / franzir)
    brow_l = face.landmark[52].x
    brow_r = face.landmark[282].x
    brow_sep = abs(brow_r - brow_l) * w / (bbox_w + 1e-6)
    # Separação típica normalizada ~0.22–0.38; abaixo disso → mais tensão
    tensao = _clip_score(max(0.0, (0.34 - brow_sep) / 0.14 * 10.0))

    # --- Nervosismo: olhos semicerrados + leve assimetria boca
    ear_penalty = max(0.0, (0.28 - ear) / 0.28) * 6.0
    mouth_w = _euclidean(pt(61), pt(291))
    mouth_asym = abs(y_61 - y_291) * 500.0
    nerv_base = ear_penalty + min(4.0, mouth_asym)
    if gaze and gaze.get("olhar") not in ("camera",):
        nerv_base += 1.5
    nervosismo = _clip_score(nerv_base)

    # --- Confiança: olhar na câmera + olhos abertos + boca estável (não tensa demais)
    gaze_bonus = 3.0 if gaze and gaze.get("olhar") == "camera" else 0.0
    ear_bonus = min(4.0, ear * 12.0)
    tensao_penalty = min(3.0, tensao * 0.35)
    confianca = _clip_score(3.5 + gaze_bonus + ear_bonus - tensao_penalty)

    return {
        "nervosismo": nervosismo,
        "confianca": confianca,
        "felicidade": felicidade,
        "tensao": tensao,
    }


def _engajamento_score(
    atencao: float,
    postura: float,
    emocao: dict[str, float],
) -> float:
    """Combina atenção, postura e equilíbrio emocional (menos nervosismo/tensão)."""
    pos = (10.0 - emocao["nervosismo"]) * 0.15 + (10.0 - emocao["tensao"]) * 0.1
    raw = (
        atencao * 0.38
        + postura * 0.22
        + emocao["felicidade"] * 0.12
        + emocao["confianca"] * 0.13
        + pos
    )
    return _clip_score(raw)


def _empty_face_response() -> dict:
    return {
        "rosto_detectado": False,
        "bbox": None,
        "olhos": None,
        "postura": None,
        "ear": None,
        "gaze": None,
        "atencao": None,
        "emocao": None,
        "scores": None,
    }


class FaceAnalyzer:
    """
    Analyzer em tempo real (MediaPipe Face Mesh):
    - Rosto + bbox
    - Olhos abertos/fechados (EAR)
    - Postura (centro do rosto vs centro da imagem)
    - Olhar / atenção (íris refinada)
    - Proxies emocionais geométricos + scores agregados
    """

    LEFT_EYE = [33, 160, 158, 133, 153, 144]
    RIGHT_EYE = [362, 385, 387, 263, 373, 380]

    def __init__(
        self,
        ear_threshold: float = 0.21,
        center_tolerance_ratio: float = 0.18,
    ) -> None:
        self.ear_threshold = ear_threshold
        self.center_tolerance_ratio = center_tolerance_ratio
        if not hasattr(mp, "solutions") or not hasattr(mp.solutions, "face_mesh"):
            raise RuntimeError(
                "O pacote `mediapipe` instalado não expõe `mp.solutions.face_mesh`. "
                "Tente reinstalar uma versão com FaceMesh (ex: `mediapipe==0.10.14`)."
            )

        # static_image_mode=True: cada frame é independente (mais robusto com JPEG da webcam).
        # Confiança um pouco mais baixa ajuda em luz fraca / rostos parcialmente fora do quadro.
        self._mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.35,
            min_tracking_confidence=0.35,
        )

    def analyze_bgr(self, image_bgr: np.ndarray) -> dict:
        """
        Retorna dict compatível com o frontend legado + camadas novas:
        - gaze: { horizontal, vertical, olhar }
        - atencao: 0–10
        - emocao: { nervosismo, confianca, felicidade, tensao } (proxies geométricos)
        - scores: { atencao, postura, engajamento }
        """
        if image_bgr is None or image_bgr.size == 0:
            return _empty_face_response()

        h, w = image_bgr.shape[:2]
        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        result = self._mesh.process(rgb)

        if not result.multi_face_landmarks:
            return _empty_face_response()

        face = result.multi_face_landmarks[0]
        xs = np.array([lm.x for lm in face.landmark], dtype=np.float32)
        ys = np.array([lm.y for lm in face.landmark], dtype=np.float32)

        x_min = int(np.clip(xs.min() * w, 0, w - 1))
        x_max = int(np.clip(xs.max() * w, 0, w - 1))
        y_min = int(np.clip(ys.min() * h, 0, h - 1))
        y_max = int(np.clip(ys.max() * h, 0, h - 1))

        bbox = {
            "x": x_min,
            "y": y_min,
            "w": max(0, x_max - x_min),
            "h": max(0, y_max - y_min),
        }

        needed = set(self.LEFT_EYE + self.RIGHT_EYE)
        points_2d: dict[int, np.ndarray] = {}
        for idx in needed:
            points_2d[idx] = _landmark_xy(face, idx, w, h)

        left_ear = _eye_aspect_ratio(points_2d, self.LEFT_EYE)
        right_ear = _eye_aspect_ratio(points_2d, self.RIGHT_EYE)
        ear = float((left_ear + right_ear) / 2.0)
        olhos = "fechados" if ear < self.ear_threshold else "abertos"

        face_cx = x_min + bbox["w"] / 2.0
        face_cy = y_min + bbox["h"] / 2.0
        img_cx = w / 2.0
        img_cy = h / 2.0
        tol_x = w * self.center_tolerance_ratio
        tol_y = h * self.center_tolerance_ratio
        centralizado = (abs(face_cx - img_cx) <= tol_x) and (abs(face_cy - img_cy) <= tol_y)
        postura = "boa" if centralizado else "fora"

        gaze = _gaze_iris_metrics(face, w, h)
        atencao = _attention_score_from_gaze(gaze, olhos)
        postura_n = _postura_score_continuous(
            face_cx, face_cy, img_cx, img_cy, tol_x, tol_y
        )

        emocao = _emotion_proxies_geometry(
            face, w, h, float(bbox["w"]), ear, gaze
        )
        engajamento = _engajamento_score(atencao, postura_n, emocao)

        out: dict = {
            "rosto_detectado": True,
            "bbox": bbox,
            "olhos": olhos,
            "postura": postura,
            "ear": ear,
            "gaze": gaze,
            "atencao": atencao,
            "emocao": emocao,
            "scores": {
                "atencao": atencao,
                "postura": postura_n,
                "engajamento": engajamento,
            },
        }
        return out


def analisar_rosto(image_bgr: np.ndarray) -> dict:
    """Compatível com um import simples na view."""
    global _ANALYZER
    if _ANALYZER is None:
        _ANALYZER = FaceAnalyzer()
    return _ANALYZER.analyze_bgr(image_bgr)


_ANALYZER: FaceAnalyzer | None = None
