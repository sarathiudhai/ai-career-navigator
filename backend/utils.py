"""Shared utility functions for backend routers."""

from bson import ObjectId
from datetime import datetime


def fix_object_id(data):
    """Recursively convert MongoDB ObjectId and datetime values to JSON-serializable types."""
    if isinstance(data, list):
        return [fix_object_id(item) for item in data]
    elif isinstance(data, dict):
        return {k: fix_object_id(v) for k, v in data.items()}
    elif isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, datetime):
        return data.isoformat()
    return data
