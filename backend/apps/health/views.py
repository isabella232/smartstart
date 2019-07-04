from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from django.db import connection

import logging
log = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """
    A view to check the health of the application.
    Checks that the application is able to handle requests
    and can connect to the database.
    Returns a status code of 200 when all check pass and 503
    if any fail or encounter an exception.
    """

    DOWN_STATUS = status.HTTP_503_SERVICE_UNAVAILABLE
    UP_STATUS = status.HTTP_200_OK

    permission_classes = (AllowAny,)

    def get(self, request, format=None):
        try:
            if self._check_db():
                return Response(status=self.UP_STATUS)
        except Exception:
            log.exception('Health check failed with exception')

        return Response(status=self.DOWN_STATUS)

    def _check_db(self):

        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            row = cursor.fetchone()
            return row[0] == 1
