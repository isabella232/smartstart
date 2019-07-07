# GitLab will copy this to local.py to run tests.

DEBUG = True
FORCE_2FA = False
SITE_DOMAIN = '127.0.0.1:8000'
SITE_URL = 'http://{}'.format(SITE_DOMAIN)
BUNDLE_NAME = 'FAKE'

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    },
    'db': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache',
    }
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'test',
        'USER': 'test',
        'PASSWORD': 'test',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}
