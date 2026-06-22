import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from '@/hooks/use-toast';
import { API, fileToBase64, type Team, type Player, type Post } from '@/lib/api';

const HERO_IMG =
  'https://cdn.poehali.dev/projects/02343a5d-a291-4ce0-85da-ca3fac8c3b1d/files/2e438769-95b8-4043-9a41-2cd7c3825702.jpg';

const NAV = [
  { id: 'home', label: 'Главная' },
  { id: 'news', label: 'Новости' },
  { id: 'players', label: 'Команды' },
  { id: 'rules', label: 'Правила' },
  { id: 'register', label: 'Регистрация' },
  { id: 'contacts', label: 'Контакты' },
];

const ROLES = ['Вратарь', 'Защитник', 'Полузащитник', 'Нападающий'];

const RULES = [
  { q: '1. Формат игры', a: 'Матч 6 на 6 на специальной арене Minecraft. Два тайма по 10 минут с перерывом 3 минуты.' },
  { q: '2. Разрешённые предметы', a: 'Только стандартные блоки и предметы режима. Использование читов и модов на полёт строго запрещено.' },
  { q: '3. Подсчёт голов', a: 'Гол засчитывается, когда мяч (блок слизи) полностью пересекает линию ворот соперника.' },
  { q: '4. Дисциплина', a: 'Намеренная порча арены, гриферство и оскорбления ведут к удалению с турнира без возврата места.' },
  { q: '5. Победитель', a: 'Команда с наибольшим количеством голов. При ничьей — серия пенальти по 5 ударов.' },
];

const Index = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nick: '', real_name: '', contact: '', role: 'Нападающий', team_id: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(API.public);
      const data = await res.json();
      setTeams(data.teams || []);
      setPlayers(data.players || []);
      setPosts(data.posts || []);
    } catch {
      // тихо игнорируем
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhoto(f);
      setPhotoPreview(URL.createObjectURL(f));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nick.trim() || !form.contact.trim()) {
      toast({ title: 'Заполни ник и контакт', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      let photo_base64: string | undefined;
      if (photo) photo_base64 = await fileToBase64(photo);
      const selectedTeam = teams.find((t) => String(t.id) === form.team_id);
      const res = await fetch(API.public, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nick: form.nick,
          real_name: form.real_name,
          contact: form.contact,
          role: form.role,
          team_id: form.team_id ? Number(form.team_id) : null,
          team_name: selectedTeam?.name || '',
          photo_base64,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: '🎉 Заявка отправлена!', description: 'Жди подтверждения от организаторов.' });
        setForm({ nick: '', real_name: '', contact: '', role: 'Нападающий', team_id: '' });
        setPhoto(null);
        setPhotoPreview('');
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Попробуй ещё раз', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => scrollTo('home')} className="font-pixel text-sm">
            <span className="text-glow-red text-primary">CUBE</span>
            <span className="text-glow-blue text-secondary"> CUP</span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {n.label}
              </button>
            ))}
          </nav>
          <Button
            onClick={() => scrollTo('register')}
            className="font-pixel text-[10px] rounded-none bg-primary hover:bg-primary/90 box-glow-red"
          >
            ИГРАТЬ
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex items-center justify-center grid-bg pt-16">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${HERO_IMG})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-primary/30 blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 rounded-full bg-secondary/30 blur-[120px] animate-glow-pulse" />

        <div className="relative container text-center animate-fade-in">
          <div className="inline-block mb-6 px-4 py-2 border border-secondary/50 bg-secondary/10 box-glow-blue">
            <span className="font-pixel text-[10px] text-secondary">⚽ 18 КОМАНД · ПО 6 ИГРОКОВ</span>
          </div>
          <h1 className="font-pixel text-3xl md:text-6xl leading-tight mb-6">
            <span className="text-glow-red text-primary">КУБОК</span>
            <br />
            <span className="text-glow-blue text-secondary">МАЙНКРАФТА</span>
          </h1>
          <p className="max-w-xl mx-auto text-muted-foreground text-lg mb-10">
            Эпичный футбольный турнир в кубическом мире. Выбери команду, приложи свой скин
            и зарегистрируйся на матч.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => scrollTo('register')}
              className="font-pixel text-xs rounded-none h-14 px-8 bg-primary hover:bg-primary/90 box-glow-red hover:scale-105 transition-transform"
            >
              РЕГИСТРАЦИЯ
            </Button>
            <Button
              onClick={() => scrollTo('players')}
              variant="outline"
              className="font-pixel text-xs rounded-none h-14 px-8 border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary box-glow-blue hover:scale-105 transition-transform"
            >
              КОМАНДЫ
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <Icon name="ChevronDown" className="text-muted-foreground" size={28} />
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border bg-card/40">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-px">
          {[
            { value: '18', label: 'Команд' },
            { value: '108', label: 'Мест' },
            { value: String(players.length), label: 'Игроков' },
            { value: '∞', label: 'Эмоций' },
          ].map((s, i) => (
            <div key={i} className="py-10 text-center">
              <div className={`font-pixel text-3xl md:text-4xl mb-2 ${i % 2 === 0 ? 'text-primary text-glow-red' : 'text-secondary text-glow-blue'}`}>
                {s.value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* NEWS / POSTS */}
      <section id="news" className="container py-24">
        <div className="text-center mb-14">
          <span className="font-pixel text-[10px] text-primary">НОВОСТИ</span>
          <h2 className="font-pixel text-2xl md:text-3xl mt-4">Лента турнира</h2>
        </div>
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground">Скоро здесь появятся новости матча ⚡</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <Card key={p.id} className="rounded-none bg-card border-border overflow-hidden hover:box-glow-blue transition-all hover:-translate-y-1">
                {p.image_url && (
                  <img src={p.image_url} alt={p.title} className="w-full h-44 object-cover" />
                )}
                <div className="p-6">
                  <div className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('ru-RU') : ''}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{p.body}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* PLAYERS / TEAMS */}
      <section id="players" className="bg-card/40 border-y border-border py-24">
        <div className="container">
          <div className="text-center mb-14">
            <span className="font-pixel text-[10px] text-primary">18 КОМАНД</span>
            <h2 className="font-pixel text-2xl md:text-3xl mt-4">
              <span className="text-glow-red text-primary">КРАСНЫЕ</span>
              <span className="text-muted-foreground"> vs </span>
              <span className="text-glow-blue text-secondary">СИНИЕ</span>
            </h2>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Загрузка...</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {teams.map((t) => {
                const isRed = t.color === 'red';
                const teamPlayers = players.filter((p) => p.team_name === t.name);
                return (
                  <Card
                    key={t.id}
                    className={`group rounded-none bg-card border-border p-6 transition-all hover:-translate-y-1 ${isRed ? 'hover:box-glow-red' : 'hover:box-glow-blue'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-10 ${isRed ? 'bg-primary' : 'bg-secondary'}`} />
                        <h3 className="font-bold text-lg leading-tight">{t.name}</h3>
                      </div>
                      <span className={`font-pixel text-[10px] ${isRed ? 'text-primary' : 'text-secondary'}`}>
                        {t.players_count}/6
                      </span>
                    </div>
                    <div className="h-2 bg-background overflow-hidden mb-4">
                      <div className={`h-full ${isRed ? 'bg-primary' : 'bg-secondary'}`} style={{ width: `${(t.players_count / 6) * 100}%` }} />
                    </div>
                    {teamPlayers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Состав формируется...</p>
                    ) : (
                      <div className="space-y-2">
                        {teamPlayers.map((p) => (
                          <div key={p.id} className="flex items-center gap-3">
                            {p.skin_url ? (
                              <img src={p.skin_url} alt={p.nick} className="w-8 h-8 object-cover pixel-shadow" />
                            ) : (
                              <div className={`w-8 h-8 flex items-center justify-center text-xs font-pixel ${isRed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                                {p.nick[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{p.nick}</div>
                              <div className="text-[10px] text-muted-foreground">{p.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* RULES */}
      <section id="rules" className="container py-24">
        <div className="text-center mb-14">
          <span className="font-pixel text-[10px] text-secondary">ПРАВИЛА</span>
          <h2 className="font-pixel text-2xl md:text-3xl mt-4">Кодекс арены</h2>
        </div>
        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {RULES.map((r, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border bg-card px-5 rounded-none">
                <AccordionTrigger className="font-bold hover:text-primary hover:no-underline">{r.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{r.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* REGISTER */}
      <section id="register" className="relative bg-card/40 border-y border-border py-24 grid-bg">
        <div className="container max-w-lg">
          <div className="text-center mb-10">
            <span className="font-pixel text-[10px] text-primary">РЕГИСТРАЦИЯ</span>
            <h2 className="font-pixel text-2xl md:text-3xl mt-4">Займи место в составе</h2>
            <p className="text-muted-foreground mt-4 text-sm">
              Заполни форму, выбери команду и приложи свой скин. После проверки тебя добавят в состав.
            </p>
          </div>
          <Card className="rounded-none bg-card border-border p-8 box-glow-blue">
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Ник в Minecraft *</label>
                <Input value={form.nick} onChange={(e) => setForm({ ...form, nick: e.target.value })} placeholder="Steve_Pro" className="rounded-none bg-background border-border focus-visible:ring-primary" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Имя / как зовут</label>
                <Input value={form.real_name} onChange={(e) => setForm({ ...form, real_name: e.target.value })} placeholder="Иван" className="rounded-none bg-background border-border focus-visible:ring-primary" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Контакт (Telegram / Email) *</label>
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="@nick или mail@mail.com" className="rounded-none bg-background border-border focus-visible:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Позиция</label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger className="rounded-none bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Команда</label>
                  <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
                    <SelectTrigger className="rounded-none bg-background border-border"><SelectValue placeholder="Выбрать" /></SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)} disabled={t.players_count >= 6}>
                          {t.name} ({t.players_count}/6)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Фото скина</label>
                <label className="flex items-center gap-3 border border-dashed border-border bg-background p-3 cursor-pointer hover:border-secondary transition-colors">
                  <Icon name="Upload" size={18} className="text-secondary" />
                  <span className="text-sm text-muted-foreground">{photo ? photo.name : 'Загрузить картинку скина'}</span>
                  <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
                </label>
                {photoPreview && <img src={photoPreview} alt="preview" className="mt-3 w-20 h-20 object-cover pixel-shadow" />}
              </div>
              <Button type="submit" disabled={submitting} className="w-full font-pixel text-xs rounded-none h-14 bg-primary hover:bg-primary/90 box-glow-red hover:scale-[1.02] transition-transform">
                {submitting ? 'ОТПРАВКА...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* CONTACTS / FOOTER */}
      <footer id="contacts" className="container py-16">
        <div className="grid md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="font-pixel text-sm mb-4">
              <span className="text-glow-red text-primary">CUBE</span>
              <span className="text-glow-blue text-secondary"> CUP</span>
            </div>
            <p className="text-sm text-muted-foreground">Турнир по футболу в Minecraft. Объединяем игроков со всего сервера.</p>
          </div>
          <div>
            <h3 className="font-bold mb-4">Контакты</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Icon name="Send" size={16} /> @cubecup_admin</li>
              <li className="flex items-center gap-2"><Icon name="Mail" size={16} /> cup@cube.gg</li>
              <li className="flex items-center gap-2"><Icon name="Server" size={16} /> mc.cubecup.gg</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Организаторам</h3>
            <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-secondary/80">
              <Icon name="Shield" size={16} /> Войти в админ-панель
            </Link>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 CUBE CUP. Сделано для любителей кубического футбола.
        </div>
      </footer>
    </div>
  );
};

export default Index;
