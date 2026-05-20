"""
Validadores de senha com mensagens curtas em português (projeto Interrogatio).
"""
from __future__ import annotations

import re

from django.contrib.auth.password_validation import (
    CommonPasswordValidator,
    MinimumLengthValidator,
    NumericPasswordValidator,
    UserAttributeSimilarityValidator,
)
from django.core.exceptions import ValidationError


class MinimumLengthValidatorPT(MinimumLengthValidator):
    """Pelo menos N caracteres."""

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                f"A senha deve ter pelo menos {self.min_length} caracteres.",
                code="password_too_short",
            )

    def get_help_text(self):
        return f"Pelo menos {self.min_length} caracteres."


class ContainsDigitValidator:
    """Pelo menos um dígito."""

    def validate(self, password, user=None):
        if not re.search(r"\d", password):
            raise ValidationError(
                "Inclua pelo menos um número (0 a 9).",
                code="password_no_digit",
            )

    def get_help_text(self):
        return "Pelo menos um número."


_SPECIAL_RE = re.compile(r"[!@#$%^&*()_+\-=\[\]{}|\\;:,./<>?~`]+")


class ContainsSpecialCharacterValidator:
    """Pelo menos um símbolo (não basta letras e números)."""

    def validate(self, password, user=None):
        if not _SPECIAL_RE.search(password):
            raise ValidationError(
                "Inclua pelo menos um caractere especial (ex.: ! @ # * ? -).",
                code="password_no_special",
            )

    def get_help_text(self):
        return "Pelo menos um símbolo como ! @ # *"


class UserAttributeSimilarityValidatorPT(UserAttributeSimilarityValidator):
    def validate(self, password, user=None):
        try:
            super().validate(password, user)
        except ValidationError:
            raise ValidationError(
                "A senha é parecida demais com o seu nome de usuário ou e-mail.",
                code="password_too_similar",
            ) from None

    def get_help_text(self):
        return "Não use dados pessoais óbvios na senha."


class CommonPasswordValidatorPT(CommonPasswordValidator):
    def validate(self, password, user=None):
        try:
            super().validate(password, user)
        except ValidationError:
            raise ValidationError(
                "Esta senha é muito comum. Escolha outra.",
                code="password_too_common",
            ) from None

    def get_help_text(self):
        return "Evite senhas muito usadas (listas públicas)."


class NumericPasswordValidatorPT(NumericPasswordValidator):
    def validate(self, password, user=None):
        try:
            super().validate(password, user)
        except ValidationError:
            raise ValidationError(
                "A senha não pode ser só números (misture letras e símbolos).",
                code="password_entirely_numeric",
            ) from None

    def get_help_text(self):
        return "Não use apenas números."
