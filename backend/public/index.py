import json
import os
import base64
import uuid
import psycopg2
import boto3


def handler(event: dict, context) -> dict:
    '''Публичный API: список команд с игроками, лента постов, регистрация игрока.
    При регистрации игрок может создать новую команду (action=create_team) или вступить в существующую (action=join_team).
    Лимиты: 18 команд всего, 6 одобренных игроков в команде.'''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    def err(code, msg):
        cur.close(); conn.close()
        return {'statusCode': code, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': msg})}

    def ok(data, code=200):
        cur.close(); conn.close()
        return {'statusCode': code, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps(data)}

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        resource = params.get('resource', 'all')
        result = {}

        if resource in ('all', 'teams'):
            cur.execute('SELECT id, name, color, captain, created_by_nick FROM teams ORDER BY id')
            teams = []
            for r in cur.fetchall():
                teams.append({'id': r[0], 'name': r[1], 'color': r[2], 'captain': r[3], 'created_by_nick': r[4]})
            # кол-во одобренных + все pending игроки в команде
            cur.execute("SELECT team_id, COUNT(*) FROM players WHERE status='approved' AND team_id IS NOT NULL GROUP BY team_id")
            approved_counts = {row[0]: row[1] for row in cur.fetchall()}
            cur.execute("SELECT team_id, COUNT(*) FROM players WHERE team_id IS NOT NULL GROUP BY team_id")
            all_counts = {row[0]: row[1] for row in cur.fetchall()}
            for t in teams:
                t['approved_count'] = approved_counts.get(t['id'], 0)
                t['total_count'] = all_counts.get(t['id'], 0)
            result['teams'] = teams

        if resource in ('all', 'players'):
            cur.execute(
                "SELECT p.id, p.nick, p.real_name, p.role, p.skin_url, p.team_name, p.team_id, t.color "
                "FROM players p LEFT JOIN teams t ON p.team_id = t.id "
                "WHERE p.status='approved' ORDER BY p.created_at DESC"
            )
            players = []
            for r in cur.fetchall():
                players.append({
                    'id': r[0], 'nick': r[1], 'real_name': r[2],
                    'role': r[3], 'skin_url': r[4], 'team_name': r[5],
                    'team_id': r[6], 'team_color': r[7],
                })
            result['players'] = players

        if resource in ('all', 'posts'):
            cur.execute('SELECT id, title, body, image_url, created_at FROM posts ORDER BY created_at DESC LIMIT 30')
            posts = []
            for r in cur.fetchall():
                posts.append({
                    'id': r[0], 'title': r[1], 'body': r[2],
                    'image_url': r[3], 'created_at': r[4].isoformat() if r[4] else None,
                })
            result['posts'] = posts

        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(result)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'register')

        # --- Очистка сид-команд (без созданного игрока) ---
        if action == 'cleanup_seed':
            cur.execute("DELETE FROM teams WHERE created_by_nick IS NULL")
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True})}

        nick = (body.get('nick') or '').strip()
        contact = (body.get('contact') or '').strip()
        real_name = (body.get('real_name') or '').strip()
        role = (body.get('role') or 'Игрок').strip()
        photo_base64 = body.get('photo_base64')

        if not nick or not contact:
            return err(400, 'Ник и контакт обязательны')

        # Загрузка фото скина
        skin_url = None
        if photo_base64:
            if ',' in photo_base64:
                photo_base64 = photo_base64.split(',', 1)[1]
            img_bytes = base64.b64decode(photo_base64)
            key = f"skins/{uuid.uuid4().hex}.png"
            s3 = boto3.client(
                's3', endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/png')
            skin_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        team_id = None
        team_name = ''

        if action == 'create_team':
            # Создаём новую команду, игрок — капитан
            new_team_name = (body.get('team_name') or '').strip()
            team_color = (body.get('team_color') or 'red').strip()
            if not new_team_name:
                return err(400, 'Введи название команды')
            if team_color not in ('red', 'blue'):
                team_color = 'red'
            # Лимит: 18 команд
            cur.execute('SELECT COUNT(*) FROM teams')
            if cur.fetchone()[0] >= 18:
                return err(409, 'Достигнут лимит команд (18). Вступи в существующую.')
            # Уникальность имени
            cur.execute('SELECT id FROM teams WHERE LOWER(name)=LOWER(%s)', (new_team_name,))
            if cur.fetchone():
                return err(409, 'Команда с таким именем уже существует')
            # Создаём команду
            cur.execute(
                "INSERT INTO teams (name, color, captain, created_by_nick) VALUES (%s, %s, %s, %s) RETURNING id",
                (new_team_name, team_color, nick, nick)
            )
            team_id = cur.fetchone()[0]
            team_name = new_team_name

        elif action == 'join_team':
            team_id = body.get('team_id')
            if not team_id:
                return err(400, 'Выбери команду')
            cur.execute('SELECT name FROM teams WHERE id=%s', (team_id,))
            row = cur.fetchone()
            if not row:
                return err(404, 'Команда не найдена')
            team_name = row[0]
            # Проверка лимита: 6 одобренных
            cur.execute("SELECT COUNT(*) FROM players WHERE team_id=%s AND status='approved'", (team_id,))
            if cur.fetchone()[0] >= 6:
                return err(409, 'В этой команде уже 6 игроков')

        else:
            return err(400, 'Неизвестный action')

        cur.execute(
            "INSERT INTO players (nick, real_name, contact, role, skin_url, team_id, team_name, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending') RETURNING id",
            (nick, real_name, contact, role, skin_url, team_id, team_name)
        )
        new_id = cur.fetchone()[0]
        return ok({'success': True, 'id': new_id, 'team_id': team_id, 'team_name': team_name}, 201)

    cur.close(); conn.close()
    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
