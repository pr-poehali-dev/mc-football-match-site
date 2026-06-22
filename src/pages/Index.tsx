import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const HERO_IMG =
  'https://cdn.poehali.dev/projects/02343a5d-a291-4ce0-85da-ca3fac8c3b1d/files/2e438769-95b8-4043-9a41-2cd7c3825702.jpg';

const NAV = [
  { id: 'home', label: 'Главная' },
  { id: 'about', label: 'О матче' },
  { id: 'players', label: 'Команды' },
  { id: 'rules', label: 'Правила' },
  { id: 'register', label: 'Регистрация' },
  { id: 'contacts', label: 'Контакты' },
];

const PLAYERS = [
  { name: 'Steve_Pro', team: 'red', role: 'Нападающий', wins: 42, losses: 7, color: 'Алмазный молот' },
  { name: 'CreeperKing', team: 'blue', role: 'Вратарь', wins: 38, losses: 12, color: 'Стена обороны' },
  { name: 'NotchFC', team: 'red', role: 'Полузащита', wins: 51, losses: 5, color: 'Дриблинг-мастер' },
  { name: 'EnderShot', team: 'blue', role: 'Нападающий', wins: 47, losses: 9, color: 'Телепорт-удар' },
  { name: 'PixelWall', team: 'blue', role: 'Защитник', wins: 33, losses: 14, color: 'Несокрушимый' },
  { name: 'RedstoneX', team: 'red', role: 'Защитник', wins: 40, losses: 10, color: 'Тактик' },
];

const STATS = [
  { value: '64', label: 'Игроков' },
  { value: '8', label: 'Команд' },
  { value: '12', label: 'Матчей' },
  { value: '∞', label: 'Эмоций' },
];

const RULES = [
  { q: '1. Формат игры', a: 'Матч 6 на 6 на специальной арене Minecraft. Две тайма по 10 минут с перерывом 3 минуты.' },
  { q: '2. Разрешённые предметы', a: 'Только стандартные блоки и предметы режима. Использование читов и модов на полёт строго запрещено.' },
  { q: '3. Подсчёт голов', a: 'Гол засчитывается, когда мяч (блок слизи) полностью пересекает линию ворот соперника.' },
  { q: '4. Дисциплина', a: 'Намеренная порча арены, гриферство и оскорбления ведут к удалению с турнира без возврата места.' },
  { q: '5. Победитель', a: 'Команда с наибольшим количеством голов. При ничьей — серия пенальти по 5 ударов.' },
];

const Index = () => {
  const [form, setForm] = useState({ nick: '', team: '', email: '' });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-primary/30 blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 rounded-full bg-secondary/30 blur-[120px] animate-glow-pulse" />

        <div className="relative container text-center animate-fade-in">
          <div className="inline-block mb-6 px-4 py-2 border border-secondary/50 bg-secondary/10 box-glow-blue">
            <span className="font-pixel text-[10px] text-secondary">⚽ 22 ИЮНЯ · 19:00 МСК</span>
          </div>
          <h1 className="font-pixel text-3xl md:text-6xl leading-tight mb-6">
            <span className="text-glow-red text-primary">КУБОК</span>
            <br />
            <span className="text-glow-blue text-secondary">МАЙНКРАФТА</span>
          </h1>
          <p className="max-w-xl mx-auto text-muted-foreground text-lg mb-10">
            Эпичный футбольный матч в кубическом мире. Собирай команду, регистрируйся
            и пиши свою историю побед на блоковой арене.
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
          {STATS.map((s, i) => (
            <div key={i} className="py-10 text-center">
              <div
                className={`font-pixel text-3xl md:text-4xl mb-2 ${
                  i % 2 === 0 ? 'text-primary text-glow-red' : 'text-secondary text-glow-blue'
                }`}
              >
                {s.value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="container py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <span className="font-pixel text-[10px] text-secondary">О МАТЧЕ</span>
            <h2 className="font-pixel text-2xl md:text-3xl mt-4 mb-6 leading-relaxed">
              Футбол, которого <span className="text-glow-red text-primary">не видел</span> мир
            </h2>
            <p className="text-muted-foreground mb-6">
              CUBE CUP — это не просто игра. Это турнир, где стратегия Minecraft встречается
              с азартом большого футбола. Кубические ворота, мяч-слизь и арена из 10 000 блоков.
            </p>
            <div className="space-y-4">
              {[
                { icon: 'Trophy', text: 'Главный приз — алмазный кубок и звание чемпиона сервера' },
                { icon: 'Users', text: 'Командная игра 6 на 6 на профессиональной арене' },
                { icon: 'Zap', text: 'Прямая трансляция матча и комментаторы' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="shrink-0 w-11 h-11 flex items-center justify-center bg-primary/15 border border-primary/40 box-glow-red">
                    <Icon name={f.icon} className="text-primary" size={20} />
                  </div>
                  <span className="text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-scale-in">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary blur-lg opacity-50" />
            <img
              src={HERO_IMG}
              alt="Арена матча"
              className="relative w-full aspect-square object-cover pixel-shadow"
            />
          </div>
        </div>
      </section>

      {/* PLAYERS / TEAMS */}
      <section id="players" className="bg-card/40 border-y border-border py-24">
        <div className="container">
          <div className="text-center mb-14">
            <span className="font-pixel text-[10px] text-primary">КОМАНДЫ И ИГРОКИ</span>
            <h2 className="font-pixel text-2xl md:text-3xl mt-4">
              <span className="text-glow-red text-primary">КРАСНЫЕ</span>
              <span className="text-muted-foreground"> vs </span>
              <span className="text-glow-blue text-secondary">СИНИЕ</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLAYERS.map((p, i) => {
              const isRed = p.team === 'red';
              return (
                <Card
                  key={i}
                  className={`group relative rounded-none bg-card border-border p-6 transition-all hover:-translate-y-1 ${
                    isRed ? 'hover:box-glow-red' : 'hover:box-glow-blue'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className={`w-14 h-14 flex items-center justify-center font-pixel text-lg pixel-shadow ${
                        isRed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {p.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{p.name}</div>
                      <div className={`text-xs uppercase tracking-wide ${isRed ? 'text-primary' : 'text-secondary'}`}>
                        {p.role}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                    <Icon name="Sword" size={14} /> {p.color}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-background/60 p-3 text-center border border-border">
                      <div className="font-pixel text-base text-green-400">{p.wins}</div>
                      <div className="text-[10px] uppercase text-muted-foreground mt-1">Побед</div>
                    </div>
                    <div className="bg-background/60 p-3 text-center border border-border">
                      <div className="font-pixel text-base text-muted-foreground">{p.losses}</div>
                      <div className="text-[10px] uppercase text-muted-foreground mt-1">Поражений</div>
                    </div>
                  </div>
                  <div className="h-2 bg-background overflow-hidden">
                    <div
                      className={`h-full ${isRed ? 'bg-primary' : 'bg-secondary'}`}
                      style={{ width: `${Math.round((p.wins / (p.wins + p.losses)) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2">
                    Винрейт {Math.round((p.wins / (p.wins + p.losses)) * 100)}%
                  </div>
                </Card>
              );
            })}
          </div>
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
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border bg-card px-5 rounded-none"
              >
                <AccordionTrigger className="font-bold hover:text-primary hover:no-underline">
                  {r.q}
                </AccordionTrigger>
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
              Заполни форму — и капитан команды свяжется с тобой перед матчем.
            </p>
          </div>
          <Card className="rounded-none bg-card border-border p-8 box-glow-blue">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-5"
            >
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                  Никнейм в Minecraft
                </label>
                <Input
                  value={form.nick}
                  onChange={(e) => setForm({ ...form, nick: e.target.value })}
                  placeholder="Steve_Pro"
                  className="rounded-none bg-background border-border focus-visible:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                  Желаемая команда
                </label>
                <Input
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                  placeholder="Красные / Синие"
                  className="rounded-none bg-background border-border focus-visible:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                  Email или Telegram
                </label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@mail.com"
                  className="rounded-none bg-background border-border focus-visible:ring-primary"
                />
              </div>
              <Button
                type="submit"
                className="w-full font-pixel text-xs rounded-none h-14 bg-primary hover:bg-primary/90 box-glow-red hover:scale-[1.02] transition-transform"
              >
                ЗАРЕГИСТРИРОВАТЬСЯ
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
            <p className="text-sm text-muted-foreground">
              Турнир по футболу в Minecraft. Объединяем игроков со всего сервера.
            </p>
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
            <h3 className="font-bold mb-4">Мы в сети</h3>
            <div className="flex gap-3">
              {['Send', 'Youtube', 'Twitch', 'Disc'].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-11 h-11 flex items-center justify-center border border-border hover:border-primary hover:box-glow-red transition-all"
                >
                  <Icon name={icon} fallback="Globe" size={18} />
                </a>
              ))}
            </div>
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
