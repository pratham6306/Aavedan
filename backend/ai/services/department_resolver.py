# ai/services/department_resolver.py
from knowledge.models import ComplaintType

class DepartmentResolver:
    """
    Lightweight service to resolve the official government department for a given complaint type.
    """
    def resolve(self, complaint_type_name: str) -> str:
        if not complaint_type_name:
            return None
            
        try:
            ct = ComplaintType.objects.get(name=complaint_type_name)
            return ct.department.name
        except ComplaintType.DoesNotExist:
            return None
