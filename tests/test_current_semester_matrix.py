import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'tests' / 'current_semester_matrix.db'
if DB.exists():
    DB.unlink()
os.environ['DATABASE_URL'] = f'sqlite:///{DB}'
os.environ['BOOTSTRAP_ADMIN_EMAIL'] = 'matrix.admin@example.test'
os.environ['BOOTSTRAP_ADMIN_PASSWORD'] = 'MatrixAdminPassword123!'
sys.path.insert(0, str(ROOT / 'apps' / 'api'))

from fastapi.testclient import TestClient
from app.db.seed import run as seed
from app.main import app

seed()
client = TestClient(app)
login = client.post('/auth/login', json={
    'email': 'matrix.admin@example.test',
    'password': 'MatrixAdminPassword123!',
})
assert login.status_code == 200, login.text
HEADERS = {'Authorization': f"Bearer {login.json()['access_token']}"}


def test_current_semester_matrix_requires_admin():
    assert client.get('/admin/current-semester/matrix').status_code == 401


def test_current_semester_matrix_covers_all_eight_semester_one_lessons():
    response = client.get('/admin/current-semester/matrix', headers=HEADERS)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data['semester'] == 1
    assert data['book_code'] == 'PS.G05.SCI.S1'
    assert data['package_code'] == 'PS-G05-SCI-S1-2026'
    assert data['lesson_count'] == 8
    assert data['released_count'] == 0
    assert data['completion_percent'] == 0.0

    titles = [row['lesson']['title'] for row in data['lessons']]
    assert titles == [
        'المجهر واكتشاف الخلية',
        'الخلية وأنواعها',
        'أنواع المواد وخصائصها',
        'طرائق فصل المواد',
        'التغيرات الفيزيائية والكيميائية',
        'الطاقة وأشكالها',
        'تحولات الطاقة',
        'الطاقة والبيئة',
    ]
    assert all(row['stage'] != 'RELEASED' for row in data['lessons'])
    assert all(row['latest_release_transaction'] is None for row in data['lessons'])
