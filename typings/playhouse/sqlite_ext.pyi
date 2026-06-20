from typing import Any

from peewee import SqliteDatabase, TextField

class SqliteExtDatabase(SqliteDatabase):
    def __init__(self, database: str, *args: Any, **kwargs: Any) -> None: ...

class JSONField(TextField):
    def __init__(self, *args: Any, **kwargs: Any) -> None: ...
