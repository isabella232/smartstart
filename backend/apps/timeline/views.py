import requests

from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.serializers import HyperlinkedModelSerializer
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from apps.base.permissions import ReadOnly
from apps.timeline.models import PhaseMetadata, Notification


@cache_page(settings.CACHE_TTL_SECONDS)
@api_view()
@permission_classes((AllowAny,))
def timeline_content(request):
    r = requests.get(settings.TIMELINE_URL, headers={'User-Agent': settings.TIMELINE_USER_AGENT})
    return Response(r.json())


# Serializers define the API representation.
class PhaseMetadataSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = PhaseMetadata
        fields = ('id', 'weeks_start', 'weeks_finish')


@method_decorator(ensure_csrf_cookie, name='dispatch')
class PhaseMetadataViewSet(ReadOnlyModelViewSet):
    queryset = PhaseMetadata.objects.all()
    serializer_class = PhaseMetadataSerializer
    permission_classes = [ReadOnly]


def notification_detail(request, id):
    obj = get_object_or_404(Notification, id=id)
    return HttpResponse(obj.render_email_template())
