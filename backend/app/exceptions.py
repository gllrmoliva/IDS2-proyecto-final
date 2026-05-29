class DomainException(Exception):
    """Clase base para excepciones del dominio."""
    pass

class EntityNotFoundError(DomainException):
    pass

class BusinessLogicError(DomainException):
    pass
