from flask import Flask
from config import config
from extensions import db

app = Flask(__name__)
app.config.from_object(config['development'])
db.init_app(app)

with app.app_context():
    try:
        db.create_all()
        print('create_all succeeded')
    except Exception as e:
        print('create_all failed:', repr(e))
        raise
