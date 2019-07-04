# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-09-01 22:24
from __future__ import unicode_literals

import annoying.fields
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('accounts', '0002_profile_attrs'),
    ]

    operations = [
        migrations.CreateModel(
            name='Preference',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('group', models.CharField(default='settings', max_length=50)),
                ('key', models.SlugField()),
                ('val', annoying.fields.JSONField(blank=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='preference',
            unique_together=set([('user', 'group', 'key')]),
        ),
    ]