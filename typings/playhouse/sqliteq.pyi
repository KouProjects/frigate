from typing import Any

from playhouse.sqlite_ext import SqliteExtDatabase

class SqliteQueueDatabase(SqliteExtDatabase):
    def __init__(self, *args: Any, **kwargs: Any) -> None: ...
