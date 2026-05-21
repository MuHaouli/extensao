"""
Django settings for iterrogatio project.
"""

from pathlib import Path

from decouple import Config, Csv, RepositoryEmpty, RepositoryEnv
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

ENV_PATH = BASE_DIR / '.env'
if not ENV_PATH.exists():
    ENV_PATH = BASE_DIR.parent / '.env'
if not ENV_PATH.exists():
    ENV_PATH = BASE_DIR.parent.parent / '.env'

config = (
    Config(RepositoryEnv(str(ENV_PATH)))
    if ENV_PATH.exists()
    else Config(RepositoryEmpty())
)

# SECURITY
SECRET_KEY = config(
    'SECRET_KEY',
    default='django-insecure-d9wq(5p19f^tyt9e=whmzu4ah@9y^_&tn*5bqwic-ell6e)wm0',
)

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1,.railway.app',
    cast=Csv(),
)

# APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'corsheaders',

    'core',
    'usuarios',
]

# MIDDLEWARE
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'iterrogatio.urls'

# TEMPLATES
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
            BASE_DIR / 'frontend/build',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'iterrogatio.wsgi.application'

# DATABASE
DB_NAME = config('DB_NAME', default=None)
DB_USER = config('DB_USER', default='postgres')
DB_PASSWORD = config('DB_PASSWORD', default='')
DB_HOST = config('DB_HOST', default='localhost')
DB_PORT = config('DB_PORT', default=5432, cast=int)
DB_CONNECT_TIMEOUT = config('DB_CONNECT_TIMEOUT', default=10, cast=int)
CONN_MAX_AGE = config('CONN_MAX_AGE', default=600, cast=int)

if not DB_NAME:
    raise ImproperlyConfigured(
        'DB_NAME environment variable is required.'
    )

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
        'CONN_MAX_AGE': CONN_MAX_AGE,
        'OPTIONS': {
            'connect_timeout': DB_CONNECT_TIMEOUT,
        },
    }
}

# PASSWORD VALIDATION
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'usuarios.password_validators.MinimumLengthValidatorPT',
        'OPTIONS': {'min_length': 8},
    },
    {'NAME': 'usuarios.password_validators.ContainsDigitValidator'},
    {'NAME': 'usuarios.password_validators.ContainsSpecialCharacterValidator'},
    {'NAME': 'usuarios.password_validators.UserAttributeSimilarityValidatorPT'},
    {'NAME': 'usuarios.password_validators.CommonPasswordValidatorPT'},
    {'NAME': 'usuarios.password_validators.NumericPasswordValidatorPT'},
]

# INTERNATIONALIZATION
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# STATIC FILES
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = [
    BASE_DIR / 'frontend/build/static',
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# DEFAULT PK
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# AUTH
LOGIN_URL = 'login_api'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# CORS / CSRF
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://extensao-interrogatio.up.railway.app',
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'https://extensao-interrogatio.up.railway.app',
]

CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_HTTPONLY = True

CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# GROQ
GROQ_API_KEY = config('GROQ_API_KEY', default='')
GROQ_MODEL = config('GROQ_MODEL', default='llama-3.1-8b-instant')

# LOGGING
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
