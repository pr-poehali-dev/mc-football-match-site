import json
import os
import base64
import uuid
import psycopg2
import boto3


def handler(event: dict, context) -> dict:
    '''Публичный API: список команд, одобренные игроки, лента постов и регистрация игрока с загрузкой фото скина.'''
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

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        resource = params.get('resource', 'all')

        result = {}

        if resource in ('all', 'teams'):
            cur.execute('SELECT id, name, color, captain FROM teams ORDER BY id')
            teams = []
            for r in cur.fetchall():
                teams.append({'id': r[0], 'name': r[1], 'color': r[2], 'captain': r[3]})
            # подсчёт одобренных игроков в команде
            cur.execute("SELECT team_id, COUNT(*) FROM players WHERE status='approved' AND team_id IS NOT NULL GROUP BY team_id")
            counts = {row[0]: row[1] for row in cur.fetchall()}
            for t in teams:
                t['players_count'] = counts.get(t['id'], 0)
            result['teams'] = teams

        if resource in ('all', 'players'):
            cur.execute(
                "SELECT id, nick, real_name, role, skin_url, team_name FROM players WHERE status='approved' ORDER BY created_at DESC"
            )
            players = []
            for r in cur.fetchall():
                players.append({
                    'id': r[0], 'nick': r[1], 'real_name': r[2],
                    'role': r[3], 'skin_url': r[4], 'team_name': r[5],
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

        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps(result)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        nick = (body.get('nick') or '').strip()
        contact = (body.get('contact') or '').strip()
        real_name = (body.get('real_name') or '').strip()
        role = (body.get('role') or 'Игрок').strip()
        team_id = body.get('team_id')
        team_name = (body.get('team_name') or '').strip()
        photo_base64 = body.get('photo_base64')

        if not nick or not contact:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Ник и контакт обязательны'})}

        # проверка: в команде максимум 6 одобренных игроков
        if team_id:
            cur.execute("SELECT COUNT(*) FROM players WHERE team_id=%s AND status='approved'", (team_id,))
            if cur.fetchone()[0] >= 6:
                cur.close()
                conn.close()
                return {'statusCode': 409, 'headers': {**cors, 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'В этой команде уже 6 игроков'})}

        skin_url = None
        if photo_base64:
            if ',' in photo_base64:
                photo_base64 = photo_base64.split(',', 1)[1]
            img_bytes = base64.b64decode(photo_base64)
            key = f"skins/{uuid.uuid4().hex}.png"
            s3 = boto3.client(
                's3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/png')
            skin_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        cur.execute(
            "INSERT INTO players (nick, real_name, contact, role, skin_url, team_id, team_name, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending') RETURNING id",
            (nick, real_name, contact, role, skin_url, team_id, team_name)
        )
        new_id = cur.fetchone()[0]
        cur.close()
        conn.close()
        return {'statusCode': 201, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True, 'id': new_id})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
