import logging

from rest_framework import serializers

from .constants import SCHOOL_DESCRIPTION_MAPPING

log = logging.getLogger(__name__)


class ServiceSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='SERVICE_ID')
    name = serializers.CharField(source='SERVICE_NAME')
    detail = serializers.CharField(source='SERVICE_DETAIL')


class ProviderSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='FSD_ID')
    name = serializers.CharField(source='PROVIDER_NAME')
    description = serializers.CharField(source='ORGANISATION_PURPOSE')
    address = serializers.CharField(source='PHYSICAL_ADDRESS')
    latitude = serializers.FloatField(source='LATITUDE')
    longitude = serializers.FloatField(source='LONGITUDE')
    website = serializers.URLField(source='PROVIDER_WEBSITE_1')
    email = serializers.EmailField(source='PUBLISHED_CONTACT_EMAIL_1')
    phone = serializers.CharField(source='PUBLISHED_PHONE_1')
    contact_availability = serializers.CharField(source='PROVIDER_CONTACT_AVAILABILITY')

    services = ServiceSerializer(many=True)


class SchoolSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='School_Id')
    name = serializers.CharField(source='Org_Name')
    type = serializers.SerializerMethodField()
    description = serializers.CharField(source='Definition')
    address = serializers.SerializerMethodField()
    latitude = serializers.FloatField(source='Latitude')
    longitude = serializers.FloatField(source='Longitude')
    website = serializers.URLField(source='URL')
    email = serializers.EmailField(source='Email')
    phone = serializers.CharField(source='Telephone')
    total_enrolled = serializers.IntegerField(source='Total')

    def get_type(self, school):
        return SCHOOL_DESCRIPTION_MAPPING.get(school['Org_Type'])

    def get_address(self, school):
        # comma-separated, including only truthy components
        address = (school['Add1_Line1'], school['Add1_Suburb'], school['Add1_City'])
        return ', '.join(filter(None, address))


class EarlyEducationSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='ECE_Id')
    name = serializers.CharField(source='Org_Name')
    type = serializers.CharField(source='Org_Type')
    description = serializers.CharField(source='Definition')
    address = serializers.SerializerMethodField()
    latitude = serializers.FloatField(source='Latitude')
    longitude = serializers.FloatField(source='Longitude')
    email = serializers.EmailField(source='Email')
    phone = serializers.CharField(source='Telephone')
    total_enrolled = serializers.IntegerField(source='All_Children')
    subsidy_20_hrs = serializers.SerializerMethodField()

    def get_address(self, ece):
        # comma-separated, including only truthy components
        address = (ece['Add1_Line1'], ece['Add1_Suburb'], ece['Add1_City'])
        return ', '.join(filter(None, address))

    def get_subsidy_20_hrs(self, ece):
        value = ece['20_Hrs_ECE']
        return type(value) is str and value.lower() == 'yes'


class CategorySerializer(serializers.Serializer):
    id = serializers.SlugField(source='identifier')
    name = serializers.CharField()
    type = serializers.CharField(source='type.name')
