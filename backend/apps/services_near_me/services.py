from enum import Enum, auto
from abc import ABC, abstractmethod
from collections import OrderedDict
import logging

import requests
from requests.exceptions import HTTPError

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.cache import caches

from apps.services_near_me.constants import CKAN_FILTERS
from .exceptions import CKANException

log = logging.getLogger(__name__)

# data.govt.nz don't provide any guarantees around availability.
# Need to rely on cached API responses during outages.
# cache CKAN responses in the DB so they will survive long-term if necessary.
cache = caches['db']


class CKANDataSource(ABC):
    """
    Abstract base class for data sources looking up services in CKAN
    """

    def __init__(self, resource):
        self.resource = resource

    @abstractmethod
    def build_query(self, category_id):
        """
        Builds the SQL query that will be issued to CKAN

        :param category_id: id of the category to query for
        :returns: the SQL query
        """
        pass

    def query_services(self, category_id):
        """
        Sends a request to CKAN containing the output of the build_query() method

        :param category_id: id of the category to use in building the query
        :returns: the CKAN records resulting from the query
        """

        sql = self.build_query(category_id)

        try:
            log.debug("Making CKAN query: '%s'", sql)

            r = requests.post(settings.CKAN_QUERY_URL, files={'sql': (None, sql)})
            r.raise_for_status()

            json = r.json()
            results = json['result']['records']
            log.info('CKAN query returned %d results', len(results))

            return results

        except HTTPError as e:
            log.error('HTTP error on CKAN request: %s', e)
            self._log_ckan_error_from_response(r)
            raise CKANException from e

        except Exception as e:
            log.error('Error while attempting CKAN request: %s', e)
            raise CKANException from e

    def _log_ckan_error_from_response(self, response):
        try:
            json = response.json()
            if 'error' in json:
                log.error('Error from CKAN response body: "%s"', json['error'])
        except ValueError:
            return


class FamilyServicesDataSource(CKANDataSource):

    def build_query(self, category_id):

        filter_expr = CKAN_FILTERS[category_id]

        # Using SELECT DISTINCT (and not trying to return category data) means that
        # duplicate entries (across returned values) will be dropped.
        sql_template = """
            SELECT DISTINCT "FSD_ID", "PROVIDER_NAME", "ORGANISATION_PURPOSE",
                   "SERVICE_ID", "SERVICE_NAME", "SERVICE_DETAIL",
                   "PHYSICAL_ADDRESS", "LATITUDE", "LONGITUDE", "PROVIDER_WEBSITE_1",
                   "PUBLISHED_CONTACT_EMAIL_1", "PUBLISHED_PHONE_1", "PROVIDER_CONTACT_AVAILABILITY"
              FROM "{resource}"
             WHERE "LATITUDE" IS NOT NULL
               AND "LONGITUDE" IS NOT NULL
               AND "LATITUDE" != '0'
               AND "LONGITUDE" != '0'
               AND ( {filter} )
          ORDER BY "LONGITUDE", "FSD_ID"
        """

        return sql_template.format(resource=self.resource, filter=filter_expr)


class SchoolsDataSource(CKANDataSource):

    def build_query(self, category_id):

        sql_template = """
            SELECT "School_Id", "Org_Name", "Org_Type", "Definition", "Total",
                   "Add1_Line1", "Add1_Suburb", "Add1_City",
                   "Latitude", "Longitude",
                   "URL", "Telephone", "Email"
              FROM "{resource}"
             WHERE "Org_Type" IN ('Composite', 'Composite (Year 1-10)', 'Contributing',
                                  'Correspondence School', 'Full Primary', 'Special School')
               AND "Latitude" IS NOT NULL
               AND "Longitude" IS NOT NULL
        """

        return sql_template.format(resource=self.resource)


class EarlyEducationDataSource(CKANDataSource):

    def build_query(self, category_id):

        sql_template = """
            SELECT "ECE_Id", "Org_Name", "Org_Type", "Definition", "All_Children",
                   "Add1_Line1", "Add1_Suburb", "Add1_City",
                   "Latitude", "Longitude",
                   "Telephone", "Email", "20_Hrs_ECE"
              FROM "{resource}"
             WHERE "Latitude" IS NOT NULL
               AND "Longitude" IS NOT NULL
        """

        return sql_template.format(resource=self.resource)


class CategoryType(Enum):
    FAMILY_SERVICES = auto()
    SCHOOLS = auto()
    EARLY_EDUCATION = auto()


class ServiceCategory:
    def __init__(self, identifier, name, category_type, data_source):
        self.identifier = identifier
        self.name = name
        self.type = category_type
        self.data_source = data_source


class ServiceLookupManager:
    """
    Performs service lookups from multiple sources
    """

    def __init__(self):
        log.debug('Initialising ServiceLookupManager')

        fs_datasource = FamilyServicesDataSource(settings.FAMILY_SERVICES_RESOURCE)
        schools_datasource = SchoolsDataSource(settings.SCHOOLS_RESOURCE)
        ece_datasource = EarlyEducationDataSource(settings.EARLY_EDUCATION_RESOURCE)

        category_list = [
            ServiceCategory('parenting-support', 'Parenting support',
                            CategoryType.FAMILY_SERVICES, fs_datasource),
            ServiceCategory('early-education', 'Early learning and Kohanga Reo',
                            CategoryType.EARLY_EDUCATION, ece_datasource),
            ServiceCategory('breastfeeding', 'Breastfeeding support',
                            CategoryType.FAMILY_SERVICES, fs_datasource),
            ServiceCategory('antenatal', 'Antenatal classes',
                            CategoryType.FAMILY_SERVICES, fs_datasource),
            ServiceCategory('mental-health', 'Anxiety and depression support',
                            CategoryType.FAMILY_SERVICES, fs_datasource),
            ServiceCategory('budgeting', 'Budgeting and financial help',
                            CategoryType.FAMILY_SERVICES, fs_datasource),
            ServiceCategory('well-child', 'Well Child/Tamariki Ora providers',
                            CategoryType.FAMILY_SERVICES, fs_datasource),
            ServiceCategory('primary-schools', 'Primary schools',
                            CategoryType.SCHOOLS, schools_datasource),
        ]

        self._service_categories = OrderedDict((c.identifier, c) for c in category_list)

    @property
    def service_categories(self):
        return self._service_categories.values()

    @property
    def service_category_names(self):
        return self._service_categories.keys()

    def get_for_category(self, category_id):
        """
        Fetches all services for the given category.
        Results are cached to provide some resiliency for unreliable data sources

        :param category_id:
        """

        if category_id not in self._service_categories:
            raise ObjectDoesNotExist()

        category = self._service_categories[category_id]

        try:
            results = category.data_source.query_services(category_id)

        except CKANException as e:
            # failed to fetch from CKAN. Attempt to use cached results instead
            cached_results = cache.get(category_id)
            if cached_results:
                log.warn('Failed to fetch results from CKAN. Returning cached results')
                return cached_results
            else:
                # let view handle the exeption
                raise e

        # cache good results indefinitely
        cache.set(category_id, results, None)

        return results
