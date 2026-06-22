import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { API, fileToBase64, type Player, type Post } from '@/lib/api';

const Admin = () => {
  const [password, setPassword] = useState(localStorage.getItem('cube_admin_pw') || '');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [postForm, setPostForm] = useState({ title: '', body: '' });
  const [postImg, setPostImg] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', 'X-Admin-Password': password }),
    [password]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API.admin, { headers: headers() });
      if (res.status === 401) {
        setAuthed(false);
        localStorage.removeItem('cube_admin_pw');
        toast({ title: 'Неверный пароль', variant: 'destructive' });
        return;
      }
      const data = await res.json();
      setPlayers(data.players || []);
      setPosts(data.posts || []);
      setAuthed(true);
      localStorage.setItem('cube_admin_pw', password);
    } catch {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [headers, password]);

  useEffect(() => {
    if (password) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = async (id: number, status: string) => {
    await fetch(API.admin, { method: 'POST', headers: headers(), body: JSON.stringify({ action: 'set_status', id, status }) });
    toast({ title: status === 'approved' ? '✅ Подтверждено' : '❌ Отклонено' });
    load();
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.body.trim()) {
      toast({ title: 'Заполни заголовок и текст', variant: 'destructive' });
      return;
    }
    setPosting(true);
    try {
      let image_base64: string | undefined;
      if (postImg) image_base64 = await fileToBase64(postImg);
      const res = await fetch(API.admin, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ action: 'create_post', title: postForm.title, body: postForm.body, image_base64 }),
      });
      if (res.ok) {
        toast({ title: '📢 Пост опубликован!' });
        setPostForm({ title: '', body: '' });
        setPostImg(null);
        load();
      } else {
        toast({ title: 'Ошибка', variant: 'destructive' });
      }
    } finally {
      setPosting(false);
    }
  };

  const removePost = async (id: number) => {
    await fetch(API.admin, { method: 'POST', headers: headers(), body: JSON.stringify({ action: 'remove_post', id }) });
    toast({ title: 'Пост удалён' });
    load();
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center grid-bg p-4">
        <Card className="rounded-none bg-card border-border p-8 w-full max-w-sm box-glow-red">
          <div className="text-center mb-6">
            <Icon name="Shield" size={40} className="text-primary mx-auto mb-3" />
            <h1 className="font-pixel text-sm">АДМИН-ПАНЕЛЬ</h1>
            <p className="text-xs text-muted-foreground mt-2">Введите пароль организатора</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); load(); }} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="rounded-none bg-background border-border focus-visible:ring-primary"
            />
            <Button type="submit" disabled={loading} className="w-full font-pixel text-xs rounded-none h-12 bg-primary hover:bg-primary/90 box-glow-red">
              {loading ? 'ВХОД...' : 'ВОЙТИ'}
            </Button>
          </form>
          <Link to="/" className="block text-center text-xs text-muted-foreground mt-6 hover:text-foreground">← На главную</Link>
        </Card>
      </div>
    );
  }

  const pending = players.filter((p) => p.status === 'pending');
  const approved = players.filter((p) => p.status === 'approved');

  const PlayerRow = ({ p }: { p: Player }) => (
    <Card className="rounded-none bg-card border-border p-4 flex items-center gap-4">
      {p.skin_url ? (
        <img src={p.skin_url} alt={p.nick} className="w-12 h-12 object-cover pixel-shadow shrink-0" />
      ) : (
        <div className="w-12 h-12 flex items-center justify-center bg-muted font-pixel text-sm shrink-0">{p.nick[0]}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-bold truncate">{p.nick} <span className="text-xs text-muted-foreground font-normal">{p.real_name}</span></div>
        <div className="text-xs text-muted-foreground">{p.role} · {p.team_name || 'без команды'}</div>
        <div className="text-xs text-secondary truncate">{p.contact}</div>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        {p.status !== 'approved' && (
          <Button onClick={() => setStatus(p.id, 'approved')} className="h-8 rounded-none bg-green-600 hover:bg-green-700 text-xs px-3">
            <Icon name="Check" size={14} className="mr-1" /> Принять
          </Button>
        )}
        {p.status !== 'rejected' && (
          <Button onClick={() => setStatus(p.id, 'rejected')} variant="outline" className="h-8 rounded-none border-primary text-primary hover:bg-primary/10 text-xs px-3">
            <Icon name="X" size={14} className="mr-1" /> Отклонить
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border sticky top-0 bg-background/90 backdrop-blur z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="font-pixel text-sm flex items-center gap-2">
            <Icon name="Shield" size={18} className="text-primary" /> АДМИН CUBE CUP
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Сайт</Link>
            <Button onClick={() => { localStorage.removeItem('cube_admin_pw'); setAuthed(false); setPassword(''); }} variant="outline" className="rounded-none h-9 text-xs border-border">
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <Tabs defaultValue="pending">
          <TabsList className="rounded-none bg-card border border-border mb-6">
            <TabsTrigger value="pending" className="rounded-none font-pixel text-[10px]">ЗАЯВКИ ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved" className="rounded-none font-pixel text-[10px]">СОСТАВ ({approved.length})</TabsTrigger>
            <TabsTrigger value="posts" className="rounded-none font-pixel text-[10px]">ПОСТЫ</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">Новых заявок нет 🎉</p>
            ) : pending.map((p) => <PlayerRow key={p.id} p={p} />)}
          </TabsContent>

          <TabsContent value="approved" className="space-y-3">
            {approved.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">Подтверждённых игроков пока нет</p>
            ) : approved.map((p) => <PlayerRow key={p.id} p={p} />)}
          </TabsContent>

          <TabsContent value="posts">
            <Card className="rounded-none bg-card border-border p-6 mb-8 box-glow-blue">
              <h3 className="font-pixel text-xs mb-5">НОВЫЙ ПОСТ</h3>
              <form onSubmit={createPost} className="space-y-4">
                <Input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="Заголовок" className="rounded-none bg-background border-border" />
                <Textarea value={postForm.body} onChange={(e) => setPostForm({ ...postForm, body: e.target.value })} placeholder="Текст новости..." rows={4} className="rounded-none bg-background border-border" />
                <label className="flex items-center gap-3 border border-dashed border-border bg-background p-3 cursor-pointer hover:border-secondary">
                  <Icon name="Image" size={18} className="text-secondary" />
                  <span className="text-sm text-muted-foreground">{postImg ? postImg.name : 'Картинка (необязательно)'}</span>
                  <input type="file" accept="image/*" onChange={(e) => setPostImg(e.target.files?.[0] || null)} className="hidden" />
                </label>
                <Button type="submit" disabled={posting} className="font-pixel text-xs rounded-none h-12 bg-primary hover:bg-primary/90 box-glow-red">
                  {posting ? 'ПУБЛИКАЦИЯ...' : 'ОПУБЛИКОВАТЬ'}
                </Button>
              </form>
            </Card>

            <div className="space-y-3">
              {posts.map((p) => (
                <Card key={p.id} className="rounded-none bg-card border-border p-4 flex items-start gap-4">
                  {p.image_url && <img src={p.image_url} alt={p.title} className="w-16 h-16 object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{p.title}</div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.body}</p>
                  </div>
                  <Button onClick={() => removePost(p.id)} variant="outline" className="h-8 rounded-none border-primary text-primary hover:bg-primary/10 shrink-0">
                    <Icon name="Trash2" size={14} />
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
