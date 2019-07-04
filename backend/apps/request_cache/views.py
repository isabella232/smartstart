# -*- coding: utf-8 -*-
from django.conf import settings
from django.views.decorators.cache import cache_page

import requests

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from apps.request_cache.models import RequestCache


CACHE_TTL_SECONDS = int(round(settings.REQUEST_CACHE_TTL.total_seconds()))


def ckan_result_response(name):
    result = RequestCache.objects.filter(name=name).first()
    if result:
        return Response(result.get_result())
    else:
        return Response({"error": "This endpoint is not configured."})


@api_view()
@permission_classes((AllowAny,))
def lbs_parenting_support(request):
    return ckan_result_response('lbs_parenting_support')


@api_view()
@permission_classes((AllowAny,))
def lbs_early_education(request):
    return ckan_result_response('lbs_early_education')


@api_view()
@permission_classes((AllowAny,))
def lbs_breastfeeding(request):
    return ckan_result_response('lbs_breastfeeding')


@api_view()
@permission_classes((AllowAny,))
def lbs_antenatal(request):
    return ckan_result_response('lbs_antenatal')


@api_view()
@permission_classes((AllowAny,))
def lbs_mental_health(request):
    return ckan_result_response('lbs_mental_health')


@api_view()
@permission_classes((AllowAny,))
def lbs_budgeting(request):
    return ckan_result_response('lbs_budgeting')


@api_view()
@permission_classes((AllowAny,))
def lbs_well_child(request):
    return ckan_result_response('lbs_well_child')


@cache_page(CACHE_TTL_SECONDS)
@api_view()
@permission_classes((AllowAny,))
def content_timeline(request):
    r = requests.get(settings.TIMELINE_URL, headers={'User-Agent': settings.TIMELINE_USER_AGENT})
    return Response(r.json())
