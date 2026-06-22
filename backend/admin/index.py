import json
import os
import base64
import uuid
import psycopg2
import boto3


def handler(event: dict, context) -> dict:
    '''Админ API: проверка пароля, список всех заявок, подтверждение/отмена регистраций, создание и удаление постов. Защищён паролем через заголовок X-Admin-Password.'''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    headers = event.get('headers') or {}
    password = headers.get('X-Admin-Password') or headers.get('x-admin-password')
    admin_password = os.environ.get('ADMIN_PASSWORD', '')

    if not password or password != admin_password:
        return {'statusCode': 401, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Неверный пароль'})}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    if method == 'GET':
        # все заявки игроков
        cur.execute(
            'SELECT id, nick, real_name, contact, role, skin_url, team_name, status, created_at '
            'FROM players ORDER BY created_at DESC'
        )
        players = []
        for r in cur.fetchall():
            players.append({
                'id': r[0], 'nick': r[1], 'real_name': r[2], 'contact': r[3],
                'role': r[4], 'skin_url': r[5], 'team_name': r[6], 'status': r[7],
                'created_at': r[8].isoformat() if r[8] else None,
            })
        cur.execute('SELECT id, title, body, image_url, created_at FROM posts ORDER BY created_at DESC')
        posts = []
        for r in cur.fetchall():
            posts.append({
                'id': r[0], 'title': r[1], 'body': r[2], 'image_url': r[3],
                'created_at': r[4].isoformat() if r[4] else None,
            })
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'players': players, 'posts': posts})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action')

        if action == 'login':
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'success': True})}

        if action == 'set_status':
            player_id = body.get('id')
            status = body.get('status')
            if status not in ('approved', 'rejected', 'pending'):
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Неверный статус'})}
            cur.execute('UPDATE players SET status=%s WHERE id=%s', (status, player_id))
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'success': True})}

        if action == 'remove_player':
            player_id = body.get('id')
            cur.execute("UPDATE players SET status='rejected' WHERE id=%s", (player_id,))
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'success': True})}

        if action == 'create_post':
            title = (body.get('title') or '').strip()
            text = (body.get('body') or '').strip()
            image_base64 = body.get('image_base64')
            if not title or not text:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Заголовок и текст обязательны'})}
            image_url = None
            if image_base64:
                if ',' in image_base64:
                    image_base64 = image_base64.split(',', 1)[1]
                img_bytes = base64.b64decode(image_base64)
                key = f"posts/{uuid.uuid4().hex}.png"
                s3 = boto3.client(
                    's3', endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
                )
                s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/png')
                image_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute('INSERT INTO posts (title, body, image_url) VALUES (%s, %s, %s) RETURNING id',
                        (title, text, image_url))
            new_id = cur.fetchone()[0]
            cur.close(); conn.close()
            return {'statusCode': 201, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'success': True, 'id': new_id})}

        if action == 'remove_post':
            post_id = body.get('id')
            cur.execute('DELETE FROM posts WHERE id=%s', (post_id,))
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'success': True})}

        cur.close(); conn.close()
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Неизвестное действие'})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}