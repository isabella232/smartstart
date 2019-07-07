from django.conf.urls import url

from apps.services_near_me import views


urlpatterns = [
    url(r'^service-locations/categories/$',
        views.CategoryList.as_view(), name='categories'),
    url(r'^service-locations/primary-schools/$',
        views.PrimarySchoolList.as_view(), name='primary_schools'),
    url(r'^service-locations/early-education/$',
        views.EarlyEducationSchoolList.as_view(), name='early_education'),
    url(r'^service-locations/(?P<category>[a-z-]+)/$',
        views.FamilyServiceList.as_view(), name='service_locations'),
]
