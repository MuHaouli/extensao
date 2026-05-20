from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth.forms import BaseUserCreationForm, UserCreationForm
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import (
    password_validators_help_text_html,
    validate_password,
)
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

# Letras/números (incl. acentos), espaços e @ . + - _ (hífen escapado para não virar intervalo).
_username_validator = RegexValidator(
    regex=r"^[\w .@_+\-]+$",
    message="Use apenas letras, números, espaços e os símbolos @ . + - _",
)


class UserRegisterForm(UserCreationForm):
    email = forms.EmailField(required=True, label='E-mail')

    error_messages = {
        **UserCreationForm.error_messages,
        'password_mismatch': 'As duas senhas não coincidem.',
    }

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
        widgets = {
            'username': forms.TextInput(attrs={'placeholder': 'Usuário'}),
            'email': forms.EmailInput(attrs={'placeholder': 'seu@email.com'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].validators = [_username_validator]
        self.fields['username'].label = 'Usuário'
        self.fields['password1'].label = 'Senha'
        self.fields['password1'].help_text = password_validators_help_text_html()
        self.fields['password2'].label = 'Confirmar senha'
        self.fields['password2'].help_text = 'Digite a mesma senha para conferir.'

    def clean_username(self):
        u = self.cleaned_data.get('username')
        if isinstance(u, str):
            u = u.strip()
            if not u:
                raise ValidationError('Informe um nome de usuário.')
            # Django User padrão não aceita espaços em username.
            # Permitimos digitar com espaço e normalizamos para "_".
            u = '_'.join(u.split())
            self.cleaned_data['username'] = u
        return super().clean_username()

    def _post_clean(self):
        # ModelForm atualiza a instância; regras de força da senha em "Senha", não só em "Confirmar".
        super(BaseUserCreationForm, self)._post_clean()
        password = self.cleaned_data.get('password2')
        if password:
            try:
                validate_password(password, self.instance)
            except ValidationError as error:
                self.add_error('password1', error)

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError('Este e-mail já está em uso.')
        return email


class UserLoginForm(forms.Form):
    login = forms.CharField(label='Usuário ou e-mail', max_length=254)
    password = forms.CharField(label='Senha', widget=forms.PasswordInput)
    remember_me = forms.BooleanField(label='Lembrar sessão', required=False)

    def clean(self):
        cleaned_data = super().clean()
        login_value = cleaned_data.get('login')
        password = cleaned_data.get('password')

        if login_value and password:
            user = None
            if '@' in login_value:
                try:
                    user_obj = User.objects.get(email__iexact=login_value)
                    user = authenticate(
                        username=user_obj.username,
                        password=password,
                    )
                except User.DoesNotExist:
                    user = None
            else:
                normalized_login = '_'.join(login_value.strip().split())
                user = authenticate(username=normalized_login, password=password)

            if user is None:
                raise ValidationError('Credenciais inválidas. Verifique usuário/e-mail e senha.')

            cleaned_data['user'] = user
        return cleaned_data
