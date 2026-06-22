import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

type TeamMode = 'create' | 'join';

const Index = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // форма
  const [teamMode, setTeamMode] = useState<TeamMode>('join');
  const [form, setForm] = useState({
    nick: '', real_name: '', contact: '', role: 'Нападающий',
    // join
    join_team_id: '',
    // create
    new_team_name: '', new_team_color: 'red' as 'red' | 'blue',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(API.public);
      const data = await res.json();
      setTeams(data.teams || []);
      setPlayers(data.players || []);
      setPosts(data.posts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setPhoto(f); setPhotoPreview(URL.createObjectURL(f)); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nick.trim() || !form.contact.trim()) {
      toast({ title: 'Заполни ник и контакт', variant: 'destructive' }); return;
    }
    if (teamMode === 'join' && !form.join_team_id) {
      toast({ title: 'Выбери команду для вступления', variant: 'destructive' }); return;
    }
    if (teamMode === 'create' && !form.new_team_name.trim()) {
      toast({ title: 'Введи название своей команды', variant: 'destructive' }); return;
    }

    setSubmitting(true);
    try {
      let photo_base64: string | undefined;
      if (photo) photo_base64 = await fileToBase64(photo);

      const payload =
        teamMode === 'create'
          ? {
              action: 'create_team',
              nick: form.nick, real_name: form.real_name,
              contact: form.contact, role: form.role,
              team_name: form.new_team_name,
              team_color: form.new_team_color,
              photo_base64,
            }
          : {
              action: 'join_team',
              nick: form.nick, real_name: form.real_name,
              contact: form.contact, role: form.role,
              team_id: Number(form.join_team_id),
              photo_base64,
            };

      const res = await fetch(API.public, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: '🎉 Заявка отправлена!',
          description: teamMode === 'create'
            ? `Ты создал команду «${form.new_team_name}» и стал капитаном. Ждём подтверждения.`
            : 'Заявка на вступление отправлена. Жди подтверждения.',
        });
        setForm({ nick: '', real_name: '', contact: '', role: 'Нападающий', join_team_id: '', new_team_name: '', new_team_color: 'red' });
        setPhoto(null); setPhotoPreview('');
        loadData();
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Попробуй ещё раз', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const teamsLeft = 18 - teams.length;

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
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {n.label}
              </button>
            ))}
          </nav>
          <Button onClick={() => scrollTo('register')}
            className="font-pixel text-[10px] rounded-none bg-primary hover:bg-primary/90 box-glow-red">
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
            <span className="text-glow-red text-primary">КУБОК</span><br />
            <span className="text-glow-blue text-secondary">МАЙНКРАФТА</span>
          </h1>
          <p className="max-w-xl mx-auto text-muted-foreground text-lg mb-10">
            Эпичный футбольный турнир в кубическом мире. Создай свою команду или вступи в существующую, загрузи скин и зарегистрируйся.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => scrollTo('register')}
              className="font-pixel text-xs rounded-none h-14 px-8 bg-primary hover:bg-primary/90 box-glow-red hover:scale-105 transition-transform">
              РЕГИСТРАЦИЯ
            </Button>
            <Button onClick={() => scrollTo('players')} variant="outline"
              className="font-pixel text-xs rounded-none h-14 px-8 border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary box-glow-blue hover:scale-105 transition-transform">
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
            { value: String(teams.length), label: 'Команд' },
            { value: String(18 - teams.length), label: 'Мест для команд' },
            { value: String(players.length), label: 'Игроков' },
            { value: '108', label: 'Мест всего' },
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

      {/* NEWS */}
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
                {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-44 object-cover" />}
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

      {/* TEAMS */}
      <section id="players" className="bg-card/40 border-y border-border py-24">
        <div className="container">
          <div className="text-center mb-14">
            <span className="font-pixel text-[10px] text-primary">КОМАНДЫ ТУРНИРА</span>
            <h2 className="font-pixel text-2xl md:text-3xl mt-4">
              <span className="text-glow-red text-primary">КРАСНЫЕ</span>
              <span className="text-muted-foreground"> vs </span>
              <span className="text-glow-blue text-secondary">СИНИЕ</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-3">
              Осталось мест для команд: <span className="text-foreground font-bold">{teamsLeft}</span> из 18
            </p>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground">Загрузка...</p>
          ) : teams.length === 0 ? (
            <div className="text-center py-16">
              <div className="font-pixel text-4xl mb-4">⚽</div>
              <p className="text-muted-foreground">Команд пока нет — стань первым капитаном!</p>
              <Button onClick={() => scrollTo('register')} className="mt-6 rounded-none bg-primary box-glow-red font-pixel text-xs">
                СОЗДАТЬ КОМАНДУ
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {teams.map((t) => {
                const isRed = t.color === 'red';
                const teamPlayers = players.filter((p) => p.team_name === t.name);
                const pct = Math.round((t.approved_count / 6) * 100);
                return (
                  <Card key={t.id}
                    className={`rounded-none bg-card border-border p-6 transition-all hover:-translate-y-1 ${isRed ? 'hover:box-glow-red' : 'hover:box-glow-blue'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-10 ${isRed ? 'bg-primary' : 'bg-secondary'}`} />
                        <div>
                          <h3 className="font-bold text-base leading-tight">{t.name}</h3>
                          {t.captain && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Icon name="Crown" size={10} className={isRed ? 'text-primary' : 'text-secondary'} />
                              {t.captain}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-pixel text-sm ${isRed ? 'text-primary' : 'text-secondary'}`}>
                          {t.approved_count}/6
                        </span>
                        {t.total_count > t.approved_count && (
                          <div className="text-[10px] text-muted-foreground">+{t.total_count - t.approved_count} ожид.</div>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 bg-background overflow-hidden mb-4">
                      <div className={`h-full transition-all ${isRed ? 'bg-primary' : 'bg-secondary'}`} style={{ width: `${pct}%` }} />
                    </div>
                    {teamPlayers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Состав формируется...</p>
                    ) : (
                      <div className="space-y-2">
                        {teamPlayers.map((p) => (
                          <div key={p.id} className="flex items-center gap-2.5">
                            {p.skin_url ? (
                              <img src={p.skin_url} alt={p.nick} className="w-8 h-8 object-cover pixel-shadow shrink-0" />
                            ) : (
                              <div className={`w-8 h-8 flex items-center justify-center text-xs font-pixel shrink-0 ${isRed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
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
                    {t.approved_count < 6 && (
                      <button
                        onClick={() => {
                          setTeamMode('join');
                          setForm(f => ({ ...f, join_team_id: String(t.id) }));
                          scrollTo('register');
                        }}
                        className={`mt-4 w-full text-xs py-2 border transition-colors ${isRed ? 'border-primary text-primary hover:bg-primary/10' : 'border-secondary text-secondary hover:bg-secondary/10'}`}>
                        + Вступить в команду
                      </button>
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
              Создай свою команду и стань капитаном — или вступи в уже существующую.
            </p>
          </div>

          {/* переключатель режима */}
          <div className="grid grid-cols-2 mb-6 border border-border">
            <button
              onClick={() => setTeamMode('join')}
              className={`py-3 font-pixel text-[10px] transition-colors ${teamMode === 'join' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              ВСТУПИТЬ В КОМАНДУ
            </button>
            <button
              onClick={() => setTeamMode('create')}
              className={`py-3 font-pixel text-[10px] transition-colors ${teamMode === 'create' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              СОЗДАТЬ КОМАНДУ
            </button>
          </div>

          <Card className={`rounded-none bg-card border-border p-8 ${teamMode === 'create' ? 'box-glow-red' : 'box-glow-blue'}`}>
            <form onSubmit={submit} className="space-y-5">
              {/* общие поля */}
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Ник в Minecraft *</label>
                <Input value={form.nick} onChange={e => setForm({ ...form, nick: e.target.value })}
                  placeholder="Steve_Pro" className="rounded-none bg-background border-border focus-visible:ring-primary" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Имя / как зовут</label>
                <Input value={form.real_name} onChange={e => setForm({ ...form, real_name: e.target.value })}
                  placeholder="Иван" className="rounded-none bg-background border-border focus-visible:ring-primary" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Telegram или Email *</label>
                <Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                  placeholder="@nick или mail@mail.com" className="rounded-none bg-background border-border focus-visible:ring-primary" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Позиция</label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger className="rounded-none bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* ВСТУПИТЬ */}
              {teamMode === 'join' && (
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                    Команда {teams.length === 0 && <span className="text-primary">(пока команд нет — создай свою!)</span>}
                  </label>
                  <Select
                    value={form.join_team_id}
                    onValueChange={v => setForm({ ...form, join_team_id: v })}
                    disabled={teams.length === 0}>
                    <SelectTrigger className="rounded-none bg-background border-border"><SelectValue placeholder="Выбери команду" /></SelectTrigger>
                    <SelectContent>
                      {teams.map(t => (
                        <SelectItem key={t.id} value={String(t.id)} disabled={t.approved_count >= 6}>
                          <span className={t.color === 'red' ? 'text-primary' : 'text-secondary'}>■</span>
                          {' '}{t.name} ({t.approved_count}/6){t.approved_count >= 6 ? ' — полная' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {teams.length === 0 && (
                    <button type="button" onClick={() => setTeamMode('create')}
                      className="mt-2 text-xs text-primary underline">
                      Создать первую команду →
                    </button>
                  )}
                </div>
              )}

              {/* СОЗДАТЬ */}
              {teamMode === 'create' && (
                <>
                  {teamsLeft <= 0 ? (
                    <div className="bg-primary/10 border border-primary p-3 text-sm text-primary text-center">
                      Лимит команд достигнут (18/18). Вступи в существующую команду.
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                          Название команды * <span className="text-muted-foreground normal-case">(осталось мест: {teamsLeft})</span>
                        </label>
                        <Input value={form.new_team_name} onChange={e => setForm({ ...form, new_team_name: e.target.value })}
                          placeholder="Огненные Блоки" className="rounded-none bg-background border-border focus-visible:ring-primary" />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Цвет команды</label>
                        <div className="grid grid-cols-2 gap-3">
                          {(['red', 'blue'] as const).map(c => (
                            <button key={c} type="button"
                              onClick={() => setForm({ ...form, new_team_color: c })}
                              className={`py-3 border font-pixel text-[10px] transition-all ${form.new_team_color === c
                                ? c === 'red' ? 'bg-primary border-primary text-primary-foreground box-glow-red' : 'bg-secondary border-secondary text-secondary-foreground box-glow-blue'
                                : 'border-border text-muted-foreground hover:border-foreground'}`}>
                              {c === 'red' ? '🔴 КРАСНЫЕ' : '🔵 СИНИЕ'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* фото скина */}
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Фото скина</label>
                <label className="flex items-center gap-3 border border-dashed border-border bg-background p-3 cursor-pointer hover:border-secondary transition-colors">
                  <Icon name="Upload" size={18} className="text-secondary shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{photo ? photo.name : 'Загрузить скриншот скина'}</span>
                  <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
                </label>
                {photoPreview && <img src={photoPreview} alt="preview" className="mt-3 w-20 h-20 object-cover pixel-shadow" />}
              </div>

              <Button type="submit" disabled={submitting || (teamMode === 'create' && teamsLeft <= 0)}
                className={`w-full font-pixel text-xs rounded-none h-14 hover:scale-[1.02] transition-transform ${teamMode === 'create' ? 'bg-primary hover:bg-primary/90 box-glow-red' : 'bg-secondary hover:bg-secondary/90 box-glow-blue'}`}>
                {submitting ? 'ОТПРАВКА...' : teamMode === 'create' ? '⚔ СОЗДАТЬ КОМАНДУ И ВСТУПИТЬ' : '⚽ ВСТУПИТЬ В КОМАНДУ'}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
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
