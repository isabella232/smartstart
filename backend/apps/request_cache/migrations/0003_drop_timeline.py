# -*- coding: utf-8 -*-
from django.db import models, migrations


def drop_timeline(apps, schema_editor):
    RequestCache = apps.get_model('request_cache', 'RequestCache')

    RequestCache.objects.filter(name='content_timeline').delete()

def restore_timeline(apps, schema_editor):
    RequestCache = apps.get_model('request_cache', 'RequestCache')

    (r, created) = RequestCache.objects.get_or_create(name='content_timeline')
    if created:
        r.result = {}
        r.save()


class Migration(migrations.Migration):

    dependencies = [
        ('request_cache', '0002_initial_empty_results'),
    ]

    operations = [
        migrations.RunPython(
            drop_timeline,
            reverse_code=restore_timeline),
    ]
