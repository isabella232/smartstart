from operator import itemgetter
from itertools import groupby
import logging

from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import NotFound

from django.conf import settings

from .services import ServiceLookupManager
from . import serializers
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

log = logging.getLogger(__name__)


service_manager = ServiceLookupManager()


@method_decorator(cache_page(settings.CACHE_TTL_SECONDS), 'list')
class CategoryList(generics.ListAPIView):
    """
    All the categories that the /service-locations/<category-id>/ resource can be queried by
    """
    serializer_class = serializers.CategorySerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return service_manager.service_categories


@method_decorator(cache_page(settings.CACHE_TTL_SECONDS), 'list')
class FamilyServiceList(generics.ListAPIView):
    """
    Fetches all services of the category provided in the URL param
    """
    serializer_class = serializers.ProviderSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        category = self.kwargs['category']

        if category not in service_manager.service_category_names:
            raise NotFound("Unknown category '{}'".format(category))

        records = service_manager.get_for_category(category)

        # There can be multiple services for the same provider. Group these together into
        # a single provider object.

        providers = []
        sortkeyfn = itemgetter('FSD_ID')
        records = sorted(records, key=sortkeyfn)

        for _, group in groupby(records, key=sortkeyfn):
            provider_group = list(group)  # all the records for the same provider
            # use the first record to produce the provider object
            provider = provider_group[0]

            # sort services by name
            service_sortkeyfn = itemgetter('SERVICE_NAME')

            # put the whole record in 'services' for now. Let the serializer restrict
            # to just the service fields
            provider['services'] = sorted(provider_group, key=service_sortkeyfn)
            providers.append(provider)

        return providers


@method_decorator(cache_page(settings.CACHE_TTL_SECONDS), 'list')
class PrimarySchoolList(generics.ListAPIView):
    """
    Fetches all primary school services
    """
    serializer_class = serializers.SchoolSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return service_manager.get_for_category('primary-schools')


@method_decorator(cache_page(settings.CACHE_TTL_SECONDS), 'list')
class EarlyEducationSchoolList(generics.ListAPIView):
    """
    Fetches all early education services
    """
    serializer_class = serializers.EarlyEducationSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return service_manager.get_for_category('early-education')
