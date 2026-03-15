from sqlalchemy import create_engine
from config import config

cfg = config['development']
print('Using URI:', cfg.SQLALCHEMY_DATABASE_URI)
engine = create_engine(cfg.SQLALCHEMY_DATABASE_URI)
with engine.connect() as conn:
    print('connected, sqlite version:', conn.execute('select sqlite_version()').scalar())
