from django.conf.urls import url

from apps.timeline import views

urlpatterns = [
    url(r'^api/timeline/content/$', views.timeline_content, name='timeline_content'),
    url(r'^timeline/notification/(?P<id>\d+)/$', views.notification_detail, name='notification_detail'),
]
