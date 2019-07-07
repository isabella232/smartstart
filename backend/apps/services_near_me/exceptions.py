from rest_framework.exceptions import APIException


class CKANException(APIException):
    status_code = 502
    default_detail = 'Unable to contact remote service.'
    default_code = 'bad_gateway'
