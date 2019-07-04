# Copy this file to local.py and edit.

# Example development settings:

DEBUG = True

SITE_DOMAIN = '127.0.0.1:8000'
SITE_URL = 'http://{}'.format(SITE_DOMAIN)

BUNDLE_NAME = 'FAKE'  # FAKE, MTS, ITE-uat, ITE-testing, PRD

SECRET_KEY = 'a long, random and unique hash string'

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    },
    'db': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Add valid PostgreSQL database details here. Smartstart relies on the
# PostgreSQL JSON field type, and no longer works with SQLite.
# Refer to the Django DATABASES setting in the documentation:
#    https://docs.djangoproject.com/en/1.11/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mydatabase',
        'USER': 'mydatabaseuser',
        'PASSWORD': 'mypassword',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}
