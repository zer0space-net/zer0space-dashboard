/* The handbook, as data. Rendered by static/js/docs.js.

   Every text-carrying field is an object with a `de` and an `en` key, kept at
   exact parity the same way the two dictionaries in i18n.js are. Code samples
   and ASCII diagrams are shared between the languages on purpose: a translated
   identifier would stop matching the source it documents.

   Block types (see the RENDER map in docs.js):

     lead    the one-paragraph summary under a section heading
     p       a paragraph. Supports `code`, **strong** and [text](url) inline
     h3/h4   sub-headings
     ul      a list; `numbered: true` renders it as steps
     code    a code sample: { lang, file, code }
     figure  an ASCII diagram: { code }
     tree    a file tree; **bold** marks the interesting entries
     table   { head: {de,en}, rows: {de,en} }
     note    a callout; tone is info | warn | crit | ok

   When the code this describes changes, this file changes with it. It is
   documentation of the real thing, not a parallel design document — every
   sample below is copied from the file it names. */

window.ZS_DOCS = {
  version: '4.4.0',

  sections: [

    /* ====================================================================== */
    {
      id: 'intro',
      icon: 'book-2',
      title: { de: 'Was ist zer0space?', en: 'What is zer0space?' },
      blocks: [
        {
          type: 'lead',
          de: 'Neun Maschinen, ein Fenster. zer0space ist ein selbst gehostetes Homelab: ein Docker-Swarm, der bewusst **keine Daten besitzt**, zwei Hosts daneben, die alles halten, was überleben muss, und ein Dashboard, das das Ganze bedienbar macht. Diese Seite erklärt jedes Stück davon — von der Netzwerkgrenze bis zur einzelnen Zeile Krypto-Code.',
          en: 'Nine machines, one window. zer0space is a self-hosted homelab: a Docker Swarm that deliberately **owns no data**, two hosts beside it that hold everything which must survive, and a dashboard that makes the whole thing operable. This page explains every piece of it — from the network boundary down to the individual line of crypto code.'
        },
        {
          type: 'p',
          de: 'Die Seite ist zum Nachschlagen gebaut und zum Durchlesen. Links steht das Inhaltsverzeichnis, die Suche darüber blendet alles aus, was nicht passt — sie durchsucht auch Codebeispiele und Tabellen, nicht nur Überschriften. Jeder Abschnitt hat einen eigenen Link (`/docs#vault`), den man weitergeben kann.',
          en: 'The page is built to be looked things up in as much as read through. The table of contents is on the left, the search above it hides everything that does not match — it searches code samples and table cells too, not just headings. Every section has its own link (`/docs#vault`) that can be handed to somebody else.'
        },

        { type: 'h3', de: 'Die Grundidee in drei Sätzen', en: 'The core idea in three sentences' },
        {
          type: 'ul',
          de: [
            '**Der Cluster besitzt nichts.** Docker Swarm repliziert keine Volumes. Statt Dienste an Knoten zu nageln, gibt es hier gar keinen Grund zum Nageln: Dateien liegen per NFS auf `zs-store-01`, strukturierte Daten in PostgreSQL auf `zs-state-01`. Jeder Swarm-Knoten darf jederzeit plattgemacht werden.',
            '**Der Eingang ist ein Tunnel, kein Reverse Proxy.** `cloudflared` wählt sich nach außen. Es gibt keinen offenen eingehenden Port, keine öffentliche Origin-IP und kein TLS-Zertifikat zu verwalten.',
            '**Authentifizierung ist zweifach und unabhängig.** Cloudflare Access am Rand, die eigene Session-Auth in der Anwendung. Keine der beiden Schichten vertraut der anderen.'
          ],
          en: [
            '**The cluster owns nothing.** Docker Swarm does not replicate volumes. Rather than pinning services to nodes, there is no reason left to pin: files live on `zs-store-01` over NFS, structured data in PostgreSQL on `zs-state-01`. Any Swarm node may be wiped at any time.',
            '**Ingress is a tunnel, not a reverse proxy.** `cloudflared` dials outward. There is no open inbound port, no public origin IP and no TLS certificate to manage.',
            '**Authentication is two independent layers.** Cloudflare Access at the edge, the application\'s own session auth inside. Neither layer trusts the other.'
          ]
        },

        { type: 'h3', de: 'Die Repos und was in ihnen steckt', en: 'The repositories and what lives in them' },
        {
          type: 'p',
          de: 'Alles ist in der GitHub-Organisation [zer0space-net](https://github.com/zer0space-net) aufgeteilt. Die Trennung folgt einer Regel: **Anwendungscode und Deploy-Konfiguration liegen zusammen, aber jede Anwendung hat ihr eigenes Repo.**',
          en: 'Everything is split across the GitHub organisation [zer0space-net](https://github.com/zer0space-net). The split follows one rule: **application code and deploy configuration live together, but every application gets its own repository.**'
        },
        {
          type: 'table',
          head: { de: ['Repo', 'Was drin ist', 'Sprache'], en: ['Repository', 'What is in it', 'Language'] },
          rows: {
            de: [
              ['`zer0space-dashboard`', 'Das Dashboard, das du gerade benutzt: Landingpage, Dienste-Kacheln, Cluster-Status, Tresor, Benutzerverwaltung, Crimson-Gateway und AI-Gateway.', 'Python + Vanilla JS'],
              ['`zer0space-ai`', 'Der KI-Assistent als eigener Dienst. Kennt den Live-Zustand des Clusters, spricht mit Anthropic, OpenAI, Gemini oder einem lokalen Ollama.', 'Python'],
              ['`zer0space-crimson-client`', 'Die Streaming-Oberfläche im zer0space-Look, React + Vite.', 'TypeScript'],
              ['`zer0space-crimson-backend`', 'Crimson Havens Backend (API, Datenbank, Sync-Worker) plus der zer0space-Build.', 'Python'],
              ['`zer0space-crimson-sources`', 'Crimson Havens Scrape-/Resolve-Engine, die im Browser des Zuschauers läuft.', 'TypeScript'],
              ['`zer0space-crimson-proxy`', 'Signierter HLS-Relay als Cloudflare Worker.', 'TypeScript / Nitro'],
              ['`zer0space-crimson-secret-backend-sources`', '**Privat.** Serverseitige Resolver und Scraper, die beim Build ins Backend-Image gelegt werden.', 'Python'],
              ['`zer0space-services`', 'Reine Compose-Dateien für Dienste ohne eigenen Code (cloudflared, Stirling-PDF).', 'YAML'],
              ['`zer0space-clients`', '**Intern.** Aufbauanleitungen für jede Maschine — der Rebuild-Plan, wenn etwas stirbt.', 'Markdown'],
              ['`zer0space-docs`', 'Die öffentliche Dokumentation der Architektur, plus die Mays-Artwork-Originale.', 'Markdown'],
              ['`zer0space-cloud` / `zer0space-status`', 'Noch nicht begonnen: eigener Cloud-Speicher und Uptime-Monitoring.', '—']
            ],
            en: [
              ['`zer0space-dashboard`', 'The dashboard you are using right now: landing page, service tiles, cluster status, vault, user management, Crimson gateway and AI gateway.', 'Python + vanilla JS'],
              ['`zer0space-ai`', 'The AI assistant as its own service. Knows the cluster\'s live state, talks to Anthropic, OpenAI, Gemini or a local Ollama.', 'Python'],
              ['`zer0space-crimson-client`', 'The streaming frontend in the zer0space look, React + Vite.', 'TypeScript'],
              ['`zer0space-crimson-backend`', 'Crimson Haven\'s backend (API, database, sync worker) plus the zer0space build.', 'Python'],
              ['`zer0space-crimson-sources`', 'Crimson Haven\'s scrape/resolve engine, running in the viewer\'s browser.', 'TypeScript'],
              ['`zer0space-crimson-proxy`', 'Signed HLS relay as a Cloudflare Worker.', 'TypeScript / Nitro'],
              ['`zer0space-crimson-secret-backend-sources`', '**Private.** Server-side resolvers and scrapers injected into the backend image at build time.', 'Python'],
              ['`zer0space-services`', 'Compose files only, for services with no source of their own (cloudflared, Stirling-PDF).', 'YAML'],
              ['`zer0space-clients`', '**Internal.** Build guides for every machine — the rebuild plan for when something dies.', 'Markdown'],
              ['`zer0space-docs`', 'The public architecture documentation, plus the original May artwork.', 'Markdown'],
              ['`zer0space-cloud` / `zer0space-status`', 'Not started yet: own cloud storage and uptime monitoring.', '—']
            ]
          }
        },
        {
          type: 'note',
          tone: 'info',
          title: { de: 'Warum so viele Crimson-Repos?', en: 'Why so many Crimson repositories?' },
          de: 'Weil das meiste davon **nicht zer0space-Code** ist. Crimson Haven ([crimsonhaven.org](https://crimsonhaven.org/)) hat Backend, Engine und Proxy gebaut; zer0space hostet sie und hat die Oberfläche neu geschrieben. Die Trennung hält sichtbar, was von wem stammt — siehe den Abschnitt [Crimson](#crimson).',
          en: 'Because most of it is **not zer0space code**. Crimson Haven ([crimsonhaven.org](https://crimsonhaven.org/)) built the backend, the engine and the proxy; zer0space hosts them and rewrote the frontend. The split keeps visible what came from where — see the [Crimson](#crimson) section.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'architecture',
      icon: 'topology-star-3',
      title: { de: 'Die Architektur', en: 'The architecture' },
      blocks: [
        {
          type: 'lead',
          de: 'Neun Maschinen. Sieben bilden einen Docker-Swarm, der gar keinen Zustand hält; zwei halten alles, was überleben muss. Der ganze Rest der Plattform ergibt sich aus dieser einen Entscheidung.',
          en: 'Nine machines. Seven form a Docker Swarm that holds no state at all; two hold everything that must survive. Every other decision in the platform follows from that one.'
        },
        {
          type: 'figure',
          code: {
            de: [
              '                        ┌──────────────────────┐',
              '            Internet ──▶│  Cloudflare          │',
              '                        │  DNS · Tunnel · MFA  │',
              '                        └──────────┬───────────┘',
              '                                   │  nur ausgehend, keine offenen Ports',
              '                                   ▼',
              '  ── LAN 192.168.0.0/24 ────────────────────────────────────────────────',
              '',
              '     ┌────────────────────────────────────────────────────────────┐',
              '     │  DOCKER SWARM — zustandslos (7 Knoten)                     │',
              '     │                                                            │',
              '     │   Manager (Quorum 3)          Worker (4)                   │',
              '     │   zs-node-01   .17          zs-worker-01  .20              │',
              '     │   zs-node-02   .18          zs-worker-02  .21              │',
              '     │   zs-node-03   .19          zs-worker-03  .22              │',
              '     │                             zs-worker-04  .23              │',
              '     │                                                            │',
              '     │  Keine lokalen Volumes. Jeder Task darf überall laufen.    │',
              '     └─────────────┬─────────────────────┬────────────────────────┘',
              '                   │ NFS /mnt/storage    │ TCP 5432',
              '                   ▼                     ▼',
              '',
              '     ┌───────────────────────┐   ┌──────────────────────────┐',
              '     │  zs-store-01    .15   │   │  zs-state-01    .16      │',
              '     │  NICHT im Swarm       │   │  NICHT im Swarm          │',
              '     │  NFS-Export           │   │  PostgreSQL + Portainer  │',
              '     │  /srv/nfs/swarm-data  │   │  Datenbanken + Steuerung │',
              '     └───────────────────────┘   └──────────────────────────┘',
              '',
              '  Tailscale-Mesh über alle neun Maschinen — Verwaltung, keine offenen Ports'
            ].join('\n'),
            en: [
              '                        ┌──────────────────────┐',
              '            Internet ──▶│  Cloudflare          │',
              '                        │  DNS · Tunnel · MFA  │',
              '                        └──────────┬───────────┘',
              '                                   │  outbound only, no open inbound ports',
              '                                   ▼',
              '  ── LAN 192.168.0.0/24 ────────────────────────────────────────────────',
              '',
              '     ┌────────────────────────────────────────────────────────────┐',
              '     │  DOCKER SWARM — stateless (7 nodes)                        │',
              '     │                                                            │',
              '     │   Managers (quorum 3)         Workers (4)                  │',
              '     │   zs-node-01   .17          zs-worker-01  .20              │',
              '     │   zs-node-02   .18          zs-worker-02  .21              │',
              '     │   zs-node-03   .19          zs-worker-03  .22              │',
              '     │                             zs-worker-04  .23              │',
              '     │                                                            │',
              '     │  No local volumes. Any task may run on any node.           │',
              '     └─────────────┬─────────────────────┬────────────────────────┘',
              '                   │ NFS /mnt/storage    │ TCP 5432',
              '                   ▼                     ▼',
              '',
              '     ┌───────────────────────┐   ┌──────────────────────────┐',
              '     │  zs-store-01    .15   │   │  zs-state-01    .16      │',
              '     │  NOT in the Swarm     │   │  NOT in the Swarm        │',
              '     │  NFS export           │   │  PostgreSQL + Portainer  │',
              '     │  /srv/nfs/swarm-data  │   │  databases + control     │',
              '     └───────────────────────┘   └──────────────────────────┘',
              '',
              '  Tailscale mesh across all nine machines — management, no open ports'
            ].join('\n')
          }
        },

        { type: 'h3', de: 'Die neun Maschinen', en: 'The nine machines' },
        {
          type: 'table',
          head: { de: ['Host', 'IP', 'Rolle', 'Was darauf läuft'], en: ['Host', 'IP', 'Role', 'What runs on it'] },
          rows: {
            de: [
              ['`zs-node-01`', '192.168.0.17', 'Manager', 'Swarm-Steuerung, Docker-Socket-Proxy, Backup-Cron, Crimson-Backend, Dashboard'],
              ['`zs-node-02`', '192.168.0.18', 'Manager', 'Swarm-Steuerung, Technitium DNS'],
              ['`zs-node-03`', '192.168.0.19', 'Manager', 'Swarm-Steuerung'],
              ['`zs-worker-01`', '192.168.0.20', 'Worker', 'Größter Knoten, allgemeine Last'],
              ['`zs-worker-02`', '192.168.0.21', 'Worker', 'Allgemeine Last'],
              ['`zs-worker-03`', '192.168.0.22', 'Worker', 'Stirling-PDF'],
              ['`zs-worker-04`', '192.168.0.23', 'Worker', 'Allgemeine Last, neueste Hardware'],
              ['`zs-state-01`', '192.168.0.16', '**Außerhalb**', 'PostgreSQL, Portainer CE, Ollama'],
              ['`zs-store-01`', '192.168.0.15', '**Außerhalb**', 'NFS-Export für alle Knoten']
            ],
            en: [
              ['`zs-node-01`', '192.168.0.17', 'Manager', 'Swarm control plane, Docker socket proxy, backup cron, Crimson backend, dashboard'],
              ['`zs-node-02`', '192.168.0.18', 'Manager', 'Swarm control plane, Technitium DNS'],
              ['`zs-node-03`', '192.168.0.19', 'Manager', 'Swarm control plane'],
              ['`zs-worker-01`', '192.168.0.20', 'Worker', 'Largest node, general workload'],
              ['`zs-worker-02`', '192.168.0.21', 'Worker', 'General workload'],
              ['`zs-worker-03`', '192.168.0.22', 'Worker', 'Stirling-PDF'],
              ['`zs-worker-04`', '192.168.0.23', 'Worker', 'General workload, newest hardware'],
              ['`zs-state-01`', '192.168.0.16', '**Outside**', 'PostgreSQL, Portainer CE, Ollama'],
              ['`zs-store-01`', '192.168.0.15', '**Outside**', 'NFS export mounted by every node']
            ]
          }
        },
        {
          type: 'p',
          de: 'Drei Manager, nicht vier: Raft verträgt bei drei Managern genau einen Ausfall — und bei vier auch. Ein vierter Manager kauft nichts und kostet eine weitere Stimme, die erreichbar sein muss.',
          en: 'Three managers, not four: Raft tolerates exactly one manager failure at three — and also at four. A fourth manager buys nothing and costs another vote that has to stay reachable.'
        },
        {
          type: 'p',
          de: 'Die Trennung zwischen den beiden Hosts außerhalb ist Absicht: **`zs-state-01` betreibt zustandsbehaftete *Dienste*** (eine Datenbank-Engine, die Steuer-UI), **`zs-store-01` hält *Dateien***. Andere Ausfallmodi, andere Backup-Anforderungen, andere Hardware.',
          en: 'The split between the two outside hosts is deliberate: **`zs-state-01` runs stateful *services*** (a database engine, the control UI), **`zs-store-01` holds *files***. Different failure modes, different backup needs, different hardware.'
        },

        { type: 'h3', de: 'Wann ein Dienst doch an einen Knoten darf', en: 'When a service may still be pinned to a node' },
        {
          type: 'p',
          de: 'Speicher ist kein Grund mehr. Was noch zählt:',
          en: 'Storage is no longer a reason. What still qualifies:'
        },
        {
          type: 'ul',
          de: [
            'Der Docker-Socket eines **Managers** — nur Manager beantworten `/nodes`, `/services` und `/tasks`. Deshalb steht der `socketproxy` fest auf `zs-node-01`.',
            '`mode: global`-Agenten wie Glances, die per Definition überall laufen.',
            'Konkrete Hardware, die an genau einem Host hängt.',
            'Und ein ehrlicher Sonderfall: das Crimson-Postgres liegt aktuell als Bind-Mount auf `zs-node-01`. Das ist Altlast, nicht Design — eine Datenbank auf NFS wäre falsch, also gehört sie langfristig zu `zs-state-01`.'
          ],
          en: [
            'The Docker socket of a **manager** — only managers answer `/nodes`, `/services` and `/tasks`. That is why `socketproxy` stays pinned to `zs-node-01`.',
            '`mode: global` agents like Glances, which run everywhere by definition.',
            'Specific hardware attached to exactly one host.',
            'And one honest exception: the Crimson PostgreSQL currently sits in a bind mount on `zs-node-01`. That is legacy, not design — a database on NFS would be wrong, so it belongs on `zs-state-01` eventually.'
          ]
        },

        { type: 'h3', de: 'Netzwerke', en: 'Networks' },
        {
          type: 'table',
          head: { de: ['Netz', 'Typ', 'Wer hängt dran'], en: ['Network', 'Type', 'Who is attached'] },
          rows: {
            de: [
              ['`cloudflared_proxy`', 'Overlay, extern', 'Alles, was öffentlich erreichbar sein soll. Wird einmal von Hand angelegt und gehört keinem Stack.'],
              ['`dashboard_net`', 'Overlay, im Stack', 'Dashboard ↔ socketproxy ↔ ai. Trägt die komplette Swarm-Topologie, deshalb `encrypted: "true"`.'],
              ['`crimson_net`', 'Overlay, extern', 'Dashboard ↔ Crimson-Client ↔ Crimson-API. Muss vor dem ersten Deploy existieren.'],
              ['Tailscale', 'Mesh (WireGuard)', 'Alle neun Maschinen, nur für Verwaltung. Kein offener Port nach außen.']
            ],
            en: [
              ['`cloudflared_proxy`', 'Overlay, external', 'Everything that should be publicly reachable. Created once by hand and owned by no stack.'],
              ['`dashboard_net`', 'Overlay, in-stack', 'Dashboard ↔ socketproxy ↔ ai. Carries the whole Swarm topology, hence `encrypted: "true"`.'],
              ['`crimson_net`', 'Overlay, external', 'Dashboard ↔ Crimson client ↔ Crimson API. Must exist before the first deploy.'],
              ['Tailscale', 'Mesh (WireGuard)', 'All nine machines, management only. No port open to the outside.']
            ]
          }
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Overlay-Verkehr ist standardmäßig unverschlüsselt', en: 'Overlay traffic is unencrypted by default' },
          de: 'Docker fährt Overlay-Netze als reines VXLAN auf UDP/4789, solange `encrypted: "true"` fehlt — der Verkehr läuft also im Klartext über das LAN. Docker kann das an einem bestehenden Netz **nicht** umschalten: `docker network rm` und Stack neu deployen ist der einzige Weg.',
          en: 'Docker runs overlay networks as plain VXLAN on UDP/4789 unless `encrypted: "true"` is set, so the traffic crosses the LAN in the clear. Docker **cannot** flip this on an existing network: `docker network rm` and redeploying the stack is the only path.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'dashboard',
      icon: 'server-2',
      title: { de: 'Das Dashboard', en: 'The dashboard' },
      blocks: [
        {
          type: 'lead',
          de: 'Ein einzelner Python-Container, eine Replik, hinter dem Cloudflare-Tunnel. Er hält selbst keinen Zustand außer den laufenden Sessions — und genau diese eine Ausnahme bestimmt fast alles andere an seiner Form.',
          en: 'A single Python container, one replica, behind the Cloudflare tunnel. It holds no state of its own except the live sessions — and that one exception shapes almost everything else about it.'
        },
        {
          type: 'ul',
          de: [
            '**Landingpage** — öffentlich, ohne Login. Die Haustür des Projekts.',
            '**Dienste-Starter** — gekachelte, kategorisierte Liste der Homelab-Dienste, von Admins pflegbar.',
            '**Cluster-Status** — Swarm-Knoten, Dienste und Tasks, gelesen durch einen abgeriegelten Docker-Socket-Proxy.',
            '**Host-Metriken** — CPU, RAM, Platte und Netz pro Knoten aus Glances-Agenten; dazu die zwei Hosts, die bewusst nicht im Swarm sind.',
            '**Backup-Status** — liest die JSON-Dateien, die das Backup-Skript pro Knoten in den gemeinsamen Speicher legt.',
            '**Benutzerverwaltung** — Rollen `admin`/`viewer`, Ersteinrichtungs-Assistent, Einladungscodes, optional TOTP-Zweifaktor.',
            '**Passwort-Tresor** — verschlüsselte Zugangsdaten pro Benutzer. Der Teil, bei dem man am vorsichtigsten sein muss.',
            '**Gateways** — `/crimson` zur Streaming-Oberfläche, `/api/ai/*` zum KI-Dienst.'
          ],
          en: [
            '**Landing page** — public, no login. The front door of the project.',
            '**Service launcher** — a tiled, categorised list of homelab services, editable by admins.',
            '**Cluster status** — Swarm nodes, services and tasks, read through a locked-down Docker socket proxy.',
            '**Host metrics** — per-node CPU, RAM, disk and network from Glances agents; plus the two hosts deliberately outside the Swarm.',
            '**Backup status** — reads the per-node JSON files the backup script drops into the shared storage.',
            '**User management** — `admin`/`viewer` roles, a first-run setup wizard, invitation codes, optional TOTP two-factor.',
            '**Password vault** — per-user encrypted credentials. The part to be most careful with.',
            '**Gateways** — `/crimson` to the streaming frontend, `/api/ai/*` to the AI service.'
          ]
        },

        { type: 'h3', de: 'Technik', en: 'Tech stack' },
        {
          type: 'table',
          head: { de: ['Schicht', 'Wahl', 'Warum'], en: ['Layer', 'Choice', 'Why'] },
          rows: {
            de: [
              ['Laufzeit', 'Python 3.12 (alpine)', 'Ein Stage im Dockerfile, kein Compiler — jede Abhängigkeit liefert ein musllinux-Wheel.'],
              ['HTTP', 'FastAPI auf Starlette, uvicorn', 'Async von unten bis oben; die Metrik-Polls sind reine I/O.'],
              ['Sessions', 'Eigener Speicher im Prozess + signierte Cookie-ID', 'Starlettes `SessionMiddleware` serialisiert die Session **in** das Cookie — das würde den Tresorschlüssel dem Browser geben.'],
              ['Datenbank', 'PostgreSQL über `asyncpg`, **kein ORM**', 'Reines parametrisiertes SQL. Das Schema ist älter als dieser Rewrite und musste unverändert weiterlaufen.'],
              ['Hashing', '`bcrypt` (Kosten 12), PBKDF2 für den Tresor', 'Beides in einem Worker-Thread, siehe unten.'],
              ['Krypto', '`cryptography` (AES-256-GCM)', 'Tresorfelder und TOTP-Geheimnisse.'],
              ['HTTP raus', '`httpx` (async, streaming)', 'Glances, Docker-Proxy, Crimson, AI.'],
              ['Templates', 'Jinja2', '—'],
              ['Frontend', 'Vanilla JS, **kein Framework, kein Build**', 'Die ausgelieferten Dateien sind byteweise die Dateien im Git.']
            ],
            en: [
              ['Runtime', 'Python 3.12 (alpine)', 'One stage in the Dockerfile, no compiler — every dependency ships a musllinux wheel.'],
              ['HTTP', 'FastAPI on Starlette, uvicorn', 'Async top to bottom; the metric polls are pure I/O.'],
              ['Sessions', 'Custom in-process store + signed cookie id', 'Starlette\'s `SessionMiddleware` serialises the session **into** the cookie — that would hand the vault key to the browser.'],
              ['Database', 'PostgreSQL via `asyncpg`, **no ORM**', 'Plain parameterised SQL. The schema predates this rewrite and had to keep working unchanged.'],
              ['Hashing', '`bcrypt` (cost 12), PBKDF2 for the vault', 'Both in a worker thread, see below.'],
              ['Crypto', '`cryptography` (AES-256-GCM)', 'Vault fields and TOTP secrets.'],
              ['HTTP out', '`httpx` (async, streaming)', 'Glances, Docker proxy, Crimson, AI.'],
              ['Templates', 'Jinja2', '—'],
              ['Frontend', 'Vanilla JS, **no framework, no build step**', 'The served files are byte-for-byte the files in git.']
            ]
          }
        },
        {
          type: 'note',
          tone: 'info',
          title: { de: 'Bis v4 war das eine Node.js-Anwendung', en: 'Until v4 this was a Node.js application' },
          de: 'v4 ist ein vollständiger Rewrite in Python. Was dabei absichtlich **nicht** geändert wurde: die PostgreSQL-Datenbank samt Live-Daten, das **Tresor-Wire-Format** (byteidentisch zu dem, was die Node-Version schrieb) und die bcrypt-Kosten 12, damit bestehende Benutzer sich weiter anmelden können.',
          en: 'v4 is a complete rewrite in Python. What deliberately did **not** change: the PostgreSQL database including live data, the **vault wire format** (byte-identical to what the Node version wrote) and bcrypt cost 12, so existing users can still sign in.'
        },

        { type: 'h3', de: 'Was wo liegt', en: 'Where things live' },
        {
          type: 'tree',
          code: [
            'src/',
            '├── **config.py**      Umgebung + Swarm-Secrets, einmal beim Import aufgelöst',
            '├── **db.py**          asyncpg-Pool, idempotentes Schema, Query-Helfer',
            '├── **auth.py**        Sessions, Rate-Limits, Sperren, CSRF, Passwort-Policy',
            '├── **totp.py**        TOTP-Geheimnis, QR-Code, Code-Prüfung',
            '├── **vault.py**       PBKDF2 + AES-256-GCM, Tresor-CRUD',
            '├── **metrics.py**     Docker-Socket-Proxy + Glances, Status-Kacheln',
            '├── **crimson.py**     Reverse-Proxy für /crimson',
            '├── **crimson_sso.py** Ed25519-Schlüssel pro Benutzer, Bearer-Cache',
            '├── **ai.py**          Gateway zum KI-Dienst',
            '└── **main.py**        FastAPI-App: Middleware, Routen, Lifespan',
            'static/',
            '├── css/   main.css (Design-System) + je eine Datei pro Seitenfamilie',
            '├── js/    boot → i18n → ui → Seitenskript  (Reihenfolge zählt)',
            '└── img/   May-Artwork und die zehn Chibi-Sticker',
            'templates/',
            '├── base.html      jede Seite erweitert diese',
            '├── _macros.html   Wortmarke, Brand-Mark, Tagline, Chibi, Sprachumschalter',
            '└── landing / login / register / setup / dashboard / monitoring / **docs** / 404 / …',
            'static/vendor/tabler/   Tabler-Icons als Webfont (CSP verbietet ein CDN)',
            'scripts/unlock-user.py  Notfall-Entsperrung eines Kontos',
            'docs/                   security.md · design.md'
          ].join('\n')
        },

        { type: 'h3', de: 'Drei Dinge, die man leicht kaputt macht', en: 'Three things that are easy to break' },
        {
          type: 'h4',
          de: '1. Sessions müssen im Prozessspeicher bleiben',
          en: '1. Sessions must stay in process memory'
        },
        {
          type: 'p',
          de: 'Die Session hält den **abgeleiteten Tresorschlüssel** des Benutzers. Deshalb kommt weder Starlettes Cookie-Session infrage (sie gäbe den Schlüssel an den Browser) noch ein Session-Store in der Datenbank (er schriebe ihn nach PostgreSQL — genau das, was der Tresor verhindern soll).',
          en: 'The session holds the user\'s **derived vault key**. That disqualifies Starlette\'s cookie session (it would hand the key to the browser) and equally a database-backed store (it would write the key to PostgreSQL, which is exactly what the vault design exists to avoid).'
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Die Konsequenz ist tragend', en: 'The consequence is load-bearing' },
          de: '`replicas: 1`, und ein Neustart meldet alle ab. Das ist **kein Bug, der behoben werden soll** — eine zweite Replik würde Anfragen beantworten, die die Session der ersten nicht sehen können, was sich für Benutzer wie zufällige Logouts anfühlt.',
          en: '`replicas: 1`, and a restart signs everyone out. This is **not a bug to be fixed** — a second replica would answer requests that cannot see the session the first one created, which reads to users as random logouts.'
        },
        {
          type: 'h4',
          de: '2. Die Reihenfolge der Middleware',
          en: '2. Middleware order'
        },
        {
          type: 'p',
          de: 'Zuletzt hinzugefügt heißt am weitesten außen. CSRF muss *innerhalb* von Session sitzen (es liest `request.state.session`), und Session muss *innerhalb* von SecurityHeaders sitzen, damit `Set-Cookie` überlebt. Details unten unter [Anfrageweg](#request).',
          en: 'Added last means outermost. CSRF must sit *inside* Session (it reads `request.state.session`), and Session must sit *inside* SecurityHeaders so `Set-Cookie` survives. Details below under [Request path](#request).'
        },
        {
          type: 'h4',
          de: '3. Verbindungsfehler werden umgewandelt, nicht breit gefangen',
          en: '3. Connection errors are converted, not caught broadly'
        },
        {
          type: 'p',
          de: '`db.py` verwandelt jeden Verbindungsfehler in `db.DatabaseUnavailable`, **bevor** er das Modul verlässt, und `main.py` hat genau einen Handler dafür. Einen Handler für `OSError` oder `ConnectionError` zu registrieren würde jeden unbeteiligten Socket-Fehler im Prozess in „Datenbank nicht erreichbar" verwandeln.',
          en: '`db.py` turns every connection-level failure into `db.DatabaseUnavailable` **before** it leaves the module, and `main.py` has exactly one handler for it. Registering a handler for `OSError` or `ConnectionError` would turn every unrelated socket error in the process into "database unavailable".'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'request',
      icon: 'route',
      title: { de: 'Der Weg einer Anfrage', en: 'The path of a request' },
      blocks: [
        {
          type: 'lead',
          de: 'Von der TCP-Verbindung bis zur Antwort durchläuft jede Anfrage fünf Middleware-Schichten. Ihre Reihenfolge ist keine Geschmacksfrage — jede Schicht setzt voraus, was die äußere schon getan hat.',
          en: 'From the TCP connection to the response every request passes through five middleware layers. Their order is not a matter of taste — each layer depends on what the one outside it has already done.'
        },
        {
          type: 'figure',
          code: {
            de: [
              '  Browser',
              '     │  Cookie: zs.sid=<signiert>   ·   X-CSRF-Token: <hex>',
              '     ▼',
              '  ┌─────────────────────────────────────────────────────────────┐',
              '  │ TrustedHost      Host-Header gegen ALLOWED_HOSTS prüfen      │',
              '  │ ┌─────────────────────────────────────────────────────────┐ │',
              '  │ │ BodyLimit      Body > 512 KB? 413, bevor irgendwer liest │ │',
              '  │ │ ┌─────────────────────────────────────────────────────┐ │ │',
              '  │ │ │ Maintenance  Wartungsseite statt allem außer /healthz│ │ │',
              '  │ │ │ ┌─────────────────────────────────────────────────┐ │ │ │',
              '  │ │ │ │ SecurityHeaders  CSP, HSTS, no-store für /api/  │ │ │ │',
              '  │ │ │ │ ┌─────────────────────────────────────────────┐ │ │ │ │',
              '  │ │ │ │ │ Session   sid → Session-Objekt, Set-Cookie  │ │ │ │ │',
              '  │ │ │ │ │ ┌─────────────────────────────────────────┐ │ │ │ │ │',
              '  │ │ │ │ │ │ CSRF   Double-Submit für POST/PUT/DELETE│ │ │ │ │ │',
              '  │ │ │ │ │ │ ┌─────────────────────────────────────┐ │ │ │ │ │ │',
              '  │ │ │ │ │ │ │  Route: _require_session / _admin   │ │ │ │ │ │ │',
              '  │ │ │ │ │ │ └─────────────────────────────────────┘ │ │ │ │ │ │',
              '  │ │ │ │ │ └─────────────────────────────────────────┘ │ │ │ │ │',
              '  │ │ │ │ └─────────────────────────────────────────────┘ │ │ │ │',
              '  │ │ │ └─────────────────────────────────────────────────┘ │ │ │',
              '  │ │ └─────────────────────────────────────────────────────┘ │ │',
              '  │ └─────────────────────────────────────────────────────────┘ │',
              '  └─────────────────────────────────────────────────────────────┘'
            ].join('\n'),
            en: [
              '  Browser',
              '     │  Cookie: zs.sid=<signed>   ·   X-CSRF-Token: <hex>',
              '     ▼',
              '  ┌─────────────────────────────────────────────────────────────┐',
              '  │ TrustedHost      check the Host header against ALLOWED_HOSTS │',
              '  │ ┌─────────────────────────────────────────────────────────┐ │',
              '  │ │ BodyLimit      body > 512 KB? 413, before anyone reads   │ │',
              '  │ │ ┌─────────────────────────────────────────────────────┐ │ │',
              '  │ │ │ Maintenance  the notice instead of all but /healthz  │ │ │',
              '  │ │ │ ┌─────────────────────────────────────────────────┐ │ │ │',
              '  │ │ │ │ SecurityHeaders  CSP, HSTS, no-store on /api/   │ │ │ │',
              '  │ │ │ │ ┌─────────────────────────────────────────────┐ │ │ │ │',
              '  │ │ │ │ │ Session   sid → session object, Set-Cookie  │ │ │ │ │',
              '  │ │ │ │ │ ┌─────────────────────────────────────────┐ │ │ │ │ │',
              '  │ │ │ │ │ │ CSRF   double submit on POST/PUT/DELETE │ │ │ │ │ │',
              '  │ │ │ │ │ │ ┌─────────────────────────────────────┐ │ │ │ │ │ │',
              '  │ │ │ │ │ │ │  route: _require_session / _admin   │ │ │ │ │ │ │',
              '  │ │ │ │ │ │ └─────────────────────────────────────┘ │ │ │ │ │ │',
              '  │ │ │ │ │ └─────────────────────────────────────────┘ │ │ │ │ │',
              '  │ │ │ │ └─────────────────────────────────────────────┘ │ │ │ │',
              '  │ │ │ └─────────────────────────────────────────────────┘ │ │ │',
              '  │ │ └─────────────────────────────────────────────────────┘ │ │',
              '  │ └─────────────────────────────────────────────────────────┘ │',
              '  └─────────────────────────────────────────────────────────────┘'
            ].join('\n')
          }
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py',
          code: `# Added last = outermost. Order of execution is therefore:
#   TrustedHost -> BodyLimit -> Maintenance -> SecurityHeaders -> Session -> CSRF -> routes
app.add_middleware(CsrfMiddleware)
app.add_middleware(auth.SessionMiddleware, store=session_store, secret=session_secret)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(MaintenanceMiddleware)
app.add_middleware(
    BodyLimitMiddleware,
    max_bytes=MAX_BODY_BYTES,
    proxy_max_bytes=MAX_PROXY_BODY_BYTES,
)
# Only mounted when ALLOWED_HOSTS is configured.
if config.ALLOWED_HOSTS:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=config.ALLOWED_HOSTS)`
        },

        { type: 'h3', de: 'Was jede Schicht tut', en: 'What each layer does' },
        {
          type: 'table',
          head: { de: ['Schicht', 'Aufgabe', 'Warum genau hier'], en: ['Layer', 'Job', 'Why exactly here'] },
          rows: {
            de: [
              ['`TrustedHostMiddleware`', 'Weist einen gefälschten `Host` ab.', 'Ein gefälschter Host erreicht sonst die Forwarded-Header des Crimson-Gateways und jede daraus gebaute absolute URL. Nur aktiv, wenn `ALLOWED_HOSTS` gesetzt ist.'],
              ['`BodyLimitMiddleware`', 'Deckelt den Request-Body auf 512 KB (Crimson: 32 MB).', 'Ganz außen, damit ein zu großer Body abgelehnt wird, *bevor* irgendjemand ihn puffert. `/api/login` ist unauthentifiziert und würde sonst beliebig große Bodies in den Speicher des einzigen Workers lassen.'],
              ['`MaintenanceMiddleware`', 'Liefert die Wartungsseite, außer für `/static/`, `/healthz`, `/favicon`.', 'Ein Umgebungsflag, keine DB-Einstellung — der Fall, für den man es braucht, ist „die Datenbank ist nicht erreichbar".'],
              ['`SecurityHeadersMiddleware`', 'CSP, `nosniff`, `frame-options`, HSTS, und `cache-control: no-store` für alle `/api/*`.', 'Außerhalb von Session, damit `Set-Cookie` nicht verloren geht. Das `no-store` ist kein Detail: `/api/*`-Antworten enthalten regelmäßig entschlüsselte Tresor-Einträge und TOTP-Wiederherstellungscodes.'],
              ['`SessionMiddleware`', 'Signierte sid aus dem Cookie lesen, Session-Objekt anhängen, Cookie schreiben.', 'Muss vor CSRF laufen, weil CSRF das Session-Token braucht.'],
              ['`CsrfMiddleware`', 'Double-Submit-Prüfung auf jeder zustandsändernden Anfrage mit Session.', 'Ganz innen, direkt vor den Routen.']
            ],
            en: [
              ['`TrustedHostMiddleware`', 'Rejects a forged `Host`.', 'A forged Host otherwise reaches the Crimson gateway\'s forwarded headers and any absolute URL built from it. Only mounted when `ALLOWED_HOSTS` is set.'],
              ['`BodyLimitMiddleware`', 'Caps the request body at 512 KB (Crimson: 32 MB).', 'Outermost so an oversized body is refused *before* anything buffers it. `/api/login` is unauthenticated and would otherwise let anonymous clients push arbitrary bodies into the single worker\'s memory.'],
              ['`MaintenanceMiddleware`', 'Serves the maintenance page, except for `/static/`, `/healthz`, `/favicon`.', 'An environment flag, not a DB setting — the case you need it for is "the database is unreachable".'],
              ['`SecurityHeadersMiddleware`', 'CSP, `nosniff`, `frame-options`, HSTS, and `cache-control: no-store` on every `/api/*`.', 'Outside Session so `Set-Cookie` is never dropped. That `no-store` is not a detail: `/api/*` answers routinely carry decrypted vault entries and TOTP recovery codes.'],
              ['`SessionMiddleware`', 'Read the signed sid from the cookie, attach the session object, write the cookie.', 'Must run before CSRF, because CSRF needs the session token.'],
              ['`CsrfMiddleware`', 'Double-submit check on every state-changing request that carries a session.', 'Innermost, right in front of the routes.']
            ]
          }
        },

        { type: 'h3', de: 'Die Content-Security-Policy', en: 'The Content Security Policy' },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — SecurityHeadersMiddleware',
          code: `directives = [
    "default-src 'self'",
    "script-src 'self'",              # KEIN 'unsafe-inline' — deshalb gibt es
    "style-src 'self' 'unsafe-inline'",  # nirgends ein inline <script>
    "font-src 'self'",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
]
if config.FORCE_HTTPS:
    directives.append("upgrade-insecure-requests")`
        },
        {
          type: 'p',
          de: '`script-src` hat **kein** `\'unsafe-inline\'`. Deshalb existiert in `templates/` kein einziges inline `<script>` — auch nicht für „nur eine Zeile". `style-src` erlaubt inline Styles, weil die Breiten der Metrik-Balken als `style`-Attribut gesetzt werden. `script-src` aufzuweichen, damit etwas bequem funktioniert, ist die eine Änderung, die hier nicht passieren darf.',
          en: '`script-src` has **no** `\'unsafe-inline\'`. That is why there is not a single inline `<script>` in `templates/` — not even for "just one line". `style-src` does allow inline styles because metric bar widths are set as `style` attributes. Loosening `script-src` to make something convenient work is the one change that must not happen here.'
        },

        { type: 'h3', de: 'Die Form jedes Fehlers', en: 'The shape of every error' },
        {
          type: 'p',
          de: 'Serverseitige Meldungen werden **nicht** auf dem Server übersetzt. Jede Fehlerantwort trägt einen stabilen `code` neben dem englischen Text; der Client löst den Code über `I18N.tError(data)` in Deutsch oder Englisch auf. Ein unbekannter Code fällt auf den englischen Text zurück — eine vergessene Übersetzung degradiert also zu Englisch statt zu einer leeren Zeile.',
          en: 'Server-side messages are **not** translated on the server. Every error response carries a stable `code` alongside the English text; the client resolves the code through `I18N.tError(data)` into German or English. An unknown code falls back to the English text, so a forgotten translation degrades to English rather than to a blank line.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py',
          code: `def fail(status: int, code: str, message: str, **extra: Any) -> JSONResponse:
    return JSONResponse({"error": message, "code": code, **extra}, status_code=status)

# Benutzung:
return fail(400, "PW_TOO_SHORT", "Password must be at least 12 characters")
# -> 400 {"error": "Password must be …", "code": "PW_TOO_SHORT"}`
        },
        {
          type: 'code',
          lang: 'javascript',
          file: 'static/js/i18n.js',
          code: `function tError(data) {
  if (!data) return t('err.INTERNAL');
  var dict = DICTS[lang] || de;
  var key = 'err.' + data.code;
  if (data.code && (dict[key] !== undefined || de[key] !== undefined)) {
    return t(key, data);
  }
  // Kein Schlüssel? Der englische Servertext ist besser als nichts.
  return data.error || t('err.INTERNAL');
}`
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Der Handler für unbehandelte Fehler sagt absichtlich nichts', en: 'The unhandled-error handler deliberately says nothing' },
          de: 'Der Ausnahmetext wird **nicht** an den Client geschickt: er enthält routinemäßig Tabellennamen, Spaltennamen und Query-Fragmente. Der Client bekommt `{"error": "Internal error", "code": "INTERNAL"}`, die Details landen im Log.',
          en: 'The exception text is **not** sent to the client: it routinely contains table names, column names and query fragments. The client gets `{"error": "Internal error", "code": "INTERNAL"}`, the detail goes to the log.'
        },

        { type: 'h3', de: 'Wer darf was', en: 'Who may do what' },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py',
          code: `def _require_session(request: Request) -> auth.Session:
    session = get_session(request)
    if not session or not session.get("user_id"):
        raise ApiError(401, "UNAUTHORIZED", "Not signed in")
    return session


def _require_admin(request: Request) -> auth.Session:
    session = _require_session(request)
    if session.get("role") != "admin":
        raise ApiError(403, "FORBIDDEN_ADMIN", "Not permitted (admin required)")
    return session`
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Es gibt keine pauschale Regel „alles unter /api ist geschützt"', en: 'There is no blanket "everything under /api is protected" rule' },
          de: 'Eine neue Route ist **öffentlich**, solange sie nicht selbst `_require_session` oder `_require_admin` aufruft. Das ist Absicht: `/api/login`, `/api/setup` und `/api/register` dürfen es nicht sein. Wer eine Route hinzufügt und den Guard vergisst, hat sie damit veröffentlicht.',
          en: 'A new route is **public** unless it calls `_require_session` or `_require_admin` itself. That is deliberate: `/api/login`, `/api/setup` and `/api/register` must not be protected. Adding a route and forgetting the guard publishes it.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'database',
      icon: 'database',
      title: { de: 'Die Datenbank', en: 'The database' },
      blocks: [
        {
          type: 'lead',
          de: 'PostgreSQL läuft als eigenständiger Container auf **zs-state-01 (192.168.0.16:5432)**, Datenbank `zer0space`, Benutzer `dashboard`. Das Dashboard hält keinen eigenen Zustand — genau deshalb darf es auf jedem Swarm-Knoten laufen statt an einen Host genagelt zu sein.',
          en: 'PostgreSQL runs as a standalone container on **zs-state-01 (192.168.0.16:5432)**, database `zer0space`, user `dashboard`. The dashboard holds no state of its own — which is exactly why it can be scheduled onto any Swarm node instead of being pinned to one host.'
        },

        { type: 'h3', de: 'Die Tabellen', en: 'The tables' },
        {
          type: 'table',
          head: { de: ['Tabelle', 'Inhalt', 'Bemerkenswert'], en: ['Table', 'Holds', 'Notable'] },
          rows: {
            de: [
              ['`users`', 'Konto, bcrypt-Hash, Rolle, Theme, Tresor-Salt, Fehlversuche, Sperren, TOTP.', 'Zwei getrennte Sperr-Spalten, siehe unten.'],
              ['`settings`', 'Schlüssel/Wert. Enthält **auch** `session_secret`, `totp_enc_key` und `ai_service_token`.', 'Deshalb gibt es eine Allowlist statt einer Denylist beim Lesen.'],
              ['`services`', 'Die Dienste-Kacheln: Name, Beschreibung, URL, Icon, Status, Kategorie.', 'Von Admins über die UI pflegbar.'],
              ['`vault_entries`', 'Titel, Benutzername, **verschlüsseltes** Passwort, **verschlüsselte** Notizen, URL.', 'Index auf `user_id`.'],
              ['`invite_codes`', 'Code, Ersteller, Ablauf, Einlöser, maximale Rolle.', 'Eingelöste Codes werden nie gelöscht — sie sind die Spur, wie ein Konto entstand.'],
              ['`login_attempts`', 'Benutzername, IP, Erfolg, Art (`login`/`register`/`2fa`), Zeitpunkt.', 'Trägt die Rate-Limits. Wird täglich nach 30 Tagen gestutzt.'],
              ['`recovery_codes`', 'bcrypt-Hash eines einmalig verwendbaren 2FA-Wiederherstellungscodes.', 'Höchstens 8 unbenutzte Zeilen pro Benutzer.'],
              ['`ai_config`, `ai_conversations`, `ai_messages`', 'Gehören dem **KI-Dienst**, nicht dem Dashboard.', 'Kein Fremdschlüssel auf `users` — siehe [KI-Assistent](#ai).']
            ],
            en: [
              ['`users`', 'Account, bcrypt hash, role, theme, vault salt, failed attempts, locks, TOTP.', 'Two separate lock columns, see below.'],
              ['`settings`', 'Key/value. **Also** holds `session_secret`, `totp_enc_key` and `ai_service_token`.', 'Which is why reads go through an allowlist, not a denylist.'],
              ['`services`', 'The service tiles: name, description, URL, icon, status, category.', 'Editable by admins through the UI.'],
              ['`vault_entries`', 'Title, username, **encrypted** password, **encrypted** notes, URL.', 'Index on `user_id`.'],
              ['`invite_codes`', 'Code, creator, expiry, redeemer, maximum role.', 'Redeemed codes are never deleted — they are the record of how an account came to exist.'],
              ['`login_attempts`', 'Username, IP, success, kind (`login`/`register`/`2fa`), timestamp.', 'Carries the rate limits. Pruned daily past 30 days.'],
              ['`recovery_codes`', 'bcrypt hash of a single-use 2FA recovery code.', 'At most 8 unused rows per user.'],
              ['`ai_config`, `ai_conversations`, `ai_messages`', 'Owned by the **AI service**, not the dashboard.', 'No foreign key to `users` — see [AI assistant](#ai).']
            ]
          }
        },

        { type: 'h3', de: 'Kein ORM, keine Migrationen', en: 'No ORM, no migrations' },
        {
          type: 'p',
          de: 'Das Schema wird bei jedem Start angelegt: `CREATE TABLE IF NOT EXISTS` plus `ADD COLUMN IF NOT EXISTS`. Es gibt kein Migrationsframework — Schemaänderungen gehen in `SCHEMA` in `db.py` und **müssen rückwärtskompatibel** zur laufenden Datenbank bleiben.',
          en: 'The schema is created on every start: `CREATE TABLE IF NOT EXISTS` plus `ADD COLUMN IF NOT EXISTS`. There is no migration framework — schema changes go into `SCHEMA` in `db.py` and **must stay backwards-compatible** with the live database.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/db.py',
          code: `async def init_schema() -> dict[str, list]:
    """Apply the schema one statement at a time and verify the result.

    Statements are executed INDIVIDUALLY, not as one multi-statement string.
    That matters more than it looks: a batch runs in an implicit transaction,
    so one failing statement silently rolls back every other statement with it.
    On a database that already has the older tables the result is confusing:
    everything that existed before keeps working, a newly added table is simply
    missing, and the only symptom is one feature returning 500.
    """
    failures: list[dict[str, str]] = []
    for stmt in _split_statements(SCHEMA):
        try:
            await execute(stmt)
        except DatabaseUnavailable:
            raise                       # die DB ist weg — Rest hat keinen Sinn
        except Exception as err:
            failures.append({"statement": stmt.splitlines()[0][:80], "message": str(err)})`
        },
        {
          type: 'note',
          tone: 'info',
          title: { de: 'Ein halb angewandtes Schema ist unsichtbar', en: 'A partially-applied schema is invisible' },
          de: 'Genau deshalb gibt es `GET /api/health/schema` (nur Admin): es vergleicht die vorhandenen Tabellen mit `REQUIRED_TABLES` und antwortet 503, wenn etwas fehlt. Ohne diese Route braucht man Shell-Zugriff auf PostgreSQL, um die Frage zu beantworten.',
          en: 'That is exactly why `GET /api/health/schema` (admin only) exists: it compares the present tables against `REQUIRED_TABLES` and answers 503 when something is missing. Without that route you need shell access to PostgreSQL to answer the question.'
        },

        { type: 'h3', de: 'Zwei bewusste Abweichungen', en: 'Two deliberate deviations' },
        {
          type: 'ul',
          de: [
            '`users.locked_until TIMESTAMPTZ` (automatisch, läuft von selbst ab) **und** `users.locked BOOLEAN` (manuell, vom Admin gesetzt, unbefristet). Ein einzelnes Boolean hieße, dass die automatische Sperre nie abläuft — und da der Admin-Benutzername ratbar ist, könnte jeder, der `/login` erreicht, das Dashboard dauerhaft lahmlegen.',
            '`login_attempts.created_at`, nicht `attempted_at`: die Spalte existiert in der Produktion bereits, mit Daten darin.'
          ],
          en: [
            '`users.locked_until TIMESTAMPTZ` (automatic, self-expiring) **and** `users.locked BOOLEAN` (manual, admin-set, indefinite). A single boolean would mean the automatic lockout never expires — and since the admin username is guessable, anyone able to reach `/login` could disable the dashboard for good.',
            '`login_attempts.created_at`, not `attempted_at`: the column already exists in production, with data in it.'
          ]
        },

        { type: 'h3', de: 'Wie Abfragen aussehen', en: 'What queries look like' },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — /api/vault/{id} (PUT)',
          code: `# user_id bleibt in der WHERE-Klausel, nicht nur in der Anwendungslogik: ein
# Benutzer kann die Zeile eines anderen nie auch nur adressieren, egal über
# welchen Codepfad. RETURNING macht Existenzprüfung und Update zu einem Statement.
row = await db.fetchrow(
    """UPDATE vault_entries
          SET title = $1, username = $2, encrypted_password = $3,
              encrypted_notes = $4, url = $5, updated_at = NOW()
        WHERE id = $6 AND user_id = $7
        RETURNING *""",
    body["title"].strip(),
    body.get("username", "").strip(),
    vault.encrypt_field(body.get("password", ""), key),
    vault.encrypt_field(body.get("notes", ""), key),
    body.get("url", "").strip(),
    eid,
    session["user_id"],
)
if not row:
    return fail(404, "ENTRY_NOT_FOUND", "Entry not found")`
        },
        {
          type: 'p',
          de: 'Alles ist async und parametrisiert (`$1`, `$2`). **SQL wird niemals per String-Verkettung gebaut.** Die einzige Ausnahme im ganzen Projekt ist ein Spaltenname im Rate-Limiter — und der ist gegen eine Allowlist geprüft:',
          en: 'Everything is async and parameterised (`$1`, `$2`). **SQL is never built by string concatenation.** The one exception in the whole project is a column name in the rate limiter — and it is checked against an allowlist:'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/auth.py',
          code: `# Ein Spaltenname kann kein Bind-Parameter sein, also wird er unten
# interpoliert — und ist deshalb auf diese Allowlist beschränkt.
_COUNTABLE_COLUMNS = {"ip", "username"}

async def _is_blocked(column: str, value: str, limit: Limit, kind: str = "login"):
    if column not in _COUNTABLE_COLUMNS:
        raise ValueError(f"illegal rate-limit column {column!r}")
    rows = await db.fetch(
        f"""SELECT created_at FROM login_attempts
             WHERE {column} = $1 AND success = FALSE AND kind = $2
             ORDER BY created_at DESC LIMIT $3""",
        value, kind, limit.max,
    )`
        },

        { type: 'h3', de: 'Wenn die Datenbank weg ist', en: 'When the database is gone' },
        {
          type: 'p',
          de: 'Das Dashboard **startet trotzdem**. Login und alle DB-gestützten Routen antworten 503, aber Metriken, die Backup-Karte und die statischen Seiten funktionieren weiter. Ein Hintergrund-Task heilt die Verbindung von selbst, sobald PostgreSQL zurück ist — ohne Container-Neustart, also ohne genau den manuellen Schritt, den man während eines Ausfalls nicht will.',
          en: 'The dashboard **boots anyway**. Login and every DB-backed route answer 503, but metrics, the backup card and the static pages keep working. A background task heals the connection on its own once PostgreSQL is back — no container restart, so not the one manual step you do not want during an outage.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/db.py',
          code: `async def retry_in_background(interval: float = 30.0) -> None:
    while True:
        await asyncio.sleep(interval)
        if is_ready():
            continue
        try:
            if _pool is None:
                if not await connect(attempts=1):
                    continue
            await init_schema()
            print("[db] PostgreSQL reachable again — schema verified, DB routes are live")
        except Exception as err:
            print(f"[db] still unreachable: {err}")`
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Der Healthcheck fasst die Datenbank absichtlich nicht an', en: 'The health check deliberately does not touch the database' },
          de: '`/healthz` prüft nur, ob der Prozess lebt. Ein Healthcheck, der bei DB-Ausfall fehlschlägt, würde Swarm dazu bringen, einen Container neu zu starten, der genau wie entworfen funktioniert.',
          en: '`/healthz` only checks that the process is alive. A health check that fails when PostgreSQL is down would have Swarm restart a container that is working exactly as designed.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'auth',
      icon: 'shield-lock',
      title: { de: 'Anmeldung und Konten', en: 'Authentication and accounts' },
      blocks: [
        {
          type: 'lead',
          de: 'Dieser Teil muss korrekt sein, damit das Dashboard aus dem Internet erreichbar sein darf, ohne dass Cloudflare Access davor steht. Er ist deshalb aus `main.py` in `src/auth.py` ausgelagert und hier vollständig beschrieben.',
          en: 'This is the part that has to be correct for the dashboard to survive being reachable from the internet without Cloudflare Access in front of it. That is why it is split out of `main.py` into `src/auth.py`, and described here in full.'
        },

        { type: 'h3', de: 'Wie ein Konto entsteht', en: 'How an account comes into existence' },
        {
          type: 'figure',
          code: {
            de: [
              '  Leere users-Tabelle',
              '        │',
              '        ▼',
              '   /setup  ──▶  erster Admin  ──▶  /setup ist für immer versiegelt',
              '                     │',
              '                     ▼',
              '            POST /api/invite  ──▶  32-Hex-Code, 1–90 Tage gültig',
              '                     │',
              '                     ▼',
              '            /register?code=…  ──▶  neues Konto (viewer oder admin)',
              '',
              '  Es gibt keinen anderen Weg. Kein DASHBOARD_USER, kein DASHBOARD_PASS,',
              '  kein vom Admin gesetztes Passwort für fremde Konten.'
            ].join('\n'),
            en: [
              '  Empty users table',
              '        │',
              '        ▼',
              '   /setup  ──▶  first admin  ──▶  /setup is sealed forever',
              '                     │',
              '                     ▼',
              '            POST /api/invite  ──▶  32 hex chars, valid 1–90 days',
              '                     │',
              '                     ▼',
              '            /register?code=…  ──▶  new account (viewer or admin)',
              '',
              '  There is no other path. No DASHBOARD_USER, no DASHBOARD_PASS, and no',
              '  admin-set password for somebody else\'s account.'
            ].join('\n')
          }
        },
        {
          type: 'p',
          de: 'Es gibt **keinen aus der Umgebung gesäten Admin**. Bei leerer `users`-Tabelle liefert das Dashboard den Einrichtungsassistenten unter `/setup`, der sich dauerhaft versiegelt, sobald das erste Konto existiert. `DASHBOARD_USER`, `DASHBOARD_PASS` und `DASHBOARD_HASH` existieren nicht — und dürfen nicht wieder eingeführt werden.',
          en: 'There is **no environment-seeded admin**. On an empty `users` table the dashboard serves the setup wizard at `/setup`, which seals itself permanently once the first account exists. `DASHBOARD_USER`, `DASHBOARD_PASS` and `DASHBOARD_HASH` do not exist — and must not be reintroduced.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — POST /api/setup',
          code: `# Die Leer-Prüfung und das INSERT laufen in EINER Transaktion mit gesperrter
# Tabelle. Zwei Operatoren, die auf einer frischen Installation gleichzeitig
# /setup aufrufen, würden sonst beide die Prüfung bestehen und beide Admin werden.
async with db.transaction() as con:
    await con.execute("LOCK TABLE users IN EXCLUSIVE MODE")
    if await con.fetchval("SELECT COUNT(*)::int FROM users") != 0:
        created = None
    else:
        created = await con.fetchrow(
            """INSERT INTO users (username, hash, role) VALUES ($1, $2, 'admin')
                RETURNING id, username, role""",
            username.strip(), hashed,
        )

if created is None:
    # Jemand hat das Rennen gewonnen, oder der Assistent wurde wiederholt.
    # Mehr als das darf der Aufrufer nicht erfahren.
    return fail(403, "SETUP_CLOSED", "Setup is already complete")`
        },
        {
          type: 'p',
          de: 'Ein Einladungscode sind 32 Hexzeichen, also **128 Bit Entropie** aus dem CSPRNG des Betriebssystems. Beim Einlösen wird die Zeile mit `FOR UPDATE` gesperrt, damit zwei Leute denselben Code nicht beide gewinnen können. Jeder Fehlschlag — Code existiert nicht, abgelaufen, schon benutzt, Benutzername vergeben — liefert **exakt dieselbe Antwort**, weil jede Unterscheidung etwas verrät.',
          en: 'An invitation code is 32 hex characters, i.e. **128 bits of entropy** from the OS CSPRNG. On redemption the row is locked `FOR UPDATE` so two people cannot both win the same code. Every failure — no such code, expired, already used, username taken — returns **exactly the same answer**, because each distinction leaks something.'
        },

        { type: 'h3', de: 'Der Anmeldevorgang', en: 'The login flow' },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — POST /api/login',
          code: `async def generic_fail() -> Response:
    # Jede Ablehnung ab hier antwortet mit demselben Body nach derselben
    # verstrichenen Zeit, damit die Antwort weder zum Aufzählen von
    # Benutzernamen noch zum Finden gesperrter Konten taugt.
    await auth.pad_timing(started)
    return fail(401, "BAD_CREDENTIALS", "Invalid credentials")

# VOR jeder Aufzeichnung geprüft: ein blockierter Aufrufer darf seine eigene
# Sperre nicht dadurch verlängern, dass er weiter auf den Endpunkt hämmert.
blocked = await auth.check_login_rate_limit(ip, username)
if blocked:
    await auth.pad_timing(started)
    return fail(429, "RATE_LIMITED", "Too many attempts. Try again later.",
                retryAfterMinutes=max(1, round(blocked / 60)))

user = await db.fetchrow("SELECT * FROM users WHERE username = $1", username)

# Die Passwortprüfung läuft auch, wenn das Konto fehlt oder gesperrt ist, damit
# alle drei Pfade genau eine bcrypt-Runde kosten.
password_ok = await auth.verify_password(password, user["hash"] if user else None)`
        },
        {
          type: 'p',
          de: 'Zwei Zeit-Details, die leicht übersehen werden. Erstens: `verify_password` prüft gegen einen **echten Dummy-Hash**, wenn der Benutzer nicht existiert — sonst wäre „kein solcher Benutzer" messbar schneller als „falsches Passwort". Zweitens: `pad_timing` hält die Antwort auf mindestens 0,4 Sekunden, damit auch die früher abbrechenden Pfade gleich lang dauern.',
          en: 'Two timing details that are easy to miss. First, `verify_password` checks against a **real dummy hash** when the user does not exist — otherwise "no such user" would be measurably faster than "wrong password". Second, `pad_timing` holds the response to at least 0.4 seconds so the paths that bail out earlier take just as long.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/auth.py',
          code: `# Ein echter bcrypt-Hash, gegen den geprüft wird, wenn es den Benutzernamen
# nicht gibt. Einmal beim Import aus einem Zufallswert erzeugt — er darf
# niemals zu einem echten Passwort passen.
_DUMMY_HASH = bcrypt.hashpw(secrets.token_hex(32).encode(), bcrypt.gensalt(BCRYPT_COST))


def _verify_sync(password: str, hashed: str | None) -> bool:
    raw = password.encode("utf-8")[:PASSWORD_MAX]
    if not hashed:
        bcrypt.checkpw(raw, _DUMMY_HASH)     # gleiche Kosten wie ein echter Vergleich
        return False
    try:
        return bcrypt.checkpw(raw, hashed.encode("utf-8"))
    except ValueError:
        bcrypt.checkpw(raw, _DUMMY_HASH)     # kaputter Hash in der DB
        return False`
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Hashing läuft immer in einem Worker-Thread', en: 'Hashing always runs in a worker thread' },
          de: 'Eine bcrypt-Runde mit Kosten 12 dauert ~250 ms. Inline ausgeführt würde sie den Event-Loop blockieren — auf einem ASGI-Server mit einem einzigen Worker ist das ein Denial-of-Service, den jeder auslösen kann, indem er den Anmeldeknopf gedrückt hält. Dasselbe gilt für die 600 000 PBKDF2-Runden des Tresors. Beides läuft über `anyio.to_thread.run_sync`.',
          en: 'A cost-12 bcrypt round takes ~250 ms. Run inline it would block the event loop — on a single-worker ASGI server that is a denial of service anyone can trigger by holding the sign-in button down. The same applies to the vault\'s 600 000 PBKDF2 rounds. Both go through `anyio.to_thread.run_sync`.'
        },

        { type: 'h3', de: 'Rate-Limits und Sperren', en: 'Rate limits and lockout' },
        {
          type: 'table',
          head: { de: ['Limit', 'Schwelle', 'Fenster', 'Sperre', 'Warum so'], en: ['Limit', 'Threshold', 'Window', 'Block', 'Why'] },
          rows: {
            de: [
              ['pro IP', '10 Fehlversuche', '15 min', '30 min', 'Die grobe Bremse gegen eine einzelne Quelle.'],
              ['pro Benutzername', '5 Fehlversuche', '10 min', '15 min', 'Enger als das IP-Limit: ein verteiltes Raten gegen ein Konto ist genau das, was die IP-Grenze nicht sieht.'],
              ['Registrierung pro IP', '3 Versuche', '60 min', '60 min', 'Ungültige Codes zählen mit, damit der 128-Bit-Raum nicht von einer Adresse aus durchsucht werden kann.'],
              ['2FA pro Benutzername', '5 falsche Codes', '5 min', '5 min', 'Ein 6-stelliger TOTP-Code hat nur ~20 Bit pro Rateversuch, nicht die Entropie eines Passworts.'],
              ['Einladungen pro Admin', '20 pro Stunde', '1 h', '—', 'Kein Brute-Force-Schutz, sondern eine Schadensbegrenzung für eine gekaperte Admin-Session.'],
              ['Kontosperre', '10 Fehlversuche **in Folge**', '—', '30 min, läuft ab', 'Unabhängig von den Zeitfenstern: greift auch, wenn jemand seine Versuche unter dem Rate-Limit taktet.']
            ],
            en: [
              ['per IP', '10 failures', '15 min', '30 min', 'The coarse brake against a single source.'],
              ['per username', '5 failures', '10 min', '15 min', 'Tighter than the IP limit: a distributed guess against one account is exactly what the IP limit cannot see.'],
              ['register per IP', '3 attempts', '60 min', '60 min', 'Invalid codes count, so the 128-bit space cannot be searched from one address.'],
              ['2FA per username', '5 wrong codes', '5 min', '5 min', 'A 6-digit TOTP code is only ~20 bits per guess, not the entropy of a password.'],
              ['invites per admin', '20 per hour', '1 h', '—', 'Not a brute-force defence, a blast-radius limit for a hijacked admin session.'],
              ['account lockout', '10 **consecutive** failures', '—', '30 min, expires', 'Independent of the sliding windows: it survives an attacker pacing attempts to stay under the rate limit.']
            ]
          }
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Die automatische Sperre läuft von selbst ab — das ist die sichere Wahl', en: 'The automatic lock expires on its own — that is the safe choice' },
          de: 'Eine dauerhafte Sperre, die nur ein Admin lösen kann, liest sich sicherer, ist es aber nicht: der Admin-Benutzername ist ratbar, also könnte jeder, der `/login` erreicht, den einzigen Admin für immer aussperren — und mit versiegeltem `/setup` gäbe es keinen Weg zurück. Wenn eine unbefristete Sperre wirklich gewollt ist, gibt es dafür das separate manuelle Flag `users.locked`. Und wenn alle Admins gleichzeitig gesperrt sind, ist `scripts/unlock-user.py` der Notausgang.',
          en: 'A permanent lock releasable only by an admin reads as safer, but it is not: the admin username is guessable, so anyone able to reach `/login` could lock the only admin out for good — and with `/setup` sealed there would be no way back in. When an indefinite lock is genuinely wanted, the separate manual `users.locked` flag does it. And when every admin is locked at once, `scripts/unlock-user.py` is the break-glass path.'
        },
        {
          type: 'p',
          de: 'Alles, was Versuche zählt, liegt in der Tabelle `login_attempts`, **nicht** in einem prozesslokalen Dict. Das ist der ganze Zweck der Tabelle: mit In-Memory-Zählern setzte jeder Container-Neustart jede Sperre zurück — ein Angreifer, der einen Neustart provozieren konnte, oder einfach auf das nächste Deployment wartete, bekam eine saubere Weste.',
          en: 'Everything that counts attempts is backed by the `login_attempts` table, **not** by a process-local dict. That is the whole point of the table: with in-memory counters, restarting the container reset every lockout — an attacker who could provoke a restart, or who simply waited for a deploy, got a clean slate.'
        },

        { type: 'h3', de: 'Welche IP zählt', en: 'Which IP counts' },
        {
          type: 'code',
          lang: 'python',
          file: 'src/auth.py',
          code: `def client_ip(request: Request) -> str:
    # Hinter dem Cloudflare-Tunnel kommt jede Anfrage vom Tunnel-Container, also
    # ist die Socket-Adresse hier nutzlos. cf-connecting-ip setzt Cloudflare.
    #
    # TRUST_PROXY allein sagt nur "lies den Header", nicht "und nur vom Tunnel" —
    # deshalb die Peer-Prüfung: ein Aufrufer, der selbst kein vertrauenswürdiger
    # Proxy ist, wird nach seiner Socket-Adresse gezählt, egal was er behauptet.
    if config.TRUST_PROXY and config.peer_is_trusted_proxy(
        request.client.host if request.client else None
    ):
        cf = request.headers.get("cf-connecting-ip")
        if cf:
            return cf.strip()[:100]
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()[:100]
    return (request.client.host if request.client else "unknown")[:100]`
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Beide Hälften sind nötig', en: 'Both halves are required' },
          de: 'Nur `TRUST_PROXY=true` ohne `TRUSTED_PROXY_IPS` heißt: jeder darf `cf-connecting-ip` setzen und sich pro Anfrage eine frische Quelladresse ausdenken — die Per-IP-Limits sind dann Zierde. Ebenso wichtig: uvicorn darf **nicht** mit `--forwarded-allow-ips \'*\'` starten, weil der ASGI-Server sonst die Socket-Adresse bereits aus einem client-gelieferten `X-Forwarded-For` überschrieben hat. Deshalb übergibt das Dockerfile das nicht mehr.',
          en: 'Just `TRUST_PROXY=true` without `TRUSTED_PROXY_IPS` means anyone may set `cf-connecting-ip` and invent a fresh source address per request — the per-IP limits are then decorative. Equally important: uvicorn must **not** be started with `--forwarded-allow-ips \'*\'`, because the ASGI server would already have overwritten the socket address from a client-supplied `X-Forwarded-For`. That is why the Dockerfile no longer passes it.'
        },

        { type: 'h3', de: 'Sessions', en: 'Sessions' },
        {
          type: 'p',
          de: 'Das Cookie `zs.sid` trägt **nichts als eine signierte Session-ID** (`itsdangerous`, `httponly`, `samesite=strict`, `secure` wenn `COOKIE_SECURE`). Die eigentliche Session liegt in einem Dict im Prozess und läuft nach `SESSION_MAX_AGE` (24 h) ab. Bei jeder Anmeldung wird die ID **neu erzeugt** — Session-Fixation: ein Angreifer, der vor dem Login ein Cookie setzen kann, hielte sonst danach eine gültige Session.',
          en: 'The `zs.sid` cookie carries **nothing but a signed session id** (`itsdangerous`, `httponly`, `samesite=strict`, `secure` when `COOKIE_SECURE`). The session itself lives in a dict in the process and expires after `SESSION_MAX_AGE` (24 h). Every login **regenerates** the id — session fixation: an attacker who can set a cookie before login would otherwise still hold a valid one afterwards.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/auth.py',
          code: `def regenerate(self, session: Session) -> Session:
    """Neue Session-ID, gleicher Inhalt."""
    self._sessions.pop(session.sid, None)
    fresh = self.create()
    fresh.data = session.data
    return fresh`
        },
        {
          type: 'p',
          de: 'Das Session-Geheimnis kann nicht bei der Konstruktion übergeben werden: der Middleware-Stack ist eingefroren, bevor der Lifespan-Handler läuft, und das Geheimnis muss unter Umständen erst aus PostgreSQL gelesen werden. `auth.SecretHolder` ist die spät gebundene Box, die das löst. Die Auflösungskette ist immer dieselbe: **Swarm-Secret-Datei → Umgebungsvariable → Zeile in `settings` → neu erzeugt und gespeichert.**',
          en: 'The session secret cannot be passed at construction time: the middleware stack is frozen before the lifespan handler runs, and the secret may have to be read out of PostgreSQL first. `auth.SecretHolder` is the late-binding box that solves this. The resolution chain is always the same: **Swarm secret file → environment variable → row in `settings` → freshly generated and stored.**'
        },

        { type: 'h3', de: 'CSRF', en: 'CSRF' },
        {
          type: 'p',
          de: 'Double-Submit: das Token liegt in der serverseitigen Session und muss im Header `X-CSRF-Token` gespiegelt werden. Es landet **nie** in einem Cookie, also kann eine fremde Seite es nicht lesen. `static/js/api.js` hängt es einmal an — ein neues POST irgendwo in der App ist damit automatisch abgedeckt.',
          en: 'Double-submit: the token lives in the server-side session and must be echoed in the `X-CSRF-Token` header. It **never** goes into a cookie, so a cross-site request cannot read it. `static/js/api.js` attaches it once — a new POST anywhere in the app is automatically covered.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/auth.py',
          code: `def csrf_ok(session: Session | None, sent: str | None) -> bool:
    expected = session.get("csrf_token") if session else None
    if not sent or not expected:
        return False
    # compare_digest auf Digests fester Länge: die Rohstrings können sich in der
    # Länge unterscheiden, was durch einen naiven Vergleich durchsickert und in
    # manchen Implementierungen sogar eine Exception wirft.
    return hmac.compare_digest(
        hashlib.sha256(sent.encode()).digest(),
        hashlib.sha256(expected.encode()).digest(),
    )`
        },
        {
          type: 'p',
          de: 'Drei Endpunkte sind ausgenommen: `/api/login`, `/api/setup`, `/api/register`. Sie laufen, bevor eine Session existiert, könnten also gar kein Token halten — und für jeden anonymen Besucher eines zu erzeugen hieße, dass ein Unauthentifizierter den Session-Speicher füllen kann. Gedeckt sind sie stattdessen durch `samesite=strict` plus ihre eigenen Rate-Limits.',
          en: 'Three endpoints are exempt: `/api/login`, `/api/setup`, `/api/register`. They run before a session exists, so they could not hold a token — and minting one for every anonymous visitor would let an unauthenticated client fill the session store. They are covered instead by `samesite=strict` plus their own rate limits.'
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Die Ausnahmeliste steht an zwei Stellen', en: 'The exempt list exists in two places' },
          de: '`CsrfMiddleware.EXEMPT` in `src/main.py` **und** `CSRF_EXEMPT` in `static/js/api.js`. Der Client scheitert bewusst geschlossen, wenn ein Token fehlt — ohne die Spiegelliste wären Anmeldung, Registrierung und Ersteinrichtung unerreichbar. Genau das ist einmal passiert; der Fehlermodus ist ein ausgesperrtes Dashboard.',
          en: '`CsrfMiddleware.EXEMPT` in `src/main.py` **and** `CSRF_EXEMPT` in `static/js/api.js`. The client deliberately fails closed when a token is missing — without the mirrored list, signing in, registering and the first-run wizard become unreachable. That has happened once; the failure mode is a locked-out dashboard.'
        },

        { type: 'h3', de: 'Wächter, die bleiben müssen', en: 'Guards that must stay' },
        {
          type: 'ul',
          de: [
            'Der **letzte Admin** kann nicht gelöscht, degradiert oder gesperrt werden. Die Prüfung und das UPDATE laufen in einer Transaktion mit `FOR UPDATE` — zwei parallele Degradierungen könnten sonst beide bestehen.',
            'Niemand kann das **eigene Konto** löschen oder sperren.',
            'Ein vom Admin erzwungener Passwort-Reset **löscht den Tresor** des Ziels. Siehe [Tresor](#vault) — das ist Absicht, kein Bug.',
            'Ein **eingelöster** Einladungscode kann nicht widerrufen werden, nur ein unbenutzter. Der eingelöste ist der Nachweis, wie ein Konto entstand.'
          ],
          en: [
            'The **last admin** cannot be deleted, demoted or locked. The check and the UPDATE run in one transaction with `FOR UPDATE` — two parallel demotions could otherwise both pass.',
            'Nobody can delete or lock **their own** account.',
            'An admin-forced password reset **wipes the target\'s vault**. See [Vault](#vault) — that is intentional, not a bug.',
            'A **redeemed** invite code cannot be revoked, only an unused one. The redeemed row is the record of how an account came to exist.'
          ]
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'twofa',
      icon: 'lock-square-rounded',
      title: { de: 'Zwei-Faktor (TOTP)', en: 'Two-factor (TOTP)' },
      blocks: [
        {
          type: 'lead',
          de: 'Optional pro Benutzer. Der interessante Teil ist nicht der TOTP-Algorithmus, sondern **wo die Grenze zwischen halb und ganz angemeldet liegt** — sie ist ein einzelnes fehlendes Feld in der Session.',
          en: 'Optional per user. The interesting part is not the TOTP algorithm but **where the boundary between half and fully signed in sits** — it is a single missing field in the session.'
        },
        {
          type: 'figure',
          code: {
            de: [
              '  POST /api/login   (Passwort korrekt, totp_enabled = true)',
              '        │',
              '        ▼',
              '   ┌────────────────────────────────────────────────────────┐',
              '   │  SCHWEBENDE SESSION                                    │',
              '   │  pending_2fa_user_id   = 42                            │',
              '   │  pending_2fa_password  = "…"   (nur bis Schritt 2)     │',
              '   │  pending_2fa_expires   = jetzt + 5 min                 │',
              '   │  user_id               = FEHLT  ◀── die ganze Grenze   │',
              '   └────────────────────────────────────────────────────────┘',
              '        │   202 {"requires_2fa": true}',
              '        ▼',
              '  POST /api/2fa/login   (6-stelliger Code ODER Wiederherstellungscode)',
              '        │',
              '        ▼',
              '   Neue Session-ID · user_id gesetzt · Tresorschlüssel abgeleitet',
              '',
              '  Jede andere /api/*-Route ruft _require_session auf, das auf user_id',
              '  prüft — die schwebende Session erreicht deshalb gar nichts sonst.'
            ].join('\n'),
            en: [
              '  POST /api/login   (password correct, totp_enabled = true)',
              '        │',
              '        ▼',
              '   ┌────────────────────────────────────────────────────────┐',
              '   │  PENDING SESSION                                       │',
              '   │  pending_2fa_user_id   = 42                            │',
              '   │  pending_2fa_password  = "…"   (only until step 2)     │',
              '   │  pending_2fa_expires   = now + 5 min                   │',
              '   │  user_id               = ABSENT ◀── the whole boundary │',
              '   └────────────────────────────────────────────────────────┘',
              '        │   202 {"requires_2fa": true}',
              '        ▼',
              '  POST /api/2fa/login   (6-digit code OR a recovery code)',
              '        │',
              '        ▼',
              '   Fresh session id · user_id set · vault key derived',
              '',
              '  Every other /api/* route calls _require_session, which keys off',
              '  user_id — so the pending session reaches nothing else at all.'
            ].join('\n')
          }
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — POST /api/login',
          code: `if user["totp_enabled"]:
    # Schritt 1 von 2 bestanden. user_id wird hier BEWUSST NICHT gesetzt:
    # _require_session (und damit jede andere /api/*-Route) hängt daran, also
    # kann diese schwebende Session nichts außer /api/2fa/login erreichen.
    # Der Tresorschlüssel wird ebenfalls noch nicht abgeleitet — das passiert
    # erst, wenn der zweite Faktor stimmt.
    session["pending_2fa_user_id"] = user["id"]
    session["pending_2fa_username"] = user["username"]
    session["pending_2fa_password"] = password   # nur bis /api/2fa/login klappt
    session["pending_2fa_expires"] = time.time() + 5 * 60
    auth.issue_csrf_token(session)
    return JSONResponse({"requires_2fa": True, "csrfToken": session["csrf_token"]},
                        status_code=202)`
        },
        {
          type: 'note',
          tone: 'info',
          title: { de: 'Warum das Klartextpasswort kurz in der Session liegt', en: 'Why the plaintext password sits in the session briefly' },
          de: 'Der Tresorschlüssel wird aus dem **Klartextpasswort** abgeleitet, und das existiert nur während der Anmeldung. Bei 2FA ist die Anmeldung auf zwei Anfragen verteilt, also muss das Passwort die Lücke überbrücken — im Serverspeicher, höchstens fünf Minuten, und es wird bei Erfolg mit `session.pop()` sofort entfernt.',
          en: 'The vault key is derived from the **plaintext password**, which only exists during login. With 2FA the login is split across two requests, so the password has to bridge the gap — in server memory, for at most five minutes, and removed with `session.pop()` the moment step two succeeds.'
        },
        {
          type: 'p',
          de: 'In Schritt 2 wird die Kontosperre **erneut** geprüft, nicht nur in Schritt 1: die schwebende Session lebt fünf Minuten, und ein Admin, der das Konto in diesem Fenster sperrt, darf nicht zurücklassen, dass der Inhaber einer halbfertigen Anmeldung sie noch abschließen kann.',
          en: 'Step two re-checks the account lock, not just step one: the pending session lives for five minutes, and an admin locking the account inside that window must not leave the holder of a half-finished login able to complete it.'
        },

        { type: 'h3', de: 'Wie das Geheimnis gespeichert wird', en: 'How the secret is stored' },
        {
          type: 'p',
          de: '`users.totp_secret` ist AES-256-GCM-verschlüsselt mit einem **separaten, serverweiten Schlüssel** (`totp_enc_key`) — bewusst nicht mit dem Tresorschlüssel. Grund: einen Code zu prüfen (oder als Admin ein verlorenes Gerät über `POST /api/users/:id/reset-2fa` zurückzusetzen) muss ohne das Klartextpasswort des Benutzers funktionieren.',
          en: '`users.totp_secret` is AES-256-GCM encrypted with a **separate, server-wide key** (`totp_enc_key`) — deliberately not the vault key. Reason: verifying a code (or an admin resetting a lost device via `POST /api/users/:id/reset-2fa`) must work without the user\'s plaintext password.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — resolve_totp_key()',
          code: `material, source = config.read_secret_source("totp_enc_key", "TOTP_ENC_KEY")
if not material:
    row = await db.fetchrow("SELECT value FROM settings WHERE key = 'totp_enc_key'")
    if row and row["value"]:
        material, source = row["value"], "database"
if not material:
    generated = secrets.token_hex(32)
    # ON CONFLICT sichert das Rennen zweier gleichzeitig startender Instanzen ab:
    # der Verlierer behält den Wert des Gewinners statt ihn zu überschreiben.
    material = await db.fetchval(
        """INSERT INTO settings (key, value) VALUES ('totp_enc_key', $1)
            ON CONFLICT (key) DO UPDATE SET value = settings.value
            RETURNING value""",
        generated,
    )
    source = "auto-generated"
print(f"[config] totp_enc_key loaded from: {source}")
return hashlib.sha256(material.encode("utf-8")).digest()`
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Ein Schlüssel aus Secret oder Umgebung wird nie zurückgeschrieben', en: 'A key from a secret or the environment is never written back' },
          de: 'Das ist genau der Bug, den diese Regel verhindert: eine alte automatisch erzeugte Zeile aus der Zeit vor dem Swarm-Secret würde beim nächsten Boot den echten, neustartsicheren Schlüssel überschreiben — und die TOTP-Geheimnisse **jedes** eingetragenen Benutzers ließen sich nicht mehr entschlüsseln. Nur ein wirklich fehlender Schlüssel wird erzeugt und gespeichert.',
          en: 'That is precisely the bug this rule guards against: a stale auto-generated row left over from before the Swarm secret existed would clobber the real, restart-surviving key on the next boot — and **every** enrolled user\'s TOTP secret would stop decrypting. Only a genuinely absent key is generated and stored.'
        },

        { type: 'h3', de: 'Ein- und ausschalten', en: 'Turning it on and off' },
        {
          type: 'table',
          head: { de: ['Route', 'Prüft Passwort?', 'Was sie tut'], en: ['Route', 'Checks password?', 'What it does'] },
          rows: {
            de: [
              ['`POST /api/2fa/setup`', '**Ja**', 'Erzeugt ein Geheimnis, legt es in die Session (noch **nicht** in die DB) und liefert QR-Code plus Klartext-Seed.'],
              ['`POST /api/2fa/verify`', 'Nein', 'Bestätigt, dass der Seed wirklich gescannt wurde. Erreichbar nur nach `setup`, das das Passwort schon geprüft hat. Erst hier landet das Geheimnis verschlüsselt in der DB.'],
              ['`POST /api/2fa/disable`', '**Ja** + gültiger Code', 'Löscht Geheimnis und alle Wiederherstellungscodes.'],
              ['`POST /api/users/:id/reset-2fa`', 'Admin-Rolle', 'Für verlorene Geräte: löscht Geheimnis und Codes, der Benutzer meldet sich normal an und kann neu einrichten.']
            ],
            en: [
              ['`POST /api/2fa/setup`', '**Yes**', 'Generates a secret, parks it in the session (**not** yet in the DB) and returns the QR code plus the plaintext seed.'],
              ['`POST /api/2fa/verify`', 'No', 'Confirms the seed was actually scanned. Only reachable after `setup`, which already checked the password. Only here does the secret reach the DB, encrypted.'],
              ['`POST /api/2fa/disable`', '**Yes** + a valid code', 'Deletes the secret and every recovery code.'],
              ['`POST /api/users/:id/reset-2fa`', 'Admin role', 'For a lost device: drops the secret and the codes, the user signs in normally and can re-enrol.']
            ]
          }
        },
        {
          type: 'p',
          de: 'Ein abgebrochenes Setup hinterlässt **keine Spur**: solange `verify` nicht bestätigt hat, steht das Geheimnis nur in der Session. Man fängt einfach neu an.',
          en: 'An abandoned setup leaves **no trace**: until `verify` confirms, the secret exists only in the session. You simply start over.'
        },

        { type: 'h3', de: 'Wiederherstellungscodes', en: 'Recovery codes' },
        {
          type: 'p',
          de: 'Acht Stück, einmalig verwendbar, **genau einmal angezeigt** — in der Antwort von `/api/2fa/verify`. Keine Route kann sie je wieder ausgeben; gespeichert werden nur bcrypt-Hashes. Die Kosten sind mit 10 niedriger als bei Passwörtern: es sind hochentropische CSPRNG-Token, keine gemerkten Geheimnisse, und pro Prüfung müssen bis zu acht davon durchgescannt werden.',
          en: 'Eight of them, single-use, **shown exactly once** — in the response of `/api/2fa/verify`. No route can ever retrieve them again; only bcrypt hashes are stored. The cost is 10 rather than 12: they are high-entropy CSPRNG tokens, not memorised secrets, and up to eight have to be scanned per verification.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/auth.py',
          code: `async def consume_recovery_code(user_id: int, code: str) -> bool:
    """Markiert einen passenden, unbenutzten Code als verbraucht."""
    normalized = normalize_recovery_code(code)
    rows = await db.fetch(
        "SELECT id, code_hash FROM recovery_codes WHERE user_id = $1 AND used_at IS NULL",
        user_id,
    )
    for row in rows:
        if await verify_recovery_code(normalized, row["code_hash"]):
            # UPDATE … WHERE used_at IS NULL macht "als benutzt markieren" atomar:
            # zwei parallele Anfragen auf denselben Code können ihn nicht beide
            # verbrauchen.
            result = await db.execute(
                "UPDATE recovery_codes SET used_at = NOW() WHERE id = $1 AND used_at IS NULL",
                row["id"],
            )
            return not result.endswith(" 0")
    return False`
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'vault',
      icon: 'key',
      title: { de: 'Der Passwort-Tresor', en: 'The password vault' },
      blocks: [
        {
          type: 'lead',
          de: 'Der empfindlichste Teil der Anwendung. Der Schlüssel jedes Benutzers wird beim Login aus seinem **Klartextpasswort** abgeleitet und liegt **nur im serverseitigen Sessionspeicher** — nie in der Datenbank, nie beim Client. Ein gestohlener Datenbank-Dump allein reicht damit nicht zum Entschlüsseln.',
          en: 'The most sensitive part of the application. Each user\'s key is derived from their **plaintext password** at login and lives **only in the server-side session** — never in the database, never sent to the client. A stolen database dump alone is therefore not enough to decrypt anything.'
        },
        {
          type: 'figure',
          code: {
            de: [
              '  Passwort (Klartext, existiert nur während des Logins)',
              '        │',
              '        │  PBKDF2-HMAC-SHA256 · 600 000 Runden · users.vault_salt',
              '        ▼',
              '  32-Byte-Schlüssel  ──▶  session["vault_key"]   (nur im Prozess)',
              '        │',
              '        │  AES-256-GCM, frischer 12-Byte-IV pro Feld',
              '        ▼',
              '  base64(iv) . base64(tag) . base64(ciphertext)   ──▶  PostgreSQL',
              '',
              '  Was NIE die Datenbank berührt:  das Passwort, der Schlüssel.',
              '  Was NIE den Browser erreicht:   der Schlüssel.'
            ].join('\n'),
            en: [
              '  Password (plaintext, exists only during login)',
              '        │',
              '        │  PBKDF2-HMAC-SHA256 · 600,000 rounds · users.vault_salt',
              '        ▼',
              '  32-byte key  ──▶  session["vault_key"]   (in process memory only)',
              '        │',
              '        │  AES-256-GCM, a fresh 12-byte IV per field',
              '        ▼',
              '  base64(iv) . base64(tag) . base64(ciphertext)   ──▶  PostgreSQL',
              '',
              '  What NEVER touches the database:  the password, the key.',
              '  What NEVER reaches the browser:   the key.'
            ].join('\n')
          }
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/vault.py',
          code: `PBKDF2_ITERATIONS = 600_000   # OWASP-Empfehlung für PBKDF2-HMAC-SHA256
KEY_LEN = 32                  # AES-256
IV_LEN  = 12                  # empfohlene GCM-Nonce-Größe
TAG_LEN = 16


def _derive_sync(password: str, salt_hex: str) -> bytes:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex),
        PBKDF2_ITERATIONS, KEY_LEN,
    )


async def derive_vault_key(password: str, salt_hex: str) -> bytes:
    """600k PBKDF2-Runden dauern ~0,3 s — also weg vom Event-Loop."""
    return await to_thread.run_sync(_derive_sync, password, salt_hex)`
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/vault.py',
          code: `def encrypt_field(plaintext: str | None, key: bytes) -> str:
    """Packt als base64(iv).base64(tag).base64(ciphertext).

    Die cryptography-Bibliothek hängt den GCM-Tag an den Ciphertext an; er wird
    hier wieder abgetrennt, damit das Format byteidentisch zu dem bleibt, was
    Nodes createCipheriv + getAuthTag erzeugt haben.
    """
    iv = os.urandom(IV_LEN)
    blob = AESGCM(key).encrypt(iv, (plaintext or "").encode("utf-8"), None)
    ciphertext, tag = blob[:-TAG_LEN], blob[-TAG_LEN:]
    b64 = lambda b: base64.b64encode(b).decode("ascii")
    return f"{b64(iv)}.{b64(tag)}.{b64(ciphertext)}"


def decrypt_field(packed: str | None, key: bytes) -> str | None:
    """Klartext, '' für ein leeres Feld, oder None bei Fehlschlag.

    None heißt konkret: der Authentifizierungs-Tag hat nicht verifiziert — also
    falscher oder rotierter Schlüssel, oder manipulierte Daten. Aufrufer zeigen
    das als undecryptable an, statt still Müll darzustellen.
    """
    if not packed:
        return ""
    parts = packed.split(".")
    if len(parts) != 3:
        return ""
    try:
        iv, tag, ciphertext = (base64.b64decode(p) for p in parts)
        return AESGCM(key).decrypt(iv, ciphertext + tag, None).decode("utf-8")
    except Exception:
        return None`
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Das Wire-Format ist ein Invariant', en: 'The wire format is an invariant' },
          de: 'Es ist byteidentisch zu dem, was die alte Node.js-Version geschrieben hat, damit bestehende Einträge ohne Migration entschlüsseln. Wer `src/vault.py` anfasst, muss genau diese Kompatibilität erhalten.',
          en: 'It is byte-identical to what the old Node.js version wrote, so existing entries decrypt without a migration. If you touch `src/vault.py`, that compatibility is the invariant to preserve.'
        },

        { type: 'h3', de: 'Passwortwechsel: die Neuverschlüsselung', en: 'Changing a password: the re-encryption' },
        {
          type: 'p',
          de: 'Ein selbst durchgeführter Passwortwechsel ist die **einzige** Stelle, an der altes und neues Klartextpasswort in derselben Anfrage vorliegen. Nur dort lässt sich der Tresor verlustfrei neu verschlüsseln. Das Salt wird dabei ebenfalls rotiert — ein frischer Schlüssel, keine Neuableitung mit demselben Salt.',
          en: 'A self-service password change is the **one** place where the old and the new plaintext password exist in the same request. Only there can the vault be re-encrypted losslessly. The salt is rotated too — a fresh key, not a re-derivation with the same salt.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — POST /api/change-password',
          code: `new_salt = vault.new_salt()
old_key = session.get("vault_key")
new_key = await vault.derive_vault_key(new_password, new_salt) if old_key else None
new_hash = await auth.hash_password(new_password)

async with db.transaction() as con:
    if new_key:
        await vault.reencrypt_all(con, user["id"], old_key, new_key)
    await con.execute(
        "UPDATE users SET hash = $1, vault_salt = $2 WHERE id = $3",
        new_hash, new_salt, user["id"],
    )

# Den Schlüssel in der Session erst tauschen, NACHDEM die Transaktion committet hat.
if new_key:
    session["vault_key"] = new_key`
        },
        {
          type: 'p',
          de: 'Neuverschlüsselung und Passwort-/Salt-Update **müssen zusammen committen**. Ein Absturz dazwischen ließe Einträge mit dem alten Schlüssel zurück, während das Salt schon auf den neuen zeigt — dauerhaft nicht entschlüsselbar.',
          en: 'The re-encryption and the password/salt update **must commit together**. A crash between them would leave entries encrypted with the old key while the salt already points at the new one — permanently undecryptable.'
        },

        { type: 'h3', de: 'Warum ein Admin-Reset den Tresor löscht', en: 'Why an admin reset wipes the vault' },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Absicht, kein Bug', en: 'Intentional, not a bug' },
          de: 'Ein Admin kennt das **alte** Klartextpasswort des Ziels nicht und kann dessen Tresorschlüssel deshalb nicht neu ableiten. Die Einträge wären nach dem Reset für immer unlesbar. Statt tote Chiffretexte liegen zu lassen, die niemand je wieder öffnen kann, löscht `PUT /api/users/:id/password` sie — und das Dialogfenster im UI sagt das ausdrücklich, bevor man bestätigt.',
          en: 'An admin never has the target\'s **old** plaintext password and therefore cannot re-derive their vault key. After the reset the entries would be unreadable forever. Rather than leaving dead ciphertext behind that nobody can ever open, `PUT /api/users/:id/password` deletes it — and the dialog in the UI says so explicitly before you confirm.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — PUT /api/users/{id}/password',
          code: `async with db.transaction() as con:
    exists = await con.fetchval("SELECT id FROM users WHERE id = $1", uid)
    if not exists:
        return fail(404, "USER_NOT_FOUND", "User not found")
    await con.execute("DELETE FROM vault_entries WHERE user_id = $1", uid)
    await con.execute(
        """UPDATE users SET hash = $1, vault_salt = $2, failed_attempts = 0,
               locked_until = NULL, locked = FALSE
            WHERE id = $3""",
        hashed, vault.new_salt(), uid,
    )
return JSONResponse({"ok": True, "vaultWiped": True})`
        },

        { type: 'h3', de: 'Was der Tresor nicht kann', en: 'What the vault cannot do' },
        {
          type: 'ul',
          de: [
            'Er ist **nicht** Ende-zu-Ende-verschlüsselt. Der Server sieht den Klartext, während er ihn ver- und entschlüsselt. Das Bedrohungsmodell ist „gestohlener Datenbank-Dump", nicht „kompromittierter Server".',
            'Wer eine aktive Session-ID stiehlt, kann bis zu 24 Stunden lang lesen. Deshalb ist `COOKIE_SECURE` standardmäßig an und deshalb sendet `/api/*` `cache-control: no-store`.',
            'Ein Neustart sperrt jeden Tresor wieder zu: der Schlüssel lag nur im Speicher. Neu anmelden entsperrt ihn, `/api/me` meldet `vaultUnlocked`.',
            'Wenn ein Feld `undecryptable` zurückkommt, wurde entweder der Schlüssel rotiert oder die Daten manipuliert. Es wird angezeigt, nicht verschwiegen.'
          ],
          en: [
            'It is **not** end-to-end encrypted. The server sees the plaintext while it encrypts and decrypts. The threat model is "stolen database dump", not "compromised server".',
            'Anyone who steals a live session id can read for up to 24 hours. That is why `COOKIE_SECURE` defaults to on and why `/api/*` sends `cache-control: no-store`.',
            'A restart re-locks every vault: the key only ever lived in memory. Signing in again unlocks it, `/api/me` reports `vaultUnlocked`.',
            'When a field comes back `undecryptable`, either the key was rotated or the data was tampered with. It is surfaced, not hidden.'
          ]
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'metrics',
      icon: 'activity-heartbeat',
      title: { de: 'Metriken, Cluster-Status und Backups', en: 'Metrics, cluster status and backups' },
      blocks: [
        {
          type: 'lead',
          de: 'Zwei völlig unabhängige Quellen: der Docker-Socket-Proxy sagt, **was der Swarm denkt**, die Glances-Agenten sagen, **wie es den Maschinen geht**. Sie werden bewusst getrennt gehalten, weil die eine ausfallen darf, ohne die andere mitzureißen.',
          en: 'Two entirely independent sources: the Docker socket proxy says **what the Swarm thinks**, the Glances agents say **how the machines are doing**. They are kept independent on purpose, because either may fail without taking the other with it.'
        },
        {
          type: 'figure',
          code: {
            de: [
              '                     ┌───────────────────────────────┐',
              '                     │  Dashboard  (src/metrics.py)  │',
              '                     └───┬───────────────────────┬───┘',
              '           /nodes        │                       │   :61208/api/4/…',
              '           /services     │                       │',
              '           /tasks        ▼                       ▼',
              '            ┌────────────────────┐   ┌──────────────────────────┐',
              '            │  socketproxy       │   │  Glances je Host         │',
              '            │  read-only         │   │  mode: global im Swarm   │',
              '            │  SERVICES/NODES/   │   │  + 2 Standalone-Hosts    │',
              '            │  TASKS = 1, Rest 0 │   │  (zs-state-01, -store-01)│',
              '            └─────────┬──────────┘   └──────────────────────────┘',
              '                      │ /var/run/docker.sock:ro',
              '                      ▼',
              '            ┌────────────────────┐',
              '            │  Manager-Knoten    │',
              '            └────────────────────┘'
            ].join('\n'),
            en: [
              '                     ┌───────────────────────────────┐',
              '                     │  Dashboard  (src/metrics.py)  │',
              '                     └───┬───────────────────────┬───┘',
              '           /nodes        │                       │   :61208/api/4/…',
              '           /services     │                       │',
              '           /tasks        ▼                       ▼',
              '            ┌────────────────────┐   ┌──────────────────────────┐',
              '            │  socketproxy       │   │  Glances per host        │',
              '            │  read-only         │   │  mode: global in Swarm   │',
              '            │  SERVICES/NODES/   │   │  + 2 standalone hosts    │',
              '            │  TASKS = 1, rest 0 │   │  (zs-state-01, -store-01)│',
              '            └─────────┬──────────┘   └──────────────────────────┘',
              '                      │ /var/run/docker.sock:ro',
              '                      ▼',
              '            ┌────────────────────┐',
              '            │  manager node      │',
              '            └────────────────────┘'
            ].join('\n')
          }
        },

        { type: 'h3', de: 'Der Docker-Socket-Proxy', en: 'The Docker socket proxy' },
        {
          type: 'p',
          de: 'Das Dashboard hält **nie** einen beschreibbaren Docker-Socket. Zwischen ihm und dem Socket steht `tecnativa/docker-socket-proxy` im Nur-Lese-Modus, bei dem exakt drei Endpunktgruppen freigeschaltet sind. Alles andere ist ausdrücklich auf 0 gesetzt statt sich auf die Standardwerte des Images zu verlassen:',
          en: 'The dashboard **never** holds a writable Docker socket. Between it and the socket sits `tecnativa/docker-socket-proxy` in read-only mode with exactly three endpoint groups enabled. Everything else is explicitly set to 0 rather than relying on the image\'s defaults:'
        },
        {
          type: 'code',
          lang: 'yaml',
          file: 'docker-compose.yml — socketproxy',
          code: `environment:
  - SERVICES=1
  - NODES=1
  - TASKS=1
  - CONTAINERS=0
  - IMAGES=0
  - NETWORKS=0
  - VOLUMES=0
  - AUTH=0
  - POST=0          # keine schreibenden Aufrufe, überhaupt keine
  - SECRETS=0
  - CONFIGS=0
  - SWARM=0
  - EXEC=0
  - SYSTEM=0
  - INFO=0
  - ALLOW_RESTARTS=0
security_opt:
  - no-new-privileges:true`
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Dieses Image gehört gepinnt', en: 'This image should be pinned' },
          de: 'Seine ganze Aufgabe ist es, zwischen einem Angreifer und Host-Root auf einem Manager-Knoten zu stehen. Ein ungetaggtes Image löst sich zu `:latest` auf — ein Release, das eine Endpunktgruppe hinzufügt oder einen Standard ändert, würde also verändern, was der Docker-Socket preisgibt, **ohne dass sich in der Compose-Datei etwas ändert**.',
          en: 'Its whole job is to stand between an attacker and host root on a manager node. An untagged image resolves to `:latest`, so a release that adds an endpoint group or changes a default would change what the Docker socket exposes **with no diff in the compose file at all**.'
        },

        { type: 'h3', de: 'Glances', en: 'Glances' },
        {
          type: 'p',
          de: 'Glances läuft `mode: global`, also auf jedem Swarm-Knoten, und veröffentlicht Port 61208 im **Host-Modus** — nicht über das Ingress-Mesh. Das ist der Grund, warum das Dashboard jeden Knoten unter seiner LAN-Adresse erreicht: `Status.Addr` aus `/nodes` ist die stabile Adresse, kein Overlay-IP und kein DNS-Lookup.',
          en: 'Glances runs `mode: global`, so on every Swarm node, and publishes port 61208 in **host mode** — not through the ingress mesh. That is why the dashboard reaches each node at its LAN address: `Status.Addr` from `/nodes` is the stable address, no overlay IP and no DNS lookup involved.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/metrics.py',
          code: `async def poll_host(hostname, addr, label=None) -> dict[str, Any]:
    """Der volle Metriksatz eines Hosts.

    Wird von Swarm-Knoten UND Standalone-Hosts benutzt, damit die beiden nie
    auseinanderdriften können — das Frontend rendert sie mit derselben Karte,
    und ein Unterschied hier zeigte sich als halbleere Karte.
    """
    if not addr:
        return {"hostname": hostname, "label": label, "online": False}
    try:
        system, cpu, mem, fs_data, network = await asyncio.gather(
            _glances(addr, "system"), _glances(addr, "cpu"), _glances(addr, "mem"),
            _glances(addr, "fs"), _glances(addr, "network"),
        )
        ...
    except Exception:
        print(f"[metrics] OFFLINE {hostname} ({addr})")
        return {"hostname": hostname, "label": label, "addr": addr, "online": False}`
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Port 61208 ist unauthentifiziert', en: 'Port 61208 is unauthenticated' },
          de: '`glances -w` läuft hier ohne Benutzername und Passwort. Wer TCP/61208 auf einem Knoten erreicht, liest die vollständige Prozessliste dieses Hosts inklusive Kommandozeilen, Mounts, Schnittstellen und Benutzer — ohne jede Anmeldung. Der Port lässt sich nicht einfach schließen (das Dashboard braucht ihn), also **muss er auf jedem Knoten per Firewall auf das LAN beschränkt werden**. Zusätzlich ist der Docker-Socket-Mount aus diesem Container bewusst entfernt: `:ro` auf einem Unix-Socket macht nur die Inode schreibgeschützt, die API dahinter bleibt voll schreibbar — bei `mode: global` wäre das Host-Root auf jedem Knoten.',
          en: '`glances -w` runs here with no username and no password. Anything that can reach TCP/61208 on a node reads that host\'s full process list including argv, mounts, interfaces and users, with no credentials. The port cannot simply be dropped (the dashboard needs it), so it **must be restricted to the LAN by a firewall on every node**. Additionally the Docker socket mount was deliberately removed from this container: `:ro` on a unix socket only makes the inode read-only, the API behind it stays fully read-write — with `mode: global` that would be host root on every node.'
        },

        { type: 'h3', de: 'Standalone-Hosts', en: 'Standalone hosts' },
        {
          type: 'p',
          de: '`zs-state-01` (PostgreSQL) und `zs-store-01` (NFS) sind keine Swarm-Mitglieder, tauchen also nie in `/nodes` auf — und blieben früher unüberwacht. Das ist verkehrt herum: Datenbank und Speicher sind die beiden Hosts, deren Ausfall alles andere mitnimmt.',
          en: '`zs-state-01` (PostgreSQL) and `zs-store-01` (NFS) are not Swarm members, so they never appear in `/nodes` — and used to go unmonitored. That is backwards: the database and the shared storage are the two hosts whose failure takes everything else with them.'
        },
        {
          type: 'code',
          lang: 'text',
          file: 'Format von EXTRA_HOSTS',
          code: `EXTRA_HOSTS=name:ip[:label],name:ip[:label]

# Beispiel aus docker-compose.yml:
EXTRA_HOSTS=zs-state-01:192.168.0.16:Stateful,zs-store-01:192.168.0.15:Storage

# Ein fehlerhafter Eintrag wird geloggt und übersprungen, nicht geworfen:
# ein Tippfehler in einer Umgebungsvariablen darf nicht die ganze Liste
# kosten und schon gar nicht das Dashboard beim Start umbringen.`
        },
        {
          type: 'p',
          de: 'Wichtig ist die Reihenfolge im Code: der Poll der Standalone-Hosts **startet vor** dem Docker-Proxy-Aufruf und überlebt dessen Scheitern. Genau darum geht es — wenn der Swarm in Schwierigkeiten ist, sind Datenbank- und Speicher-Host die, die man erst recht sehen will.',
          en: 'The ordering in the code matters: the standalone poll **starts before** the Docker proxy call and survives it failing. That is the whole point — when the Swarm is in trouble, the database and storage hosts are precisely the ones you still want to see.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/metrics.py — collect()',
          code: `extra_task = asyncio.ensure_future(poll_extra_hosts())   # zuerst gestartet

try:
    snap = snapshot if snapshot is not None else await swarm_snapshot()
except Exception as err:
    print(f"[metrics] docker proxy unavailable: {err}")
    return {
        "nodes": [],
        "extraHosts": await extra_task,     # … und trotzdem geliefert
        "swarm": None,
        "error": "PROXY_UNAVAILABLE",
    }`
        },

        { type: 'h3', de: 'Die fünf Status-Kacheln', en: 'The five status tiles' },
        {
          type: 'p',
          de: 'Sie werden **serverseitig** berechnet, nicht im Browser. Jede von ihnen ist ein „X von Y", und jede war irgendwann falsch, weil zwei Ansichten es unterschiedlich gezählt haben. Jetzt gibt es genau eine Implementierung, und Dashboard wie Monitoring-Wand lesen dieselbe.',
          en: 'They are computed **server-side**, not in the browser. Each of them is an X-of-Y, and each was wrong at some point because two views counted it differently. There is now exactly one implementation, and both the dashboard and the monitoring wall read it.'
        },
        {
          type: 'table',
          head: { de: ['Kachel', 'Zählt', 'Zustände'], en: ['Tile', 'Counts', 'States'] },
          rows: {
            de: [
              ['Knoten online', 'Swarm-Mitglieder, die **Glances beantworten**, gegen die Gesamtzahl der Mitglieder.', 'Ein Knoten, der in Docker `ready` ist, dessen Glances-Agent aber tot ist, gilt hier als nicht online — es gibt keine Metriken für ihn.'],
              ['Dienste', 'Anzahl der Swarm-Dienste.', '`unknown`, wenn der Proxy nicht antwortet.'],
              ['Cluster', 'Manager-Erreichbarkeit und Leader.', '`critical` ohne Leader, `warning` bei unerreichbarem Manager oder nicht-`ready`-Knoten, sonst `healthy`.'],
              ['Infrastruktur', 'Standalone-Hosts online / gesamt.', 'Wie „Knoten online", aber für die zwei Hosts außerhalb.'],
              ['Backup', 'Jüngster Lauf über alle Knoten.', '`ok` / `stale` (älter als 26 h) / `failed` / `unknown`.']
            ],
            en: [
              ['Nodes online', 'Swarm members **answering Glances**, against the total number of members.', 'A node that is `ready` in Docker but whose Glances agent is down is not online here — we have no metrics for it.'],
              ['Services', 'Number of Swarm services.', '`unknown` when the proxy does not answer.'],
              ['Cluster', 'Manager reachability and leader.', '`critical` with no leader, `warning` for an unreachable manager or a non-`ready` node, otherwise `healthy`.'],
              ['Infrastructure', 'Standalone hosts online / total.', 'Like "nodes online", but for the two outside hosts.'],
              ['Backup', 'Most recent run across all nodes.', '`ok` / `stale` (older than 26 h) / `failed` / `unknown`.']
            ]
          }
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/metrics.py',
          code: `if swarm is None:
    cluster_state, cluster_detail = "unknown", "PROXY_UNAVAILABLE"
elif swarm["managersTotal"] == 0:
    cluster_state, cluster_detail = "unknown", "NO_MANAGERS"
elif not swarm["hasLeader"]:
    cluster_state, cluster_detail = "critical", "NO_LEADER"
elif swarm["managersReachable"] < swarm["managersTotal"]:
    cluster_state, cluster_detail = "warning", "MANAGER_UNREACHABLE"
elif swarm["nodesReady"] < swarm["nodesTotal"]:
    cluster_state, cluster_detail = "warning", "NODE_DOWN"
else:
    cluster_state, cluster_detail = "healthy", "ALL_REACHABLE"`
        },

        { type: 'h3', de: 'Backup-Status', en: 'Backup status' },
        {
          type: 'p',
          de: 'Das Backup-Skript auf jedem Knoten legt eine JSON-Datei in `/data/backup-status/` im gemeinsamen NFS ab; das Dashboard liest das Verzeichnis. Das liegt bewusst **nicht** in PostgreSQL: der Erzeuger ist ein Shell-Skript, das sonst auf jedem Knoten einen psql-Client und Datenbank-Zugangsdaten bräuchte. Ein Dateiabwurf ist der einfachere Vertrag dafür.',
          en: 'The backup script on each node drops a JSON file into `/data/backup-status/` on the shared NFS; the dashboard reads the directory. This deliberately does **not** live in PostgreSQL: the producer is a shell script that would otherwise need a psql client and database credentials on every node. A file drop is the simpler contract for that.'
        },
        {
          type: 'p',
          de: 'Ein Lauf gilt nach **26 Stunden** als veraltet, nicht nach 24 — damit ein nächtlicher Job, der eine Stunde später kommt, die Kachel nicht anzündet. Eine halb geschriebene oder kaputte Datei wird übersprungen, nicht als Fehler gewertet.',
          en: 'A run counts as stale after **26 hours**, not 24 — so a nightly job running an hour late does not light up the tile. A half-written or malformed file is skipped rather than counted as a failure.'
        },

        { type: 'h3', de: 'Die Monitoring-Wand', en: 'The monitoring wall' },
        {
          type: 'p',
          de: '`/monitoring` ist eine abgespeckte Dauer-Ansicht für ein Wanddisplay oder ein Kiosk-iPad: kein Chibi, kein Starfield, große Kacheln, Uhr, Vollbild-Knopf. Sie liegt hinter **derselben Session-Schranke** wie das Dashboard, weil sie `/api/overview` liest und das die interne Topologie preisgibt. Ein Kiosk bleibt für die Lebensdauer der Session (24 h) angemeldet und braucht erst nach einem Neustart wieder einen Login.',
          en: '`/monitoring` is a stripped-down always-on view for a wall display or a kiosk iPad: no chibi, no starfield, big tiles, a clock, a fullscreen button. It sits behind the **same session gate** as the dashboard, because it reads `/api/overview` and that discloses internal topology. A kiosk stays signed in for the session\'s lifetime (24 h) and needs a fresh login only after a restart.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'frontend',
      icon: 'brush',
      title: { de: 'Frontend und Design', en: 'Frontend and design' },
      blocks: [
        {
          type: 'lead',
          de: 'Kein Framework, kein Bundler, kein Build-Schritt. `static/` wird ausgeliefert, wie es ist — die ausgelieferte Datei ist byteweise die Datei im Git. Das ist Absicht und macht das Debuggen im Browser zum Debuggen der Quelle.',
          en: 'No framework, no bundler, no build step. `static/` is served as-is — the served file is byte-for-byte the file in git. That is deliberate, and it makes debugging in the browser the same thing as debugging the source.'
        },

        { type: 'h3', de: 'Ladereihenfolge', en: 'Load order' },
        {
          type: 'figure',
          code: {
            de: [
              '  <head>',
              '    main.css            Design-System (Tokens, Glas, Buttons, …)',
              '    <Seiten>.css        genau eine Seiten-Stildatei danach',
              '    boot.js   (defer)   Theme VOR dem ersten Paint anwenden',
              '  <body>',
              '    …Markup…',
              '    i18n.js             definiert window.t und window.I18N  ← ohne defer!',
              '    ui.js     (defer)   window.ZS_UI: Modals, Kopieren, esc, safeUrl',
              '    starfield.js (defer)',
              '    chibi.js  (defer)',
              '    <Seitenskript> (defer)  app.js | monitoring.js | docs.js | …'
            ].join('\n'),
            en: [
              '  <head>',
              '    main.css            design system (tokens, glass, buttons, …)',
              '    <page>.css          exactly one page stylesheet after it',
              '    boot.js   (defer)   apply the theme BEFORE the first paint',
              '  <body>',
              '    …markup…',
              '    i18n.js             defines window.t and window.I18N  ← no defer!',
              '    ui.js     (defer)   window.ZS_UI: modals, copy, esc, safeUrl',
              '    starfield.js (defer)',
              '    chibi.js  (defer)',
              '    <page script> (defer)  app.js | monitoring.js | docs.js | …'
            ].join('\n')
          }
        },
        {
          type: 'p',
          de: '`i18n.js` **muss vor jedem Seitenskript geladen sein**, weil alle auf `window.t` und `window.I18N` zugreifen. `boot.js` liegt im `<head>`, damit die Seite nicht einen Frame lang in der Standard-Akzentfarbe und in der falschen Sprache rendert und dann umspringt.',
          en: '`i18n.js` **must load before any page script**, because they all rely on `window.t` and `window.I18N`. `boot.js` sits in the `<head>` so the page does not render one frame in the default accent and the wrong language and then snap.'
        },
        {
          type: 'table',
          head: { de: ['Globale Fläche', 'Was drin ist'], en: ['Global surface', 'What it holds'] },
          rows: {
            de: [
              ['`window.I18N` / `window.t`', '`t(key, vars)`, `tError(data)`, `applyI18n(root)`, `setLang(next)`, `checkParity()`, `lang`.'],
              ['`window.API`', '`get/post/put/del`, `setCsrfToken`, `ApiError` mit `.code`, `.status`, `.message`.'],
              ['`window.ZS_UI`', '`openModal`, `closeModal`, `copy`, `copyWithFeedback`, `bytes`, `rate`, `percent`, `dateTime`, `relative`, **`esc`**, **`safeUrl`**.'],
              ['`window.ZS_THEME`', '`presets`, `apply`, `save`, `current`.'],
              ['`window.ZS_DOCS`', 'Der Inhalt dieser Seite als Daten.']
            ],
            en: [
              ['`window.I18N` / `window.t`', '`t(key, vars)`, `tError(data)`, `applyI18n(root)`, `setLang(next)`, `checkParity()`, `lang`.'],
              ['`window.API`', '`get/post/put/del`, `setCsrfToken`, `ApiError` with `.code`, `.status`, `.message`.'],
              ['`window.ZS_UI`', '`openModal`, `closeModal`, `copy`, `copyWithFeedback`, `bytes`, `rate`, `percent`, `dateTime`, `relative`, **`esc`**, **`safeUrl`**.'],
              ['`window.ZS_THEME`', '`presets`, `apply`, `save`, `current`.'],
              ['`window.ZS_DOCS`', 'The content of this page, as data.']
            ]
          }
        },

        { type: 'h3', de: 'Escaping ist nicht optional', en: 'Escaping is not optional' },
        {
          type: 'p',
          de: 'Alles, was in `innerHTML` landet, geht durch `ZS_UI.esc()`, und jedes `href` durch `ZS_UI.safeUrl()`. Dienstnamen, Hostnamen und Tresor-Titel sind benutzergesteuert — und die Spalten Benutzername und IP in der Audit-Tabelle kann **jeder anonyme Besucher** beschreiben, indem er eine Anmeldung fehlschlagen lässt. Die CSP blockt inline `<script>`, aber nicht `<img onerror>`.',
          en: 'Everything that reaches `innerHTML` goes through `ZS_UI.esc()`, and every `href` through `ZS_UI.safeUrl()`. Service names, hostnames and vault titles are user-controlled — and the username and IP columns in the audit table can be written by **any anonymous visitor** simply by failing a login. The CSP blocks inline `<script>`, but not `<img onerror>`.'
        },
        {
          type: 'code',
          lang: 'javascript',
          file: 'static/js/ui.js',
          code: `/* VERTRAG: nur HTML-Text und QUOTIERTE Attributkontexte. Beide Anführungs-
   zeichen werden escaped, attr="…" und attr='…' sind also beide sicher. NICHT
   sicher für ein unquotiertes Attribut, KEIN JavaScript-Escaper, KEIN CSS-
   Escaper. Jedes Attribut in diesem Projekt ist doppelt quotiert — das muss so
   bleiben. */
function esc(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}`
        },
        {
          type: 'code',
          lang: 'javascript',
          file: 'static/js/ui.js',
          code: `function safeUrl(value) {
  var raw = String(value || '').trim();
  if (!raw) return '';
  /* Alles geht durch den URL-Parser. Es gab mal einen Schnellpfad, der jeden
     String zurückgab, der mit einem einzelnen "/" beginnt — angeblich
     seitenrelativ. Ist er nicht: die URL-Spezifikation behandelt "\\" in den
     Authority-States wie "/", also löst "/\\evil.com" in jedem großen Browser
     zu http://evil.com/ auf und besteht dabei einen /^\\// -Test. */
  try {
    var parsed = new URL(raw, window.location.origin);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : '';
  } catch (err) {
    return '';
  }
}`
        },

        { type: 'h3', de: 'Zweisprachigkeit: drei Stellen bewegen sich zusammen', en: 'Bilingual: three places move together' },
        {
          type: 'ul',
          numbered: true,
          de: [
            'Den Schlüssel in **beide** Wörterbücher in `static/js/i18n.js` eintragen. Sie werden auf exakter Parität gehalten — ein Schlüssel in einem und nicht im anderen ist ein Fehler, und `I18N.checkParity()` sagt das in der Konsole.',
            'Im Markup den Schlüssel in ein Attribut schreiben statt Text fest zu verdrahten: `data-i18n` (textContent), `data-i18n-ph` (placeholder), `data-i18n-title`, `data-i18n-aria`, `data-i18n-alt`. Der deutsche Text bleibt als Vor-JS-Standard im Element stehen.',
            'In JavaScript `t(\'key\')` aufrufen — nie ein Literal. `t(\'key\', { name })` füllt `{name}`-Platzhalter.'
          ],
          en: [
            'Add the key to **both** dictionaries in `static/js/i18n.js`. They are kept at exact parity — a key in one and not the other is a bug, and `I18N.checkParity()` says so in the console.',
            'In markup, put the key in an attribute rather than hardcoding text: `data-i18n` (textContent), `data-i18n-ph` (placeholder), `data-i18n-title`, `data-i18n-aria`, `data-i18n-alt`. The German text stays inside the element as the pre-JS default.',
            'In JavaScript call `t(\'key\')` — never a literal. `t(\'key\', { name })` fills `{name}` style placeholders.'
          ]
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'In JavaScript gebautes Markup erreicht applyI18n() nicht', en: 'Markup built in JavaScript is out of applyI18n()\'s reach' },
          de: 'Host-Karten, Dienste-Kacheln, Tresor-Einträge, Admin-Tabellen und diese Docs-Seite tragen keine `data-i18n`-Attribute. Sie zeichnen sich beim Ereignis `languagechange:zs` neu — der Listener am Ende von `app.js` beziehungsweise `render()` in `docs.js`. Wer eine weitere JS-gerenderte Ansicht baut, muss den Listener erweitern. Eine Ausnahme mit Absicht: `#greeting` hat bewusst **kein** `data-i18n`, weil `app.js` dort eine personalisierte Tageszeit-Begrüßung hineinschreibt, die `applyI18n()` sonst überschreiben würde.',
          en: 'Host cards, service tiles, vault entries, admin tables and this docs page carry no `data-i18n` attributes. They redraw on the `languagechange:zs` event — the listener at the bottom of `app.js`, or `render()` in `docs.js`. Adding another JS-rendered view means extending that listener. One deliberate exception: `#greeting` has **no** `data-i18n`, because `app.js` fills it with a personalised time-of-day greeting that `applyI18n()` would otherwise overwrite.'
        },
        {
          type: 'p',
          de: 'Die gewählte Sprache liegt in `localStorage` (`zs-lang`) — eine Anzeigepräferenz pro Browser, bewusst keine Datenbankspalte. Umschalten braucht dadurch keinen Roundtrip und keine Schemaänderung.',
          en: 'The chosen language lives in `localStorage` (`zs-lang`) — a per-browser display preference, deliberately not a database column. Switching therefore needs no round trip and no schema change.'
        },

        { type: 'h3', de: 'Das Design-System', en: 'The design system' },
        {
          type: 'p',
          de: 'Fast-Schwarz-Marineblau, **eine** gesättigte Akzentfarbe, Milchglas-Panels über einem Canvas-Sternenfeld, und May (das Maskottchen) als einzige warme Farbe auf der Seite. Der Clou: alles Getönte wird per `color-mix` aus `--accent` abgeleitet — der Themepicker färbt die gesamte Oberfläche um, indem er **eine einzige Variable** schreibt.',
          en: 'Near-black navy, **one** saturated accent, frosted-glass panels over a canvas starfield, and May (the mascot) as the only warm colour on the page. The trick: everything tinted is derived from `--accent` with `color-mix`, so the theme picker recolours the whole UI by writing **a single variable**.'
        },
        {
          type: 'code',
          lang: 'css',
          file: 'static/css/main.css',
          code: `:root {
  --accent: #2f7dfb;
  --accent-soft: color-mix(in srgb, var(--accent) 18%, transparent);
  --accent-line: color-mix(in srgb, var(--accent) 42%, transparent);
  --accent-glow: color-mix(in srgb, var(--accent) 30%, transparent);

  /* Nicht reines Schwarz — die Markenkunst sitzt in sehr dunklem Blau, und
     echtes Schwarz daneben liest sich wie ein Loch in der Seite.
     Jeder Grundton trägt ein paar Prozent des Akzents, damit ein Umschalten
     auf Rot keine blau-schwarze Seite unter rotem Schein zurücklässt. */
  --bg:   color-mix(in srgb, var(--accent)  5%, #04070e);
  --bg-2: color-mix(in srgb, var(--accent)  7%, #070c17);
  --bg-3: color-mix(in srgb, var(--accent)  8%, #0b1220);

  --glass:   color-mix(in srgb, var(--accent) 6%, rgba(13, 20, 36, 0.62));
  --border:  color-mix(in srgb, var(--accent) 20%, rgba(150, 170, 210, 0.12));
}

:root[data-theme="aurora"] { --accent: #2f7dfb; }
:root[data-theme="cyan"]   { --accent: #22c3d6; }
:root[data-theme="violet"] { --accent: #8b5cf6; }
:root[data-theme="ember"]  { --accent: #f97316; }
:root[data-theme="mint"]   { --accent: #22c58b; }
:root[data-theme="rose"]   { --accent: #f43f7e; }`
        },
        {
          type: 'p',
          de: 'Die Glas-Panels bekommen ihre Wirkung von einer **einzelnen Pixelzeile** Licht an der Oberkante (`.glass::before`) — ohne sie liest sich das Ganze als flaches, halbtransparentes Rechteck. Für Browser ohne `backdrop-filter` gibt es einen `@supports not`-Zweig mit deckendem Hintergrund; sonst säße der Text direkt auf der Illustration.',
          en: 'The glass panels get their effect from a **single pixel row** of light along the top edge (`.glass::before`) — without it the whole thing reads as a flat translucent rectangle. For browsers without `backdrop-filter` there is an `@supports not` branch with an opaque background; otherwise the text would sit directly on the artwork.'
        },
        {
          type: 'ul',
          de: [
            'Die Artwork-Originale liegen in **`zer0space-docs/may (mascot)/`**. `static/img/` hält nur web-große Ableitungen — neu generieren statt hier bearbeiten.',
            'Der Chibi-Begleiter ist rein dekorativ: `aria-hidden`, `tabindex="-1"`, wegklickbar, und der Zustand wird gemerkt. Er darf **nie** zwischen einem Benutzer und einem Formular sitzen.',
            'Das Sternenfeld ist ein Canvas und respektiert `prefers-reduced-motion` — bei aktivierter Einstellung verschwindet es ganz, zusammen mit allen Animationen.',
            'Die Dienst-Icons kommen aus dem **vendorten** Tabler-Webfont. Ein CDN wäre durch die CSP blockiert; der Iconname ist ein sicherer Slug `[a-z0-9-]` und wird zu einer Klasse `ti ti-<name>`, nie zu Markup.'
          ],
          en: [
            'The original artwork lives in **`zer0space-docs/may (mascot)/`**. `static/img/` holds web-sized derivatives only — regenerate them rather than editing them here.',
            'The chibi companion is purely decorative: `aria-hidden`, `tabindex="-1"`, dismissible, and its state is remembered. It must **never** sit between a user and a form.',
            'The starfield is a canvas and honours `prefers-reduced-motion` — with that setting on it disappears entirely, along with every animation.',
            'The service icons come from the **vendored** Tabler webfont. A CDN would be blocked by the CSP; the icon name is a safe `[a-z0-9-]` slug and becomes a `ti ti-<name>` class, never markup.'
          ]
        },
        {
          type: 'note',
          tone: 'info',
          title: { de: 'Nach jeder CSS-/JS-Änderung: ASSET_VERSION erhöhen', en: 'After any CSS/JS change: bump ASSET_VERSION' },
          de: 'Weil es keinen Build und damit keine Content-Hashes gibt, hängen die Templates `?v={{ asset_version }}` an jede CSS- und JS-URL. Genau das macht es sicher, die Dateien mit langem `max-age` auszuliefern. `ASSET_VERSION` steht oben in `src/main.py`.',
          en: 'Because there is no build and therefore no content hashes, the templates append `?v={{ asset_version }}` to every CSS and JS URL. That is what makes it safe to serve them with a long `max-age`. `ASSET_VERSION` sits at the top of `src/main.py`.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'ai',
      icon: 'robot',
      title: { de: 'Der KI-Assistent', en: 'The AI assistant' },
      blocks: [
        {
          type: 'lead',
          de: 'Ein eigener Dienst (`zer0space-ai`), der Fragen über den Cluster beantwortet — **mit dessen echtem Zustand vor sich**. Er spricht mit Anthropic, OpenAI, Gemini oder einem lokalen Ollama, und welcher es ist, ist ein Dropdown im Dashboard, keine Zeile in einer Compose-Datei.',
          en: 'A separate service (`zer0space-ai`) that answers questions about the cluster — **with the cluster\'s actual state in front of it**. It talks to Anthropic, OpenAI, Gemini or a local Ollama, and which one is a dropdown in the dashboard rather than a line in a compose file.'
        },
        {
          type: 'figure',
          code: {
            de: [
              '  Browser',
              '     │  Session-Cookie, CSRF-Token',
              '     ▼',
              '  zer0space-dashboard   (FastAPI, replicas: 1)',
              '     │  src/ai.py: Session-Schranke, dann Proxy',
              '     │  X-Zer0space-Ai-Token + Identitäts-Header des Aufrufers',
              '     │  im Body reist der Cluster-Snapshot mit',
              '     ▼',
              '  zer0space-ai          (FastAPI, replicas: N)',
              '     ├──▶ PostgreSQL     ai_config, ai_conversations, ai_messages',
              '     └──▶ Anthropic | OpenAI | Gemini | Ollama'
            ].join('\n'),
            en: [
              '  browser',
              '     │  session cookie, CSRF token',
              '     ▼',
              '  zer0space-dashboard   (FastAPI, replicas: 1)',
              '     │  src/ai.py: session gate, then proxy',
              '     │  X-Zer0space-Ai-Token + caller identity headers',
              '     │  the cluster snapshot rides along in the body',
              '     ▼',
              '  zer0space-ai          (FastAPI, replicas: N)',
              '     ├──▶ PostgreSQL     ai_config, ai_conversations, ai_messages',
              '     └──▶ Anthropic | OpenAI | Gemini | Ollama'
            ].join('\n')
          }
        },

        { type: 'h3', de: 'Warum überhaupt ein zweiter Dienst?', en: 'Why a second service at all?' },
        {
          type: 'p',
          de: 'Die Trennung ist der Punkt. Das Dashboard hängt bei `replicas: 1` fest, weil sein Session-Speicher Tresorschlüssel im Prozessspeicher hält. Der KI-Dienst hält **nichts**, also darf er skalieren. Und eine langsam streamende Antwort belegt so nicht den einzigen Dashboard-Worker für die Dauer eines Modellaufrufs.',
          en: 'The split is the point. The dashboard is stuck at `replicas: 1` because its session store holds vault keys in process memory. The AI service holds **nothing**, so it can scale. And a slowly streaming answer therefore does not occupy the single dashboard worker for the duration of a model call.'
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Dieser Dienst darf von außen nicht erreichbar sein', en: 'This service must stay unreachable from outside' },
          de: 'Er authentifiziert **keine Benutzer**. Er authentifiziert das Dashboard mit einem geteilten Token und vertraut den Identitäts-Headern, die das Dashboard mitschickt. Das ist nur tragfähig, solange nichts anderes ihn erreicht. Also: **kein `ports:`-Eintrag, kein Ingress, keine Tunnel-Route.** Sollte er je erreichbar werden müssen, braucht er vorher echte Session-Prüfung — nicht strengeres Header-Parsing.',
          en: 'It authenticates **no users**. It authenticates the dashboard with a shared token and trusts the identity headers the dashboard forwards. That is sound only while nothing else can reach it. So: **no `ports:` entry, no ingress, no tunnel route.** If it ever needs to be reachable, it needs real session verification first, not stricter header parsing.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/ai.py (Dashboard)',
          code: `def _headers(session: Any, extra: dict[str, str] | None = None) -> dict[str, str]:
    """Auth für den KI-Dienst plus die Aufrufer-Identität, der er vertraut.

    Die Identität kommt aus der serverseitigen Session, nie aus irgendetwas, das
    der Browser geschickt hat. Genau das macht es für den KI-Dienst sicher, diese
    Header als maßgeblich zu behandeln.
    """
    headers = {
        config.AI_TOKEN_HEADER: _token,
        "x-zer0space-user-id": str(session.get("user_id")),
        "x-zer0space-user-name": str(session.get("username") or ""),
        "x-zer0space-user-role": str(session.get("role") or "viewer"),
        "content-type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers`
        },

        { type: 'h3', de: 'Der Cluster-Snapshot reist mit', en: 'The cluster snapshot travels along' },
        {
          type: 'p',
          de: 'Das Dashboard pollt ohnehin den Docker-Socket-Proxy und die Glances-Agenten und leitet die Status-Kacheln serverseitig ab — genau damit zwei Ansichten sich nicht über ein „X von Y" streiten können. Diesen Snapshot schickt es mit der Chat-Anfrage mit.',
          en: 'The dashboard already polls the Docker socket proxy and the Glances agents and derives the status tiles server-side — specifically so two views cannot disagree about an X-of-Y. It sends that snapshot along with the chat request.'
        },
        {
          type: 'p',
          de: 'Die Alternative wäre gewesen, dass der KI-Dienst selbst pollt: ein zweiter Socket-Proxy-Client, ein zweiter Satz Glances-Timeouts, eine zweite Meinung darüber, was „Knoten online" heißt, und Netzwerkzugriff auf jeden Host. Stattdessen reist der Snapshot im Request-Body, gedeckelt bei 512 KB.',
          en: 'The alternative was for the AI service to poll the cluster itself: a second socket proxy client, a second set of Glances timeouts, a second opinion about what "nodes online" means, and network access to every host. The snapshot travels in a request body instead, bounded at 512 KB.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — _ai_context_bundle()',
          code: `"""Bewusst hier gebaut und NICHT vom Browser entgegengenommen. Der Client hat
das meiste davon schon auf dem Schirm, es aus dem Request zu nehmen wäre also
billiger — hieße aber, dass die Sicht des Modells auf den Cluster das ist, was
der Client behauptet hat.

Jeder Teil ist best effort: ein fehlgeschlagener Poll heißt, ein Abschnitt des
Prompts sagt "keine Daten" — deutlich besser, als dass die Chatbox die Antwort
verweigert, weil Glances auf einem Host in einen Timeout lief.
"""
bundle: dict[str, Any] = {}
try:
    data = await metrics.collect()
    backup = metrics.backup_status()
    bundle.update({
        "tiles": metrics.build_tiles(data, backup),
        "nodes": data["nodes"],
        "extraHosts": data["extraHosts"],
        "swarm": data["swarm"],
        "backup": backup,
        "error": data["error"],
    })
except Exception as err:
    print(f"[ai] could not collect cluster context: {err!r}")
    bundle["error"] = "PROXY_UNAVAILABLE"`
        },

        { type: 'h3', de: 'Konfiguration liegt in der Datenbank, nicht in der Umgebung', en: 'Configuration lives in the database, not the environment' },
        {
          type: 'p',
          de: 'Provider, Modell, API-Schlüssel, Systemprompt, History-Fenster und die Kontext-Schalter stehen alle in `ai_config` und werden im Dashboard unter **Einstellungen → AI** bearbeitet. In der Umgebung steht nur, was man **vor** einer Datenbankverbindung braucht: DB-Koordinaten, die zwei geteilten Geheimnisse, Timeouts, das Wartungsflag.',
          en: 'Provider, model, API keys, system prompt, history window and the context toggles all live in `ai_config` and are edited in the dashboard under **Settings → AI**. The environment holds only what you need **before** a database connection exists: DB coordinates, the two shared secrets, timeouts, the maintenance flag.'
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Kein AI_MODEL, kein ANTHROPIC_API_KEY als Umgebungsvariable', en: 'No AI_MODEL, no ANTHROPIC_API_KEY environment variable' },
          de: 'Wenn eine Einstellung Produktkonfiguration ist, gehört sie ins Dokument in der Datenbank. Ein Modellwechsel soll ein Dropdown sein und kein Redeploy.',
          en: 'If a setting is product configuration, it belongs in the document in the database. Changing model should be a dropdown, not a redeploy.'
        },
        {
          type: 'p',
          de: '`settings.py` im KI-Dienst bewegt sich zwischen drei Formen desselben Dokuments: **gespeichert** (mit `apiKeyEnc`, Chiffretext), **Laufzeit** (`AiConfig`, mit entschlüsselten Schlüsseln, wird nie serialisiert) und **öffentlich** (`to_public()`, mit `keySet` und einem achtstelligen Fingerabdruck, ohne Schlüssel). `to_public()` ist die **eine Funktion**, die zwischen einem verschlüsselten API-Schlüssel und dem Browser eines Admins steht — ein neues Geheimfeld muss auch dort ergänzt werden.',
          en: '`settings.py` in the AI service moves between three shapes of the same document: **stored** (with `apiKeyEnc`, ciphertext), **runtime** (`AiConfig`, with decrypted keys, never serialised) and **public** (`to_public()`, with `keySet` and an eight-character fingerprint, no key). `to_public()` is the **one function** standing between an encrypted API key and an admin\'s browser — a new secret field has to be added there too.'
        },
        {
          type: 'note',
          tone: 'info',
          title: { de: 'Der `__keep__`-Sentinel', en: 'The `__keep__` sentinel' },
          de: '`apiKey` in einem `PUT` hat drei Bedeutungen: **fehlt** oder `__keep__` behält den gespeicherten Schlüssel, ein String ersetzt ihn, ein **leerer String** löscht ihn. Ohne diesen Sentinel würde jedes Speichern des Einstellungsformulars den Schlüssel löschen.',
          en: '`apiKey` in a `PUT` has three meanings: **absent** or `__keep__` keeps the stored key, a string replaces it, an **empty string** deletes it. Without the sentinel, saving the settings form would wipe the key every time.'
        },

        { type: 'h3', de: 'Kontext kommt nach dem Systemprompt — immer', en: 'Context comes after the system prompt — always' },
        {
          type: 'p',
          de: 'Der Prompt-Cache jedes Providers arbeitet über einen **Präfix-Abgleich**: ändert sich ein Byte früh, wird alles danach zum vollen Preis neu berechnet. Der Systemprompt ist stabil, der Cluster-Snapshot ändert sich alle paar Sekunden. Den Snapshot voranzustellen würde den Cache bei **jeder einzelnen Nachricht** invalidieren. `build_system()` in `providers/base.py` erzwingt die Reihenfolge; man darf sie nicht im Adapter selbst zusammensetzen.',
          en: 'Every provider\'s prompt cache works on a **prefix match**: change a byte early and everything after it is re-billed at full price. The system prompt is stable, the cluster snapshot changes every few seconds. Putting the snapshot first would invalidate the cache on **every single message**. `build_system()` in `providers/base.py` enforces the order; do not concatenate them yourself in an adapter.'
        },

        { type: 'h3', de: 'Die Runde: chat.run()', en: 'The turn loop: chat.run()' },
        {
          type: 'ul',
          numbered: true,
          de: [
            'Prüfen, ob die Konfiguration nutzbar ist. Wenn nicht: ein `error`-Ereignis, Ende.',
            'Die Nachricht des Benutzers speichern, **bevor** irgendetwas scheitern kann — ein Provider-Ausfall darf die getippte Frage nicht auffressen.',
            '`start` senden, mit Konversations-ID und Modell.',
            'Die letzten `historyWindow` Nachrichten lesen, Kontextblöcke rendern, Werkzeuge sammeln.',
            'Vom Provider streamen und `text`-Ereignisse weiterreichen, sowie sie eintreffen.',
            'Wenn die Runde Werkzeuge angefordert hat: ausführen, `tool`-Ereignisse senden, Ergebnisse als Benutzerzug anhängen, Schleife.',
            'Bei `MAX_TOOL_ROUNDS` (4) stoppen. In der letzten Runde werden die Werkzeuge zurückgehalten, was eine Antwort erzwingt statt eines weiteren Aufrufs, den die Schleife nicht mehr bedienen kann.',
            '`done` senden.'
          ],
          en: [
            'Check the configuration is usable. If not: one `error` event, stop.',
            'Persist the user\'s message **before** anything can fail — a provider outage must not eat the question they typed.',
            'Emit `start` with the conversation id and the model.',
            'Read the last `historyWindow` messages, render context blocks, gather tools.',
            'Stream from the provider, forwarding `text` events as they arrive.',
            'If the turn asked for tools: run them, emit `tool` events, append the results as a user turn, and loop.',
            'Stop at `MAX_TOOL_ROUNDS` (4). On the final round the tools are withheld, which forces an answer rather than another call the loop cannot service.',
            'Emit `done`.'
          ]
        },
        {
          type: 'p',
          de: 'Zwei Schranken, weil beide Fehlermodi real sind: **`MAX_TOOL_ROUNDS`** stoppt ein Modell, das ewig Werkzeuge aufruft ohne zu antworten. **`PROVIDER_STREAM_DEADLINE`** stoppt einen Provider, der die Anfrage angenommen hat und dann verstummt — ein Read-Timeout kann das nicht leisten, weil es bei jedem Byte zurückgesetzt wird und ein langsames Tröpfeln die Anfrage unbegrenzt am Leben hält.',
          en: 'Two bounds, because both failure modes are real: **`MAX_TOOL_ROUNDS`** stops a model that calls tools forever without answering. **`PROVIDER_STREAM_DEADLINE`** stops a provider that accepted the request and then went quiet — a read timeout cannot do this job, because it resets on every byte and a slow trickle keeps the request alive indefinitely.'
        },

        { type: 'h3', de: 'Das Stream-Protokoll', en: 'The stream protocol' },
        {
          type: 'table',
          head: { de: ['`type`', 'Felder', 'Bedeutung'], en: ['`type`', 'Fields', 'Meaning'] },
          rows: {
            de: [
              ['`start`', '`conversationId`, `model`', 'Angenommen; hier wird es gespeichert.'],
              ['`text`', '`text`', 'Ein Stück der Antwort. Anhängen.'],
              ['`tool`', '`name`, `phase` (`start`/`done`)', 'Ein Werkzeug läuft. Nur für die Oberfläche.'],
              ['`error`', '`code`, `message`', 'Etwas ist schiefgegangen. `code` löst sich zu einer Übersetzung auf.'],
              ['`done`', '`conversationId`', 'Der Austausch ist vorbei, erfolgreich oder nicht.']
            ],
            en: [
              ['`start`', '`conversationId`, `model`', 'Accepted; here is where it is being stored.'],
              ['`text`', '`text`', 'A chunk of the answer. Append it.'],
              ['`tool`', '`name`, `phase` (`start`/`done`)', 'A tool is running. For the UI only.'],
              ['`error`', '`code`, `message`', 'Something failed. `code` resolves to a translation.'],
              ['`done`', '`conversationId`', 'The exchange is over, success or not.']
            ]
          }
        },
        {
          type: 'p',
          de: 'Sobald das erste Byte geflossen ist, hat die HTTP-Antwort begonnen — ein Fehler kann dann kein Statuscode mehr sein. Alles danach meldet sich als `error`-Ereignis **im Stream**, und der Stream endet trotzdem mit `done`. Was das Modell vor dem Abbruch gesagt hat, wird gespeichert: der Benutzer sieht es auf dem Schirm, und ein Transkript ohne diesen Teil sähe aus wie Datenverlust.',
          en: 'Once the first byte has flowed the HTTP response has already started, so a failure can no longer be a status code. Everything downstream reports as an `error` event **inside the stream**, and the stream still ends with `done`. Whatever the model managed to say before breaking is persisted: the user can see it on screen, and a transcript without it looks like data loss.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/ai.py (Dashboard) — stream_chat',
          code: `return StreamingResponse(
    relay(),
    status_code=upstream.status_code,
    media_type="text/event-stream",
    headers={
        "cache-control": "no-store",
        # Hält die Ereignisse durch den Cloudflare-Tunnel und jeden anderen
        # puffernden Hop am Fließen — der Unterschied zwischen einem lebendigen
        # Schreibmaschineneffekt und der ganzen Antwort auf einen Schlag am Ende.
        "x-accel-buffering": "no",
    },
)`
        },

        { type: 'h3', de: 'Werkzeuge sind schreibgeschützt, und das wird erzwungen', en: 'Tools are read-only, and that is enforced' },
        {
          type: 'p',
          de: 'Es gibt fünf: `get_cluster_status`, `get_host_metrics`, `get_backup_status`, `search_services`, `list_swarm_services`. Jedes antwortet **aus dem Snapshot**, den das Dashboard geschickt hat. Keines greift zurück in den Cluster, keines schreibt. `Tool.mutates` ist überall `False`, und die CI prüft das — ein mutierendes Werkzeug lässt den Build so lange scheitern, bis jemand auch den Freigabe-Roundtrip im Dashboard baut.',
          en: 'There are five: `get_cluster_status`, `get_host_metrics`, `get_backup_status`, `search_services`, `list_swarm_services`. Each answers **from the snapshot** the dashboard sent. None reaches back out to the cluster, none writes. `Tool.mutates` is `False` everywhere and CI asserts it — a mutating tool fails the build until somebody also builds the approval round trip in the dashboard.'
        },
        {
          type: 'note',
          tone: 'ok',
          title: { de: 'Warum das die Prompt-Injection-Frage entschärft', en: 'Why that defuses the prompt-injection question' },
          de: 'Der Wirkungsradius des Assistenten ist derzeit **leer**. Ein manipulierter Hostname, der ins Modell wandert, kann nichts auslösen, weil es nichts auszulösen gibt. Das ist bewusste Reibung, kein Versehen.',
          en: 'The assistant\'s blast radius is currently **empty**. A tampered hostname that reaches the model cannot trigger anything, because there is nothing to trigger. That is deliberate friction, not an oversight.'
        },

        { type: 'h3', de: 'Provider', en: 'Providers' },
        {
          type: 'table',
          head: { de: ['Provider', 'Standardmodell', 'Schlüssel nötig', 'Hinweis'], en: ['Provider', 'Default model', 'Key needed', 'Note'] },
          rows: {
            de: [
              ['Anthropic', '`claude-opus-5`', 'ja', 'Günstigeres im Picker; `claude-haiku-4-5` reicht für Statusfragen locker.'],
              ['OpenAI', '`gpt-5-mini`', 'ja', '—'],
              ['Google Gemini', '`gemini-2.5-flash`', 'ja', '—'],
              ['Lokales LLM', 'was auch immer gezogen wurde', 'nein', 'Jeder OpenAI-kompatible Server. Standard: Ollama auf zs-state-01.']
            ],
            en: [
              ['Anthropic', '`claude-opus-5`', 'yes', 'Cheaper options in the picker; `claude-haiku-4-5` is plenty for status questions.'],
              ['OpenAI', '`gpt-5-mini`', 'yes', '—'],
              ['Google Gemini', '`gemini-2.5-flash`', 'yes', '—'],
              ['Local LLM', 'whatever you pulled', 'no', 'Any OpenAI-compatible server. Default: Ollama on zs-state-01.']
            ]
          }
        },
        {
          type: 'p',
          de: '**Keine Hersteller-SDKs**, mit Absicht. Vier Provider hinter einer Schnittstelle hieße, dass die SDKs drei Abhängigkeiten wären, die man ohnehin wieder in eine Form normalisiert — und das Alpine-Image funktioniert nur, weil jede Abhängigkeit ein musllinux-Wheel liefert. Die Modellliste in den Einstellungen wird **beim Provider abgefragt**, nicht hartkodiert: Provider nehmen Modelle für bestehende Schlüssel aus dem Angebot, und eine gepflegte Liste veraltet lautlos.',
          en: '**No vendor SDKs**, on purpose. Four providers behind one interface means the SDKs would be three dependencies normalised back into one shape anyway — and the Alpine image works only because every dependency ships a musllinux wheel. The model list in the settings page is **fetched from the provider**, not hardcoded: providers retire models for existing keys, and a curated list goes stale silently.'
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Kein Fremdschlüssel von ai_conversations auf users', en: 'No foreign key from ai_conversations to users' },
          de: 'Das sieht wie ein Versehen aus und ist Absicht. Das Dashboard löscht ein Konto mit einem schlichten `DELETE FROM users`, nachdem es die Tabellen aufgeräumt hat, die es kennt. Ein Fremdschlüssel aus einer Tabelle, von der es nie gehört hat, würde daraus eine Constraint-Verletzung machen — Benutzer löschen begänne aus Gründen zu scheitern, die im Dashboard-Code unsichtbar sind. Stattdessen ruft das Dashboard `DELETE /api/conversations?userId=<id>` als Teil der Kontolöschung auf, best effort, und der tägliche Prune kehrt auf, was durchgerutscht ist.',
          en: 'This looks like an oversight and is deliberate. The dashboard deletes an account with a plain `DELETE FROM users` after cleaning up the tables it knows about. A foreign key from a table it has never heard of would turn that into a constraint violation — deleting a user would start failing for reasons invisible from the dashboard\'s own code. Instead the dashboard calls `DELETE /api/conversations?userId=<id>` as part of account deletion, best effort, and the daily prune sweeps anything that slipped through.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'crimson',
      icon: 'movie',
      title: { de: 'zer0space ✕ Crimson', en: 'zer0space ✕ Crimson' },
      blocks: [
        {
          type: 'lead',
          de: 'Eine Streaming-Oberfläche im zer0space-Look, hinter derselben Tür wie alles andere. **Das meiste davon ist nicht zer0space-Code**: Backend, Engine und Proxy stammen von Crimson Haven ([crimsonhaven.org](https://crimsonhaven.org/)); zer0space hostet sie, schreibt die Oberfläche neu und baut das Gate davor.',
          en: 'A streaming frontend in the zer0space look, behind the same door as everything else. **Most of it is not zer0space code**: the backend, the engine and the proxy come from Crimson Haven ([crimsonhaven.org](https://crimsonhaven.org/)); zer0space hosts them, rewrote the frontend and built the gate in front.'
        },
        {
          type: 'note',
          tone: 'ok',
          title: { de: 'Credit — Crimson Haven 🩸', en: 'Credit — Crimson Haven 🩸' },
          de: 'Die API, die Metadaten-/Konten-Engines, die client-seitige Scrape-/Resolve-Engine und der signierte HLS-Relay sind alle die Arbeit von **[crimsonhaven-to](https://github.com/crimsonhaven-to)**. Diese Repos hier hosten das für das Homelab und fügen Oberfläche und Deploy-Stack hinzu. Bitte verweist Leute auf das Upstream-Projekt.',
          en: 'The API, the metadata/account engines, the client-side scrape/resolve engine and the signed HLS relay are all the work of **[crimsonhaven-to](https://github.com/crimsonhaven-to)**. The repositories here re-host that for the homelab and add a frontend and a deploy stack. Please point people at the upstream project.'
        },

        { type: 'h3', de: 'Der Aufbau', en: 'The shape' },
        {
          type: 'figure',
          code: {
            de: [
              '  Browser',
              '     │  zer0space-Session — es gibt KEINEN Crimson-Login',
              '     ▼',
              '  Dashboard  /crimson             ──▶  crimson-client (SPA, nginx)',
              '             /crimson/api/…       ──▶  crimson-api (Backend)',
              '             /<name>_proxy…       ──▶  crimson-api (Medien-Relays)',
              '                                          │',
              '                                     crimson-internal',
              '                                     └─ postgres, api-sync',
              '',
              '  Medien:  CDN ──▶ crimson-proxy (Cloudflare Worker) ──▶ Zuschauer',
              '           (nie durch das Dashboard — Cloudflare ToS §2.8)'
            ].join('\n'),
            en: [
              '  browser',
              '     │  zer0space session — there is NO Crimson login',
              '     ▼',
              '  dashboard  /crimson             ──▶  crimson-client (SPA, nginx)',
              '             /crimson/api/…       ──▶  crimson-api (backend)',
              '             /<name>_proxy…       ──▶  crimson-api (media relays)',
              '                                          │',
              '                                     crimson-internal',
              '                                     └─ postgres, api-sync',
              '',
              '  media:  CDN ──▶ crimson-proxy (Cloudflare Worker) ──▶ viewer',
              '          (never through the dashboard — Cloudflare ToS §2.8)'
            ].join('\n')
          }
        },
        {
          type: 'p',
          de: 'Crimson hat **keinen eigenen Login**. Das Dashboard prüft die zer0space-Session und reverse-proxied die SPA und ihre `/crimson/api`-Aufrufe. Wer bei zer0space angemeldet ist, kommt rein; alle anderen landen auf `/login`. Das Gateway wird nur montiert, wenn **beide** Upstreams konfiguriert sind — sonst gibt `/crimson` schlicht 404 zurück und das Dashboard verhält sich exakt wie vorher.',
          en: 'Crimson has **no login of its own**. The dashboard checks the zer0space session and reverse-proxies the SPA and its `/crimson/api` calls. Anyone signed in to zer0space gets in; everyone else lands on `/login`. The gateway is only mounted when **both** upstreams are configured — otherwise `/crimson` simply 404s and the dashboard behaves exactly as before.'
        },

        { type: 'h3', de: 'Was der Proxy sorgfältig behandelt', en: 'What the proxy is careful about' },
        {
          type: 'ul',
          de: [
            '**Das zer0space-Session-Cookie verlässt diesen Hop nie.** Es wird vor dem Weiterleiten entfernt, die Crimson-Upstreams sehen es nicht.',
            '**Streaming statt Puffern.** `/watch` liefert fortschreitendes NDJSON, eine Zeile pro Quelle, sowie sie auflöst. Antworten werden gestreamt und tragen `x-accel-buffering: no`.',
            '**Antwort-Header sind eine Allowlist, keine Denylist.** Diese Antworten kommen vom Ursprung des Dashboards, also spricht alles Durchgereichte mit dessen Autorität. `set-cookie` ließe einen Upstream das zer0space-Cookie schreiben oder löschen, ein durchgereichtes `access-control-allow-origin` gäbe Dritten Cross-Origin-Lesezugriff auf diesen Ursprung.',
            '**`authorization` und der Identitäts-Header werden bedingungslos vom Client gestrippt** — nicht nur auf dem Zweig, der sie ohnehin überschreibt. Beide benennen, wer der Aufrufer ist, und das Backend vertraut ihnen; eine vom Client gelieferte Kopie ist ein Identitätsanspruch, keine Präferenz.',
            '**`..` in einem Unterpfad wird abgelehnt**, nicht stillschweigend normalisiert: httpx löst Punkt-Segmente nach RFC 3986 auf, `a/../../x` würde also upstream zu `/x` — was den engen Medien-Relay-Routen jeden Pfad des Backends öffnen würde.'
          ],
          en: [
            '**The zer0space session cookie never leaves this hop.** It is stripped before forwarding, so the Crimson upstreams never see it.',
            '**Streaming, not buffering.** `/watch` emits progressive NDJSON, one line per source as it resolves. Responses are streamed and carry `x-accel-buffering: no`.',
            '**Response headers are an allowlist, not a denylist.** These responses are served from the dashboard\'s own origin, so anything copied through speaks with its authority. `set-cookie` would let an upstream write or clear the zer0space cookie, and a relayed `access-control-allow-origin` would hand a third party cross-origin reads of this origin.',
            '**`authorization` and the identity header are stripped from the client unconditionally** — not only on the branch that overwrites them anyway. Both name who the caller is and the backend trusts them, so a client-supplied copy is an identity claim rather than a preference.',
            '**A `..` in a subpath is rejected**, not silently normalised: httpx resolves dot segments per RFC 3986, so `a/../../x` would become `/x` upstream — which would open every backend path to the narrow media relay routes.'
          ]
        },

        { type: 'h3', de: 'SSO: ein echtes Crimson-Konto ohne Login-Maske', en: 'SSO: a real Crimson account with no login screen' },
        {
          type: 'p',
          de: 'Crimsons Konto-Authentifizierung ist **Challenge/Signatur**: der Client hält einen Ed25519-Schlüssel, der Server speichert nur den öffentlichen Teil und prüft eine Signatur über eine Einmal-Challenge. Der Mnemonic-/BIP39-Tanz im Upstream-Client ist nur *eine* Art, diesen Schlüssel abzuleiten — der Server sieht ihn nie. Also leitet das Dashboard ihn stattdessen deterministisch ab:',
          en: 'Crimson\'s account auth is **challenge/signature**: the client holds an Ed25519 key, the server stores only the public part and verifies a signature over a one-time challenge. The mnemonic/BIP39 dance in the upstream client is just *one* way to derive that key — the server never sees it. So the dashboard derives it deterministically instead:'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/crimson_sso.py',
          code: `def _seed(user_id: str) -> bytes:
    return hmac.new(
        config.CRIMSON_SSO_SECRET.encode("utf-8"),
        f"crimson-sso:{user_id}".encode("utf-8"),
        hashlib.sha256,
    ).digest()


def _keypair(user_id: str) -> tuple[Ed25519PrivateKey, str]:
    priv = Ed25519PrivateKey.from_private_bytes(_seed(user_id))
    pub_hex = priv.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    ).hex()
    return priv, pub_hex`
        },
        {
          type: 'p',
          de: 'Derselbe zer0space-Benutzer leitet immer dasselbe Crimson-Konto ab — Favoriten und Fortschritt folgen ihm also über Geräte hinweg. Beim ersten Aufruf wird registriert (mit `CRIMSON_SSO_INVITE_CODE`), danach angemeldet; der Bearer wird bis kurz vor Ablauf gecacht. Bekommt der Upstream ein 401, wird das Token verworfen und **einmal** neu angemeldet. Scheitert SSO ganz, fällt der Proxy auf unauthentifiziert zurück statt 500 zu werfen: Browsen und Abspielen funktionieren weiter, nur die kontobezogenen Daten fehlen.',
          en: 'The same zer0space user always derives the same Crimson account, so favorites and progress follow them across devices. On first use the account is registered (with `CRIMSON_SSO_INVITE_CODE`), after that logged in; the Bearer is cached until shortly before it expires. If the upstream returns 401 the token is dropped and re-login is attempted **once**. If SSO fails outright the proxy falls through to an unauthenticated one rather than 500-ing: browsing and playback keep working, only the per-user account data is unavailable.'
        },

        { type: 'h3', de: 'Zwei Fehler, die den Player grau ließen', en: 'Two bugs that left the player grey' },
        {
          type: 'p',
          de: 'Beide sind lehrreich, weil sie zeigen, was ein Reverse-Proxy unter einem Pfadpräfix alles mitbedenken muss.',
          en: 'Both are instructive, because they show what a reverse proxy under a path prefix has to account for.'
        },
        {
          type: 'h4', de: '1. Das Backend kannte seine öffentliche Adresse nicht', en: '1. The backend did not know its public address' },
        {
          type: 'p',
          de: 'Das Backend baut absolute Stream-URLs aus `X-Forwarded-Host` bzw. `Host`. Das Gateway schickte **gar keine** `X-Forwarded-*`-Header, also nahm das Backend seinen Bind-Host — und das `<video>`-Element bekam `https://zer0space-crimson-api:8000/voe_proxy?…`, einen internen Docker-Namen, den kein Browser auflösen kann. Symptom: Player grau bei 0:00, MEDIA-Fehlercode 4.',
          en: 'The backend builds absolute stream URLs from `X-Forwarded-Host` or `Host`. The gateway forwarded **no** `X-Forwarded-*` headers at all, so the backend used its bind host — and the `<video>` element got `https://zer0space-crimson-api:8000/voe_proxy?…`, an internal Docker name no browser can resolve. Symptom: grey player at 0:00, MEDIA error code 4.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/crimson.py — build_request_headers()',
          code: `proto, host = _forwarded_origin(request)
out["x-forwarded-proto"] = proto
out["x-forwarded-host"] = host
if forwarded_prefix:
    # Trägt den Mountpunkt des Gateways, damit der erzeugte Pfad ihn enthält:
    # /crimson/api/voe_proxy statt /voe_proxy
    out["x-forwarded-prefix"] = "/" + forwarded_prefix.strip("/")`
        },
        {
          type: 'p',
          de: '`_forwarded_origin()` bevorzugt dabei `PUBLIC_BASE_URL` aus der Konfiguration, weil `Host` und `X-Forwarded-Proto` bei jeder Anfrage, die nicht durch den Tunnel kam, client-gesteuert sind — und das Backend genau daraus die URLs baut, die es dem Player gibt. Konfiguration ist hier die einzige Quelle, die ein Angreifer nicht setzen kann.',
          en: '`_forwarded_origin()` prefers `PUBLIC_BASE_URL` from configuration, because `Host` and `X-Forwarded-Proto` are both client-controlled on any request that did not come through the tunnel — and the backend turns exactly those into the URLs it hands the player. Configuration is the only source here an attacker cannot set.'
        },
        {
          type: 'h4', de: '2. Wurzelrelative Playlist-Pfade', en: '2. Root-relative playlist paths' },
        {
          type: 'p',
          de: 'Danach lud die Master-Playlist — und der Player blieb trotzdem grau. Die HLS-Proxys des Backends schreiben jede Unter-Ressource auf einen **wurzelrelativen** Pfad wie `/voe_proxy?u=…` um. Für ein an der Wurzel montiertes Backend ist das richtig; hinter unserem `/crimson/api`-Mount löst hls.js diese Pfade gegen den Ursprung auf, ein Segment landet also auf `zer0space.com/voe_proxy` statt `…/crimson/api/voe_proxy` — 404, grau.',
          en: 'After that the master playlist loaded — and the player stayed grey anyway. The backend\'s HLS proxies rewrite every sub-resource to a **root-relative** path like `/voe_proxy?u=…`. That is correct for a root-mounted backend; behind our `/crimson/api` mount hls.js resolves those against the origin, so a segment lands at `zer0space.com/voe_proxy` instead of `…/crimson/api/voe_proxy` — 404, grey.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/main.py — im CRIMSON_ENABLED-Block',
          code: `# Der Relay-Name wird gegen eine konservative Zeichenklasse geprüft, statt
# jedes Segment zu akzeptieren: er wird direkt in die Upstream-URL geschrieben,
# und die Routen existieren nur, um die /<name>_proxy-Links des Backends zu
# tragen.
_RELAY_NAME_OK = re.compile(r"^[a-z0-9][a-z0-9_-]{0,39}$", re.IGNORECASE)

@app.api_route("/{proxy_name}_proxy", methods=["GET", "HEAD", "OPTIONS"])
async def crimson_media_proxy(request: Request, proxy_name: str) -> Response:
    if _crimson_user(request) is None:
        return fail(401, "UNAUTHORIZED", "Sign in to zer0space to use Crimson")
    if not _RELAY_NAME_OK.match(proxy_name):
        return fail(404, "NOT_FOUND", "Not found")
    return await crimson.proxy(request, config.CRIMSON_API_URL, f"{proxy_name}_proxy")`
        },
        {
          type: 'p',
          de: 'Die Links bleiben dabei HMAC-signiert (`PROXY_SECRET` des Backends) und werden dort erneut geprüft; die Session-Schranke hält den Relay nur auf angemeldete Benutzer beschränkt.',
          en: 'The links stay HMAC-signed (the backend\'s `PROXY_SECRET`) and are re-verified there; the session gate just keeps the relay signed-in-only.'
        },

        { type: 'h3', de: 'Die eigene CSP für Crimson', en: 'Crimson\'s own CSP' },
        {
          type: 'p',
          de: 'Ein Streaming-Aggregator erreicht viele Hosts: Poster von TMDB, Medien, iframe-Embeds. Die CSP für die geproxyten `/crimson`-Antworten ist deshalb bewusst lockerer als die des Dashboards — und wird genau dort gesetzt, damit die anhängende `SecurityHeadersMiddleware` des Dashboards sie unangetastet lässt.',
          en: 'A streaming aggregator reaches many hosts: posters from TMDB, media, iframe embeds. The CSP for the proxied `/crimson` responses is therefore deliberately looser than the dashboard\'s — and set right there, so the dashboard\'s append-only `SecurityHeadersMiddleware` leaves it untouched.'
        },
        {
          type: 'code',
          lang: 'python',
          file: 'src/crimson.py',
          code: `CRIMSON_CSP = "; ".join([
    "default-src 'self'",
    "base-uri 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src https:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
])`
        },

        { type: 'h3', de: 'Wo die Videobytes fließen', en: 'Where the video bytes flow' },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Cloudflare ToS §2.8', en: 'Cloudflare ToS §2.8' },
          de: 'Dauerhaftes Video-Streaming durch das CDN ist untersagt. API und Oberfläche über den Tunnel sind in Ordnung; die Medienauslieferung soll daran vorbei. Deshalb der `crimson-proxy` als Cloudflare Worker: **CDN → Proxy → Zuschauer**, nie durch das Backend.',
          en: 'Continuous video streaming through the CDN is prohibited. The API and the UI over the tunnel are fine; media delivery is meant to go around it. Hence `crimson-proxy` as a Cloudflare Worker: **CDN → proxy → viewer**, never through the backend.'
        },
        {
          type: 'p',
          de: 'Der Proxy injiziert die `Referer`/`Origin`/`User-Agent`-Header, die gegatete CDNs verlangen und die ein Browser bei eigenen Medien-Fetches nicht setzen kann. Jeder Link ist vom Backend HMAC-signiert (geteiltes `PROXY_SECRET`), also lässt er sich nicht als offener Proxy missbrauchen.',
          en: 'The proxy injects the `Referer`/`Origin`/`User-Agent` headers gated CDNs require and that a browser cannot set on its own media fetches. Every link is HMAC-signed by the backend (shared `PROXY_SECRET`), so it cannot be abused as an open proxy.'
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Die wichtigste Einschränkung: die meisten Quellen können den Worker nicht nutzen', en: 'The key constraint: most sources cannot use the Worker' },
          de: 'Resolver wie VOE, PlayIMDb, AnimeSuge, Vidmoly, VidSrc und cinema.bz erzeugen ein CDN-Token, das **an die IP/ASN gebunden ist, die den Embed aufgelöst hat** (`asn=`-Parameter). Diese Quellen müssen same-origin bleiben; über einen Worker oder eine Edge-Funktion geleitet, antworten sie 403 — genau wie der Browser des Zuschauers. Der Worker deckt also nur Quellen ohne ASN-Bindung ab (Jellyfin, client-signierte). Die Medien der ASN-gebundenen Quellen fließen zwangsläufig **CDN → Backend → Dashboard → Zuschauer**, also durch den Tunnel — was mit der ToS-Regel oben in Konflikt steht. Der saubere Ausweg wäre, den Medien-Proxy des Backends über einen direkten Host bzw. Tailscale zu exponieren und `_public_base_url` dorthin zu zeigen.',
          en: 'Resolvers like VOE, PlayIMDb, AnimeSuge, Vidmoly, VidSrc and cinema.bz mint a CDN token **bound to the IP/ASN that resolved the embed** (`asn=` parameter). Those sources must stay same-origin; routed through a Worker or an edge function they 403 exactly like the viewer\'s browser would. So the Worker only ever covers sources without ASN binding (Jellyfin, client-minted). The media of the ASN-bound sources inherently flows **CDN → backend → dashboard → viewer**, i.e. through the tunnel — which conflicts with the ToS rule above. The clean fix would be exposing the backend\'s media proxy on a direct/Tailscale host and pointing `_public_base_url` there.'
        },

        { type: 'h3', de: 'Die Sources-Engine', en: 'The sources engine' },
        {
          type: 'p',
          de: '`crimson-sources` ist Crimson Havens TypeScript-Neuimplementierung der Backend-Quellen, die **im Browser des Zuschauers** läuft. Die Client-App bindet sie vendored ein (nicht als Submodul — GitHub Actions kann ein Submodul über Organisationsgrenzen hinweg nicht ohne Token klonen) und lädt sie lazy auf der Watch-Seite. Es gibt drei Ebenen:',
          en: '`crimson-sources` is Crimson Haven\'s TypeScript re-implementation of the backend sources, running **in the viewer\'s browser**. The client app vendors it in (not as a submodule — GitHub Actions cannot clone a submodule across organisations without a token) and lazy-loads it on the watch page. There are three tiers:'
        },
        {
          type: 'table',
          head: { de: ['Ebene', 'Weg', 'Bemerkung'], en: ['Tier', 'Path', 'Note'] },
          rows: {
            de: [
              ['E0', 'Backend löst serverseitig auf', 'Braucht die privaten Resolver aus dem Overlay-Repo.'],
              ['E1', 'Direkt aus dem Browser', 'Funktioniert, wenn die Quelle CORS erlaubt.'],
              ['E2', 'Über den `crimson-proxy`-Worker', 'Nur für Quellen ohne ASN-Bindung, siehe oben.'],
              ['E3', 'Über die Companion-Erweiterung', 'Löst Captcha-gegatete Quellen im Browser des Zuschauers. Vom Benutzer **abgelehnt** — nicht erneut vorschlagen.']
            ],
            en: [
              ['E0', 'Backend resolves server-side', 'Needs the private resolvers from the overlay repository.'],
              ['E1', 'Directly from the browser', 'Works when the source allows CORS.'],
              ['E2', 'Through the `crimson-proxy` Worker', 'Only for sources without ASN binding, see above.'],
              ['E3', 'Through the companion extension', 'Resolves captcha-gated sources in the viewer\'s browser. **Declined** by the user — do not propose it again.']
            ]
          }
        },
        {
          type: 'note',
          tone: 'info',
          title: { de: 'Der Turnstile-Fall (Stand 2026-07-31)', en: 'The Turnstile situation (as of 2026-07-31)' },
          de: 'serienstream.to und sein IP-Mirror gaten ihre Hoster-Links inzwischen beide hinter einem Cloudflare-Turnstile-Interstitial, also lösen einfache httpx-Scraper nichts mehr auf — deutschsprachige Realfilm-Serien zeigen dadurch keine Quelle. Dieselbe `/r?t=`-URL in einem **echten Browser auf einer Wohn-IP** (der Anschluss des Homelabs) besteht die Challenge stillschweigend. Der geplante Weg ist deshalb ein serverseitiger **headless Chromium auf dem Homelab** (FlareSolverr), der das Gate für alle Nutzer gleichzeitig löst — funktioniert auch auf Mobilgeräten und braucht keine Erweiterung pro Benutzer. Anime auf Deutsch funktioniert bereits (aniworld, kein Captcha).',
          en: 'serienstream.to and its IP mirror now both gate their hoster links behind a Cloudflare Turnstile interstitial, so plain httpx scrapers resolve nothing — which is why German live-action series show no source. The same `/r?t=` URL loaded in a **real browser on a residential IP** (the homelab\'s connection) passes the challenge silently. The planned path is therefore a server-side **headless Chromium on the homelab** (FlareSolverr) that resolves the gate for all users at once — it works on mobile too and needs no per-user extension. German anime already works (aniworld, no captcha).'
        },

        { type: 'h3', de: 'Die Repos im Überblick', en: 'The repositories at a glance' },
        {
          type: 'table',
          head: { de: ['Repo', 'Rolle', 'Herkunft'], en: ['Repository', 'Role', 'Origin'] },
          rows: {
            de: [
              ['`zer0space-crimson-client`', 'React-SPA im zer0space-Look, Basename `/crimson`, `hls.js`-Player, DE/EN, Akzentwähler, Bibliothek, Empfehlungen, Introskipper, Untertitel.', '**zer0space**'],
              ['`zer0space-crimson-backend`', 'API (`/search/*`, `/trending*`, `/catalogue`, `/watch/*`, `/account/*`), PostgreSQL, Sync-Worker.', 'Crimson Haven'],
              ['`zer0space-crimson-sources`', 'Client-seitige Scrape-/Resolve-Engine, abhängigkeitsfreies TypeScript.', 'Crimson Haven'],
              ['`zer0space-crimson-proxy`', 'Signierter HLS-Relay als Cloudflare Worker (Nitro).', 'Crimson Haven'],
              ['`zer0space-crimson-secret-backend-sources`', '**Privat.** Serverseitige Resolver/Scraper, per BuildKit-Secret ins Image gelegt.', 'Crimson Haven']
            ],
            en: [
              ['`zer0space-crimson-client`', 'React SPA in the zer0space look, basename `/crimson`, `hls.js` player, DE/EN, accent picker, library, recommendations, intro skipper, subtitles.', '**zer0space**'],
              ['`zer0space-crimson-backend`', 'API (`/search/*`, `/trending*`, `/catalogue`, `/watch/*`, `/account/*`), PostgreSQL, sync worker.', 'Crimson Haven'],
              ['`zer0space-crimson-sources`', 'Client-side scrape/resolve engine, dependency-free TypeScript.', 'Crimson Haven'],
              ['`zer0space-crimson-proxy`', 'Signed HLS relay as a Cloudflare Worker (Nitro).', 'Crimson Haven'],
              ['`zer0space-crimson-secret-backend-sources`', '**Private.** Server-side resolvers/scrapers, injected into the image via a BuildKit secret.', 'Crimson Haven']
            ]
          }
        },
        {
          type: 'p',
          de: 'Das Backend liefert **bewusst keine** Dritt-Resolver mit. Das Dockerfile kann sie beim Build aus dem privaten Repo injizieren, sobald das Actions-Secret `SOURCES_PAT` gesetzt ist; `core/private_sources.py` findet die eingelegten Module zur Laufzeit automatisch. Ohne das Secret wird das Basis-Image gebaut und nichts regressiert — die client-seitige Engine löst E1–E3 weiterhin im Browser auf.',
          en: 'The backend deliberately ships **no** third-party resolvers. The Dockerfile can inject them at build time from the private repository once the Actions secret `SOURCES_PAT` is set; `core/private_sources.py` auto-discovers the injected modules at runtime. Without the secret the base image is built and nothing regresses — the client-side engine still resolves E1–E3 in the browser.'
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'BuildKit und der Cache-Schlüssel', en: 'BuildKit and the cache key' },
          de: 'BuildKit schließt Secrets aus dem Cache-Schlüssel aus. Ohne ein `SOURCES_CACHEBUST`-Build-Argument pro Commit wird deshalb eine alte Schicht ohne Quellen wiederverwendet — und das Image sieht gebaut aus, enthält aber keine Resolver.',
          en: 'BuildKit excludes secrets from the cache key. Without a per-commit `SOURCES_CACHEBUST` build arg a stale no-sources layer is reused — and the image looks built while containing no resolvers.'
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'TMDB: der v4-Token, nicht der v3-Schlüssel', en: 'TMDB: the v4 token, not the v3 key' },
          de: 'Das Backend schickt TMDB als `Authorization: Bearer`, also muss `TMDB_API_KEY` das **v4 „API Read Access Token"** sein (der lange `eyJ…`-String), nicht der kurze v3-Schlüssel. Mit dem falschen bleibt der Katalog leer, ohne dass irgendwo ein Fehler auftaucht. Und der Antwort-Cache des Backends (`api_cache`) kann leere Ergebnisse konservieren: `DELETE FROM api_cache` plus `docker service update --force` räumt das ab.',
          en: 'The backend sends TMDB as `Authorization: Bearer`, so `TMDB_API_KEY` must be the **v4 "API Read Access Token"** (the long `eyJ…` string), not the short v3 key. With the wrong one the catalogue stays empty without an error appearing anywhere. And the backend\'s response cache (`api_cache`) can preserve empty results: `DELETE FROM api_cache` plus `docker service update --force` clears it.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'deploy',
      icon: 'rocket',
      title: { de: 'Deployment', en: 'Deployment' },
      blocks: [
        {
          type: 'lead',
          de: 'GitHub Actions baut das Image, GHCR hält es, Portainer deployt den Stack. Auf den Knoten liegt **kein Git-Klon** — wer dort `git pull && docker build` sucht, sucht vergeblich.',
          en: 'GitHub Actions builds the image, GHCR holds it, Portainer deploys the stack. There is **no git clone** on the nodes — looking for `git pull && docker build` there is a dead end.'
        },
        {
          type: 'figure',
          code: {
            de: [
              '  push auf main',
              '        │',
              '        ▼',
              '  ┌────────────────────────────────────────────────────────┐',
              '  │  Job "check"  (läuft auch bei jedem Pull Request)      │',
              '  │   · pip install -r requirements.txt                    │',
              '  │   · python -m compileall -q src scripts                │',
              '  │   · from src.main import app        (ohne Datenbank)   │',
              '  │   · jedes Jinja-Template parsen                        │',
              '  └───────────────────────┬────────────────────────────────┘',
              '                          ▼',
              '  ┌────────────────────────────────────────────────────────┐',
              '  │  Job "build"                                           │',
              '  │   docker build → ghcr.io/zer0space-net/…:latest        │',
              '  └───────────────────────┬────────────────────────────────┘',
              '                          ▼',
              '  Portainer  "Pull and redeploy"  →  Swarm-Stack (Digest gepinnt)'
            ].join('\n'),
            en: [
              '  push to main',
              '        │',
              '        ▼',
              '  ┌────────────────────────────────────────────────────────┐',
              '  │  job "check"  (runs on every pull request too)         │',
              '  │   · pip install -r requirements.txt                    │',
              '  │   · python -m compileall -q src scripts                │',
              '  │   · from src.main import app        (with no database) │',
              '  │   · parse every Jinja template                         │',
              '  └───────────────────────┬────────────────────────────────┘',
              '                          ▼',
              '  ┌────────────────────────────────────────────────────────┐',
              '  │  job "build"                                           │',
              '  │   docker build → ghcr.io/zer0space-net/…:latest        │',
              '  └───────────────────────┬────────────────────────────────┘',
              '                          ▼',
              '  Portainer  "Pull and redeploy"  →  Swarm stack (digest pinned)'
            ].join('\n')
          }
        },
        {
          type: 'note',
          tone: 'info',
          title: { de: 'Es gibt keine Testsuite', en: 'There is no test suite' },
          de: 'Der `check`-Job **ist** das Sicherheitsnetz: Alles muss byte-kompilieren, die App muss importierbar sein (ohne Datenbank!), und jedes Template muss parsen. Das steht zwischen einem Tippfehler und einem Container, der auf dem Cluster in einer Restart-Schleife hängt. Wer nichttriviale Logik hinzufügt, sollte das sagen, statt stillschweigend anzunehmen, sie sei abgedeckt.',
          en: 'The `check` job **is** the safety net: everything has to byte-compile, the app has to import (without a database!), and every template has to parse. That is what stands between a typo and a container crash-looping on the cluster. If you add non-trivial logic, say so rather than silently assuming it is covered.'
        },

        { type: 'h3', de: 'Der Stack', en: 'The stack' },
        {
          type: 'table',
          head: { de: ['Dienst', 'Repliken', 'Platzierung', 'Warum'], en: ['Service', 'Replicas', 'Placement', 'Why'] },
          rows: {
            de: [
              ['`dashboard`', '**1**', 'derzeit an `zs-node-01` gepinnt', 'Repliken müssen bei 1 bleiben — der Session-Speicher liegt im Prozess. Die Pinnung ist temporär und darf weg, sobald das Image sauber aus GHCR gezogen wird.'],
              ['`ai`', '2', 'beliebig', 'Skaliert wirklich: kein Session-Speicher, kein lokaler Zustand. Eine streamende Antwort belegt einen Worker, solange das Modell redet — also sind gleichzeitige Nutzer die Größe, nicht Requests pro Sekunde.'],
              ['`socketproxy`', '1', '**fest** an einem Manager', 'Nur Manager beantworten `/nodes`, `/services`, `/tasks`.'],
              ['`glances`', 'global', 'überall', 'Ein Agent pro Knoten, Port im Host-Modus.']
            ],
            en: [
              ['`dashboard`', '**1**', 'currently pinned to `zs-node-01`', 'Replicas must stay at 1 — the session store is in-process. The pin is temporary and may go once the image is pulled cleanly from GHCR.'],
              ['`ai`', '2', 'anywhere', 'Genuinely scales: no session store, no local state. A streaming answer holds a worker for as long as the model keeps talking, so concurrent users size this, not request rate.'],
              ['`socketproxy`', '1', '**pinned** to a manager', 'Only managers answer `/nodes`, `/services`, `/tasks`.'],
              ['`glances`', 'global', 'everywhere', 'One agent per node, port published in host mode.']
            ]
          }
        },

        { type: 'h3', de: 'Secrets', en: 'Secrets' },
        {
          type: 'p',
          de: 'Alle sind `external: true` — sie werden einmal auf einem Manager erzeugt und stehen nie in einer Datei im Repository. Die Auflösungsreihenfolge im Code ist immer **Swarm-Secret-Datei → Umgebungsvariable**, nie umgekehrt.',
          en: 'All of them are `external: true` — created once on a manager and never present in a file in the repository. The resolution order in code is always **Swarm secret file → environment variable**, never the other way round.'
        },
        {
          type: 'code',
          lang: 'bash',
          file: 'einmalig auf einem Manager-Knoten',
          code: `printf 'THE-DB-PASSWORD' | docker secret create db_password -
openssl rand -hex 32 | tr -d '\\n' | docker secret create session_secret -
openssl rand -hex 32 | tr -d '\\n' | docker secret create totp_enc_key -
openssl rand -hex 32 | tr -d '\\n' | docker secret create crimson_sso_secret -

# Optional, teilen sich Dashboard und AI-Dienst. Ohne sie erzeugt jeder Dienst
# den Wert einmal und legt ihn in die settings-Tabelle, die beide lesen:
openssl rand -hex 32 | tr -d '\\n' | docker secret create ai_service_token -
openssl rand -hex 32 | tr -d '\\n' | docker secret create ai_enc_key -`
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Docker-Secrets sind unveränderlich — Rotation heißt neuer Name', en: 'Docker secrets are immutable — rotating means a new name' },
          de: 'Und die Folgen sind unterschiedlich schwer: `session_secret` zu rotieren macht jede aktive Session ungültig, alle müssen sich neu anmelden — und da der Tresorschlüssel in der Session liegt, ist der Tresor bis dahin wieder zu. `totp_enc_key` zu rotieren ist schlimmer: **jeder Benutzer mit 2FA** scheitert beim nächsten Login daran, sein `totp_secret` zu entschlüsseln, ununterscheidbar von einem falschen Code, und es gibt dafür **keinen** Neuverschlüsselungspfad wie beim geänderten Passwort. `ai_enc_key` zu rotieren macht jeden gespeicherten Provider-Schlüssel unlesbar; sie müssen neu eingegeben werden. Alle drei sollte man so dauerhaft behandeln wie das Datenbankpasswort selbst.',
          en: 'And the consequences differ in weight: rotating `session_secret` invalidates every active session, so everyone signs in again — and since the vault key lives in the session, the vault re-locks until they do. Rotating `totp_enc_key` is worse: **every user with 2FA** fails to decrypt their `totp_secret` on the next login, indistinguishable from a wrong code, and there is **no** re-encryption path the way there is for a changed password. Rotating `ai_enc_key` makes every stored provider key undecryptable; they have to be entered again. Treat all three as close to permanent as the database password itself.'
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Ein referenziertes, nicht existierendes externes Secret bricht das Deploy', en: 'A referenced external secret that does not exist breaks the deploy' },
          de: 'Deshalb sind `ai_service_token` und `ai_enc_key` in der Compose-Datei auskommentiert. Wer sie will, muss **beide** Stellen im Dienst **und** die Deklarationen am Dateiende zusammen einkommentieren, nachdem die Secrets tatsächlich angelegt wurden.',
          en: 'That is why `ai_service_token` and `ai_enc_key` are commented out in the compose file. Enabling them means uncommenting **both** places in the service **and** the declarations at the bottom of the file, together, after the secrets actually exist.'
        },

        { type: 'h3', de: 'Das Dockerfile', en: 'The Dockerfile' },
        {
          type: 'ul',
          de: [
            'Ein einziger Stage auf `python:3.12-alpine`, **ohne Compiler**. Das geht, weil jede Abhängigkeit in `requirements.txt` ein musllinux-Wheel liefert. Sollte ein Versionssprung das brechen: auf `python:3.12-slim` wechseln, **nicht** gcc/musl-dev ins Laufzeit-Image legen.',
            'Der Container läuft als **UID 10001** und schreibt nie in sein eigenes Dateisystem.',
            'Der Healthcheck fragt `http://127.0.0.1:3000/healthz` ab — und genau daran hängt die Falle unten.'
          ],
          en: [
            'A single stage on `python:3.12-alpine`, **with no compiler**. That works because every dependency in `requirements.txt` ships a musllinux wheel. If a bump ever breaks that: switch to `python:3.12-slim`, do **not** add gcc/musl-dev to the runtime image.',
            'The container runs as **UID 10001** and never writes to its own filesystem.',
            'The health check probes `http://127.0.0.1:3000/healthz` — which is exactly where the trap below comes from.'
          ]
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'ALLOWED_HOSTS muss 127.0.0.1 enthalten', en: 'ALLOWED_HOSTS must include 127.0.0.1' },
          de: 'Sonst bringt sich der Container selbst um: der Healthcheck ruft `127.0.0.1` auf, `TrustedHostMiddleware` antwortet 400, der Healthcheck scheitert, Swarm startet den Task neu — in einer Schleife. Das Symptom ist ein 502 mit **leerer** ERROR-Spalte und CURRENT STATE `Complete` (Exit 0, von außen getötet, kein Absturz). Richtig ist `ALLOWED_HOSTS=zer0space.com,127.0.0.1,localhost`; Starlette entfernt den Port selbst.',
          en: 'Otherwise the container kills itself: the health check calls `127.0.0.1`, `TrustedHostMiddleware` answers 400, the check fails, Swarm restarts the task — in a loop. The symptom is a 502 with an **empty** ERROR column and CURRENT STATE `Complete` (exit 0, killed from outside, not a crash). The right value is `ALLOWED_HOSTS=zer0space.com,127.0.0.1,localhost`; Starlette strips the port itself.'
        },

        { type: 'h3', de: 'Der NFS-Mount', en: 'The NFS mount' },
        {
          type: 'code',
          lang: 'yaml',
          file: 'docker-compose.yml',
          code: `volumes:
  # Zentraler NFS-Speicher von zs-store-01 (192.168.0.15:/srv/nfs/swarm-data),
  # auf jedem Swarm-Knoten unter /mnt/storage gemountet (persistent via fstab).
  #
  #   /data/background/     hochgeladene Hintergrundbilder
  #   /data/backup-status/  JSON-Dateien, die das Backup-Skript je Knoten schreibt
  - /mnt/storage/dashboard:/data`
        },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Ein fehlender Mount fällt nicht auf', en: 'A missing mount does not announce itself' },
          de: 'Ist `/mnt/storage` auf einem Knoten **nicht** gemountet, legt Docker das Verzeichnis stillschweigend leer an — Hintergrundbild und Backup-Karte fehlen dann einfach. Vor jedem Deploy auf jedem Knoten prüfen: `mountpoint -q /mnt/storage && echo OK`.',
          en: 'If `/mnt/storage` is **not** mounted on a node, Docker silently creates the directory empty — the background image and the backup card then simply go missing. Check on every node before deploying: `mountpoint -q /mnt/storage && echo OK`.'
        },

        { type: 'h3', de: 'Lokal entwickeln', en: 'Local development' },
        {
          type: 'code',
          lang: 'bash',
          file: '',
          code: `python -m venv .venv && . .venv/bin/activate    # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env      # dann echte Werte eintragen — .env NIE committen
uvicorn src.main:app --reload --port 3000`
        },
        {
          type: 'p',
          de: 'Man braucht eine erreichbare PostgreSQL-Instanz. `DB_HOST` auf die echte zs-state-01-Datenbank zu richten funktioniert, schreibt aber in Produktionsdaten — ein lokaler Wegwerf-Container ist besser. Da das Frontend keinen Build hat, reicht nach einer Änderung unter `static/` ein Browser-Reload.',
          en: 'You need a reachable PostgreSQL instance. Pointing `DB_HOST` at the real zs-state-01 database works but writes to production data — a local throwaway container is better. Since the frontend has no build step, a change under `static/` only needs a browser reload.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'operations',
      icon: 'tool',
      title: { de: 'Betrieb', en: 'Operations' },
      blocks: [
        {
          type: 'lead',
          de: 'Was man tut, wenn etwas nicht stimmt — und was die Logzeilen bedeuten, die dabei helfen.',
          en: 'What to do when something is off — and what the log lines that help mean.'
        },

        { type: 'h3', de: 'Umgebungsvariablen', en: 'Environment variables' },
        {
          type: 'table',
          head: { de: ['Variable', 'Standard', 'Bedeutung'], en: ['Variable', 'Default', 'Meaning'] },
          rows: {
            de: [
              ['`DATABASE_URL`', '—', 'Gewinnt, wenn gesetzt. Sonst gelten die einzelnen `DB_*`.'],
              ['`DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER`', '192.168.0.16 / 5432 / zer0space / dashboard', 'Das Passwort kommt aus dem Secret `db_password`, nicht von hier.'],
              ['`SESSION_MAX_AGE`', '86400', 'Sekunden. Auch das Fenster, in dem ein gestohlenes Cookie den Tresor lesen könnte.'],
              ['`FORCE_HTTPS`', 'false', 'Schaltet HSTS und `upgrade-insecure-requests` ein. Standardmäßig aus, damit HTTP im LAN weiter geht.'],
              ['`COOKIE_SECURE`', 'true (im Compose)', 'Das Session-Cookie ist kein reines Auth-Token — wer es abgreift, liest jeden gespeicherten Zugang.'],
              ['`TRUST_PROXY` / `TRUSTED_PROXY_IPS`', 'true / leer', '**Beide** nötig, siehe [Anmeldung](#auth). Leere Liste heißt „jedem Peer glauben".'],
              ['`ALLOWED_HOSTS`', 'leer (Prüfung aus)', 'Kommagetrennt. Muss `127.0.0.1` enthalten, siehe Healthcheck-Falle.'],
              ['`PUBLIC_BASE_URL`', '—', 'Die echte öffentliche Adresse. Steuert, was das Crimson-Gateway seinem Backend als Forwarded-Origin sagt.'],
              ['`EXTRA_HOSTS`', 'zs-state-01, zs-store-01', '`name:ip[:label]`, kommagetrennt.'],
              ['`GLANCES_SERVICE` / `GLANCES_PORT`', 'dashboard_glances / 61208', 'Der Dienstname wird gebraucht, um zu wissen, welche Knoten einen laufenden Agenten haben.'],
              ['`BACKUP_STALE_HOURS`', '26', 'Ab wann ein Backup als veraltet gilt.'],
              ['`MAINTENANCE_MODE`', 'false', 'Liefert die Wartungsseite. Umgebungsflag, weil man es bei toter Datenbank braucht.'],
              ['`CRIMSON_CLIENT_URL` / `CRIMSON_API_URL`', 'leer', 'Beide leer = `/crimson` gibt 404, Gateway existiert nicht.'],
              ['`CRIMSON_SSO_INVITE_CODE`', 'leer', 'Ohne ihn bleibt der SSO-Broker still aus — Browsen geht, Kontosync nicht.'],
              ['`AI_SERVICE_URL`', 'http://ai:8000', 'Leer = KI-Funktion komplett aus, `/api/ai/*` antwortet 503.']
            ],
            en: [
              ['`DATABASE_URL`', '—', 'Wins when set. Otherwise the individual `DB_*` apply.'],
              ['`DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER`', '192.168.0.16 / 5432 / zer0space / dashboard', 'The password comes from the `db_password` secret, not from here.'],
              ['`SESSION_MAX_AGE`', '86400', 'Seconds. Also the window in which a stolen cookie could read the vault.'],
              ['`FORCE_HTTPS`', 'false', 'Enables HSTS and `upgrade-insecure-requests`. Off by default so plain HTTP on the LAN keeps working.'],
              ['`COOKIE_SECURE`', 'true (in compose)', 'The session cookie is not just an auth token — whoever captures it reads every stored credential.'],
              ['`TRUST_PROXY` / `TRUSTED_PROXY_IPS`', 'true / empty', '**Both** required, see [Authentication](#auth). An empty list means "believe any peer".'],
              ['`ALLOWED_HOSTS`', 'empty (check off)', 'Comma-separated. Must include `127.0.0.1`, see the health check trap.'],
              ['`PUBLIC_BASE_URL`', '—', 'The real public address. Steers what the Crimson gateway tells its backend as the forwarded origin.'],
              ['`EXTRA_HOSTS`', 'zs-state-01, zs-store-01', '`name:ip[:label]`, comma-separated.'],
              ['`GLANCES_SERVICE` / `GLANCES_PORT`', 'dashboard_glances / 61208', 'The service name is needed to know which nodes have a running agent.'],
              ['`BACKUP_STALE_HOURS`', '26', 'When a backup starts counting as stale.'],
              ['`MAINTENANCE_MODE`', 'false', 'Serves the maintenance page. An environment flag because you need it when the database is dead.'],
              ['`CRIMSON_CLIENT_URL` / `CRIMSON_API_URL`', 'empty', 'Both empty = `/crimson` 404s, the gateway does not exist.'],
              ['`CRIMSON_SSO_INVITE_CODE`', 'empty', 'Without it the SSO broker stays silently off — browsing works, account sync does not.'],
              ['`AI_SERVICE_URL`', 'http://ai:8000', 'Empty = the AI feature is entirely off, `/api/ai/*` answers 503.']
            ]
          }
        },

        { type: 'h3', de: 'Diagnose-Endpunkte', en: 'Diagnostic endpoints' },
        {
          type: 'table',
          head: { de: ['Endpunkt', 'Zugang', 'Antwortet'], en: ['Endpoint', 'Access', 'Answers'] },
          rows: {
            de: [
              ['`GET /healthz`', 'öffentlich', '`{"ok": true, "db": <bool>, "version": "…"}` — Liveness, fasst die DB **nicht** an.'],
              ['`GET /api/health/schema`', 'Admin', 'Fehlende Tabellen; 503, wenn etwas fehlt.'],
              ['`GET /api/login-attempts?limit=`', 'Admin', 'Das Anmelde-Audit: sieht man, ob gerade jemand anklopft.'],
              ['`GET /api/ai/status`', 'Session', 'Ob der Assistent konfiguriert und bereit ist, und mit welchem Modell.']
            ],
            en: [
              ['`GET /healthz`', 'public', '`{"ok": true, "db": <bool>, "version": "…"}` — liveness, does **not** touch the DB.'],
              ['`GET /api/health/schema`', 'admin', 'Missing tables; 503 when something is absent.'],
              ['`GET /api/login-attempts?limit=`', 'admin', 'The login audit trail: shows whether anyone is knocking.'],
              ['`GET /api/ai/status`', 'session', 'Whether the assistant is configured and ready, and on which model.']
            ]
          }
        },

        { type: 'h3', de: 'Notausgang: ausgesperrtes Konto', en: 'Break-glass: a locked-out account' },
        {
          type: 'p',
          de: 'Wenn jeder Admin gleichzeitig gesperrt ist, hilft kein UI mehr. `scripts/unlock-user.py` spricht direkt mit der Datenbank und setzt Fehlversuche, `locked_until` und `locked` zurück. Es ist der einzige Weg, der keine funktionierende Anmeldung voraussetzt.',
          en: 'When every admin is locked at once, no UI helps. `scripts/unlock-user.py` talks to the database directly and clears failed attempts, `locked_until` and `locked`. It is the one path that does not presuppose a working login.'
        },

        { type: 'h3', de: 'Logzeilen und was sie bedeuten', en: 'Log lines and what they mean' },
        {
          type: 'code',
          lang: 'text',
          file: 'typischer Start',
          code: `[dashboard] PostgreSQL target: dashboard@192.168.0.16:5432/zer0space
[metrics] standalone hosts: zs-state-01(192.168.0.16), zs-store-01(192.168.0.15)
[config] totp_enc_key loaded from: swarm secret     ← "auto-generated" wäre ein Warnzeichen
[config] ai_service_token loaded from: database
[dashboard] database ready (schema verified)
[crimson] gateway on /crimson (spa=…, api=…, sso=on)
[ai] gateway on /api/ai (service=http://ai:8000, ready)
[dashboard] listening :3000`
        },
        {
          type: 'table',
          head: { de: ['Zeile', 'Heißt', 'Was tun'], en: ['Line', 'Means', 'What to do'] },
          rows: {
            de: [
              ['`STARTING WITHOUT DATABASE`', 'Die App läuft, aber jede DB-Route antwortet 503.', '`DB_HOST`/`DB_PORT`/`DB_USER` prüfen und ob Postgres Verbindungen von diesem Knoten annimmt. Der Retry heilt von selbst.'],
              ['`SCHEMA INCOMPLETE — missing table(s):`', 'Ein Statement des Schemas ist gescheitert.', 'Die Statement-Fehler darüber lesen; meist darf der DB-Benutzer nicht `CREATE TABLE`.'],
              ['`totp_enc_key loaded from: auto-generated`', 'Kein Swarm-Secret, keine Umgebungsvariable, keine DB-Zeile.', 'Nur beim allerersten Start normal. Danach heißt es, dass etwas den persistenten Schlüssel verloren hat — 2FA würde nach einem Neustart brechen.'],
              ['`[metrics] OFFLINE <host> (<ip>)`', 'Glances antwortet nicht.', 'Läuft der Agent? Ist Port 61208 erreichbar? Ist die Adresse aus `Status.Addr` noch richtig?'],
              ['`[crimson] upstream unreachable`', 'Backend oder Client-Stack sind nicht da.', 'Existiert `crimson_net`? Läuft der Stack? Antwort ist ein sauberes 502, kein 500.'],
              ['`[ai] service unreachable`', 'Der KI-Dienst ist noch nicht oben oder nicht im selben Overlay.', '`/api/ai/*` antwortet 503 mit Code `AI_UNREACHABLE`.'],
              ['`[dashboard] auto-generated SESSION_SECRET stored in DB`', 'Kein Secret konfiguriert.', 'Funktioniert (überlebt Neustarts), aber ein echtes Swarm-Secret ist besser — dann berührt der Wert die Datenbank nie.']
            ],
            en: [
              ['`STARTING WITHOUT DATABASE`', 'The app runs, but every DB route answers 503.', 'Check `DB_HOST`/`DB_PORT`/`DB_USER` and that Postgres accepts connections from this node. The retry heals on its own.'],
              ['`SCHEMA INCOMPLETE — missing table(s):`', 'A schema statement failed.', 'Read the statement errors above it; usually the DB user may not `CREATE TABLE`.'],
              ['`totp_enc_key loaded from: auto-generated`', 'No Swarm secret, no env var, no DB row.', 'Only normal on the very first boot. After that it means something lost the persistent key — 2FA would break after a restart.'],
              ['`[metrics] OFFLINE <host> (<ip>)`', 'Glances is not answering.', 'Is the agent running? Is port 61208 reachable? Is the address from `Status.Addr` still right?'],
              ['`[crimson] upstream unreachable`', 'The backend or client stack is not there.', 'Does `crimson_net` exist? Is the stack running? The answer is a clean 502, not a 500.'],
              ['`[ai] service unreachable`', 'The AI service is not up yet, or not on the same overlay.', '`/api/ai/*` answers 503 with code `AI_UNREACHABLE`.'],
              ['`[dashboard] auto-generated SESSION_SECRET stored in DB`', 'No secret configured.', 'Works (survives restarts), but a real Swarm secret is better — then the value never touches the database.']
            ]
          }
        },

        { type: 'h3', de: 'Offene Punkte auf dem Cluster', en: 'Open items on the cluster' },
        {
          type: 'note',
          tone: 'warn',
          title: { de: 'Nicht durch Code behoben', en: 'Not fixed by code' },
          de: 'Diese Punkte gehören zum Cluster-Zustand, nicht zu einem Repo, und kein Merge hakt sie ab: **(1)** Der alte Crimson-`SIGNUP_INVITE_CODE` (`zer0space`) stand als Compose-Standard in einem öffentlichen Repo — er gilt als verbrannt und muss rotiert werden. **(2)** `CRIMSON_SSO_INVITE_CODE` als Stack-Env in Portainer setzen, sonst bleibt der SSO-Broker still aus. **(3)** `dashboard_dashboard_net` ist noch nicht verschlüsselt (geringes Risiko, solange Dashboard und socketproxy auf demselben Knoten liegen). **(4)** Glances-Port 61208 ist auf jedem Knoten weiterhin unauthentifiziert — `ufw` ist auf diesen Knoten **nicht** installiert, also iptables/nft verwenden und reboot-fest machen.',
          en: 'These belong to cluster state, not to a repository, and no merge checks them off: **(1)** The old Crimson `SIGNUP_INVITE_CODE` (`zer0space`) shipped as a compose default in a public repository — treat it as burned and rotate it. **(2)** Set `CRIMSON_SSO_INVITE_CODE` as stack env in Portainer, otherwise the SSO broker stays silently off. **(3)** `dashboard_dashboard_net` is not encrypted yet (low risk while dashboard and socketproxy sit on the same node). **(4)** Glances port 61208 is still unauthenticated on every node — `ufw` is **not** installed on these nodes, so use iptables/nft and make it survive a reboot.'
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'api',
      icon: 'api-app',
      title: { de: 'API-Referenz', en: 'API reference' },
      blocks: [
        {
          type: 'lead',
          de: 'Jede Route des Dashboards. **Öffentlich** heißt: kein Guard. **Session** heißt: `_require_session`. **Admin** heißt: `_require_admin`. Alles außer den drei Ausnahmen braucht bei zustandsändernden Methoden zusätzlich den Header `X-CSRF-Token`.',
          en: 'Every route of the dashboard. **Public** means no guard. **Session** means `_require_session`. **Admin** means `_require_admin`. Everything but the three exemptions additionally needs the `X-CSRF-Token` header on state-changing methods.'
        },

        { type: 'h3', de: 'Seiten', en: 'Pages' },
        {
          type: 'table',
          head: { de: ['Route', 'Zugang', 'Bemerkung'], en: ['Route', 'Access', 'Note'] },
          rows: {
            de: [
              ['`GET /`', 'öffentlich', 'Landingpage.'],
              ['`GET /login`', 'öffentlich', 'Leitet zu `/dashboard` bei bestehender Session, zu `/setup` bei leerer Benutzertabelle.'],
              ['`GET /register`', 'öffentlich', 'Rendert unabhängig davon, ob `?code=` gültig ist — sonst wäre die Seite ein Orakel für den Code-Raum.'],
              ['`GET /setup`', 'öffentlich, **selbstversiegelnd**', 'Erreichbar nur, solange `users` leer ist.'],
              ['`GET /dashboard`', 'Session', 'Die SPA.'],
              ['`GET /monitoring`', 'Session', 'Die Wandansicht.'],
              ['`GET /docs`', 'Session', 'Diese Seite.'],
              ['`GET /healthz`, `/favicon.ico`, `/static/*`', 'öffentlich', 'Auch im Wartungsmodus erreichbar.']
            ],
            en: [
              ['`GET /`', 'public', 'Landing page.'],
              ['`GET /login`', 'public', 'Redirects to `/dashboard` with a session, to `/setup` on an empty users table.'],
              ['`GET /register`', 'public', 'Renders regardless of whether `?code=` is valid — otherwise the page would be an oracle for the code space.'],
              ['`GET /setup`', 'public, **self-sealing**', 'Only reachable while `users` is empty.'],
              ['`GET /dashboard`', 'session', 'The SPA.'],
              ['`GET /monitoring`', 'session', 'The wall view.'],
              ['`GET /docs`', 'session', 'This page.'],
              ['`GET /healthz`, `/favicon.ico`, `/static/*`', 'public', 'Reachable in maintenance mode too.']
            ]
          }
        },

        { type: 'h3', de: 'Konto und Sitzung', en: 'Account and session' },
        {
          type: 'table',
          head: { de: ['Route', 'Zugang', 'Was sie tut'], en: ['Route', 'Access', 'What it does'] },
          rows: {
            de: [
              ['`POST /api/setup`', 'öffentlich, CSRF-frei', 'Erster Admin. 201, oder 403 `SETUP_CLOSED`.'],
              ['`POST /api/login`', 'öffentlich, CSRF-frei', '200, oder **202 `{requires_2fa: true}`**, oder 401/423/429.'],
              ['`POST /api/2fa/login`', 'schwebende Session', 'Schritt 2. CSRF **gilt** hier, es gibt schon eine Session.'],
              ['`POST /api/register`', 'öffentlich, CSRF-frei', 'Code einlösen. Jeder Fehlschlag: 400 `INVITE_INVALID`.'],
              ['`POST /api/logout`', 'beliebig', 'Zerstört die Session, löscht das Cookie.'],
              ['`GET /api/me`', 'Session', 'Benutzername, Rolle, Theme, **csrfToken**, `vaultUnlocked`, `totpEnabled`.'],
              ['`POST /api/change-password`', 'Session', 'Verschlüsselt den Tresor mit neuem Schlüssel neu.'],
              ['`PUT /api/user/theme`', 'Session', 'Preset-Name oder `#rrggbb`.'],
              ['`POST /api/2fa/setup` / `verify` / `disable`', 'Session', 'Siehe [Zwei-Faktor](#twofa).']
            ],
            en: [
              ['`POST /api/setup`', 'public, CSRF-exempt', 'First admin. 201, or 403 `SETUP_CLOSED`.'],
              ['`POST /api/login`', 'public, CSRF-exempt', '200, or **202 `{requires_2fa: true}`**, or 401/423/429.'],
              ['`POST /api/2fa/login`', 'pending session', 'Step 2. CSRF **does** apply here, a session already exists.'],
              ['`POST /api/register`', 'public, CSRF-exempt', 'Redeem a code. Every failure: 400 `INVITE_INVALID`.'],
              ['`POST /api/logout`', 'any', 'Destroys the session, clears the cookie.'],
              ['`GET /api/me`', 'session', 'Username, role, theme, **csrfToken**, `vaultUnlocked`, `totpEnabled`.'],
              ['`POST /api/change-password`', 'session', 'Re-encrypts the vault with the new key.'],
              ['`PUT /api/user/theme`', 'session', 'A preset name or `#rrggbb`.'],
              ['`POST /api/2fa/setup` / `verify` / `disable`', 'session', 'See [Two-factor](#twofa).']
            ]
          }
        },

        { type: 'h3', de: 'Daten', en: 'Data' },
        {
          type: 'table',
          head: { de: ['Route', 'Zugang', 'Was sie tut'], en: ['Route', 'Access', 'What it does'] },
          rows: {
            de: [
              ['`GET /api/overview`', 'Session', 'Alles für die Startansicht in einer Anfrage: Kacheln, Knoten, Standalone-Hosts, Swarm, Backup.'],
              ['`GET /api/metrics`', 'Session', 'Nur die Metriken. 503, wenn der Docker-Proxy weg ist.'],
              ['`GET /api/status`', 'Session', 'Swarm-Zusammenfassung.'],
              ['`GET /api/backup`', 'Session', 'Backup-Status je Knoten.'],
              ['`GET /api/services`', 'Session', 'Der Dienste-Katalog.'],
              ['`GET /api/settings`', 'Session', 'Nur die Allowlist `theme`, `bg_mode`, `bg_file`.'],
              ['`GET/POST/PUT/DELETE /api/vault[/:id]`', 'Session', 'Tresor-CRUD. 409 `VAULT_LOCKED`, wenn kein Schlüssel in der Session liegt.']
            ],
            en: [
              ['`GET /api/overview`', 'session', 'Everything the home view needs in one request: tiles, nodes, standalone hosts, swarm, backup.'],
              ['`GET /api/metrics`', 'session', 'Metrics only. 503 when the Docker proxy is gone.'],
              ['`GET /api/status`', 'session', 'Swarm summary.'],
              ['`GET /api/backup`', 'session', 'Backup status per node.'],
              ['`GET /api/services`', 'session', 'The service catalogue.'],
              ['`GET /api/settings`', 'session', 'The allowlist only: `theme`, `bg_mode`, `bg_file`.'],
              ['`GET/POST/PUT/DELETE /api/vault[/:id]`', 'session', 'Vault CRUD. 409 `VAULT_LOCKED` when no key is in the session.']
            ]
          }
        },
        {
          type: 'note',
          tone: 'crit',
          title: { de: 'Warum `/api/settings` eine Allowlist ist', en: 'Why `/api/settings` is an allowlist' },
          de: 'Die Tabelle `settings` ist **keine reine UI-Konfiguration** — der Session-Signierschlüssel liegt darin. Diese Route ist für jeden angemeldeten Benutzer lesbar; die Tabelle komplett zurückzugeben hieße, jedem Viewer das Geheimnis zu geben, mit dem Session-Cookies signiert werden. Das reicht, um eine Admin-Session zu fälschen. Deshalb eine **Allowlist statt einer Denylist**: ein später hinzugefügter interner Schlüssel darf nicht dadurch weltlesbar werden, dass niemand daran gedacht hat, ihn auszuschließen.',
          en: 'The `settings` table is **not purely UI configuration** — the session signing key lives in it. This route is readable by any authenticated user, so returning the table wholesale would hand every viewer the secret used to sign session cookies. That is enough to forge an admin session. Hence an **allowlist rather than a denylist**: an internal key added later must not silently become world-readable because nobody remembered to exclude it.'
        },

        { type: 'h3', de: 'Admin', en: 'Admin' },
        {
          type: 'table',
          head: { de: ['Route', 'Was sie tut'], en: ['Route', 'What it does'] },
          rows: {
            de: [
              ['`POST/PUT/DELETE /api/services[/:id]`', 'Dienste-Kacheln pflegen.'],
              ['`PUT /api/settings`', 'Nur die Allowlist, Wert höchstens 512 Zeichen.'],
              ['`POST /api/invite`', 'Code erzeugen. 1–90 Tage, `maxRole`, Kontingent 20/h.'],
              ['`GET /api/invites`', 'Alle Codes mit Status `active`/`used`/`expired`.'],
              ['`DELETE /api/invite/:id`', 'Nur **unbenutzte** Codes.'],
              ['`GET /api/users`', 'Liste mit Rolle, Fehlversuchen, Sperren, 2FA.'],
              ['`POST /api/users/:id/unlock`', 'Setzt Fehlversuche und beide Sperren zurück.'],
              ['`POST /api/users/:id/lock`', 'Manuelle, unbefristete Sperre. Nicht der letzte Admin, nicht man selbst.'],
              ['`POST /api/users/:id/reset-2fa`', 'Für verlorene Geräte.'],
              ['`PUT /api/users/:id/password`', '**Löscht den Tresor des Ziels.** Antwortet `{vaultWiped: true}`.'],
              ['`PUT /api/users/:id/role`', 'Nicht der letzte Admin.'],
              ['`DELETE /api/users/:id`', 'Räumt Tresor, Wiederherstellungscodes und KI-Verläufe auf; Einladungszeilen bleiben, nur abgekoppelt.'],
              ['`GET /api/login-attempts`', 'Audit, `limit` 1–500.'],
              ['`GET /api/health/schema`', 'Fehlende Tabellen.']
            ],
            en: [
              ['`POST/PUT/DELETE /api/services[/:id]`', 'Maintain the service tiles.'],
              ['`PUT /api/settings`', 'The allowlist only, value at most 512 characters.'],
              ['`POST /api/invite`', 'Mint a code. 1–90 days, `maxRole`, quota 20/h.'],
              ['`GET /api/invites`', 'Every code with status `active`/`used`/`expired`.'],
              ['`DELETE /api/invite/:id`', 'Unredeemed codes **only**.'],
              ['`GET /api/users`', 'List with role, failed attempts, locks, 2FA.'],
              ['`POST /api/users/:id/unlock`', 'Clears failed attempts and both locks.'],
              ['`POST /api/users/:id/lock`', 'Manual, indefinite lock. Not the last admin, not yourself.'],
              ['`POST /api/users/:id/reset-2fa`', 'For a lost device.'],
              ['`PUT /api/users/:id/password`', '**Wipes the target\'s vault.** Answers `{vaultWiped: true}`.'],
              ['`PUT /api/users/:id/role`', 'Not the last admin.'],
              ['`DELETE /api/users/:id`', 'Cleans up vault, recovery codes and AI history; invite rows are kept but detached.'],
              ['`GET /api/login-attempts`', 'Audit, `limit` 1–500.'],
              ['`GET /api/health/schema`', 'Missing tables.']
            ]
          }
        },

        { type: 'h3', de: 'KI und Crimson', en: 'AI and Crimson' },
        {
          type: 'table',
          head: { de: ['Route', 'Zugang', 'Was sie tut'], en: ['Route', 'Access', 'What it does'] },
          rows: {
            de: [
              ['`GET /api/ai/status`', 'Session', 'Antwortet ohne den KI-Dienst zu kontaktieren, wenn das Gateway aus ist.'],
              ['`POST /api/ai/chat`', 'Session', 'Server-Sent Events. Der Cluster-Snapshot wird serverseitig angehängt.'],
              ['`GET/DELETE /api/ai/conversations[/:id]`', 'Session', 'Immer nur die eigenen — es wird keine `userId` weitergereicht.'],
              ['`GET/PUT /api/ai/config`, `/config/test`, `/models`, `/providers`', 'Admin', 'Wird unverändert an den KI-Dienst durchgereicht, der die Form des Dokuments besitzt.'],
              ['`GET /crimson`, `/crimson/{path}`', 'Session', 'Sonst 303 auf `/login`.'],
              ['`* /crimson/api/{path}`', 'Session', 'Sonst 401. CSRF-ausgenommen (Crimson hat kein zer0space-Token), gedeckt durch `samesite=strict`.'],
              ['`GET /{name}_proxy[/{rest}]`', 'Session', 'Medien-Relays an der Wurzel, Name gegen `^[a-z0-9][a-z0-9_-]{0,39}$` geprüft.']
            ],
            en: [
              ['`GET /api/ai/status`', 'session', 'Answers without contacting the AI service when the gateway is off.'],
              ['`POST /api/ai/chat`', 'session', 'Server-Sent Events. The cluster snapshot is attached server-side.'],
              ['`GET/DELETE /api/ai/conversations[/:id]`', 'session', 'Always only your own — no `userId` is forwarded.'],
              ['`GET/PUT /api/ai/config`, `/config/test`, `/models`, `/providers`', 'admin', 'Forwarded verbatim to the AI service, which owns the document\'s shape.'],
              ['`GET /crimson`, `/crimson/{path}`', 'session', 'Otherwise 303 to `/login`.'],
              ['`* /crimson/api/{path}`', 'session', 'Otherwise 401. CSRF-exempt (Crimson has no zer0space token), covered by `samesite=strict`.'],
              ['`GET /{name}_proxy[/{rest}]`', 'session', 'Root-level media relays, name checked against `^[a-z0-9][a-z0-9_-]{0,39}$`.']
            ]
          }
        },

        { type: 'h3', de: 'Fehlercodes, die man wiedersieht', en: 'Error codes you will meet again' },
        {
          type: 'table',
          head: { de: ['Code', 'Status', 'Heißt'], en: ['Code', 'Status', 'Means'] },
          rows: {
            de: [
              ['`UNAUTHORIZED`', '401', 'Nicht angemeldet — oder nur schwebend angemeldet (2FA offen).'],
              ['`FORBIDDEN_ADMIN`', '403', 'Angemeldet, aber kein Admin.'],
              ['`CSRF_INVALID`', '403', 'Header fehlt oder passt nicht.'],
              ['`CSRF_NOT_READY`', '—', 'Rein clientseitig: geklickt, bevor `/api/me` das Token gesetzt hat.'],
              ['`BAD_CREDENTIALS`', '401', 'Absichtlich generisch. Sagt nie, welche Hälfte falsch war.'],
              ['`ACCOUNT_LOCKED`', '423', 'Die **einzige** nicht-generische Antwort — und nur für jemanden, der das Passwort bereits bewiesen hat.'],
              ['`RATE_LIMITED`', '429', 'Mit `retryAfterMinutes`.'],
              ['`INVITE_INVALID`', '400', 'Deckt „existiert nicht", „abgelaufen", „schon benutzt" und „Name vergeben" ab.'],
              ['`VAULT_LOCKED`', '409', 'Kein Schlüssel in der Session — ab- und wieder anmelden.'],
              ['`DB_UNAVAILABLE`', '503', 'Datenbank nicht erreichbar. Nichts an der Anfrage war falsch.'],
              ['`BODY_TOO_LARGE`', '413', 'Über 512 KB (bzw. 32 MB auf dem Crimson-Pfad).'],
              ['`CRIMSON_UNREACHABLE`', '502', 'Backend oder Client-Stack sind nicht oben.'],
              ['`AI_UNREACHABLE` / `AI_NOT_CONFIGURED`', '503', 'KI-Dienst nicht erreichbar bzw. für dieses Deployment nicht eingerichtet.'],
              ['`INTERNAL`', '500', 'Details stehen im Log, nicht in der Antwort.']
            ],
            en: [
              ['`UNAUTHORIZED`', '401', 'Not signed in — or only pending (2FA outstanding).'],
              ['`FORBIDDEN_ADMIN`', '403', 'Signed in, but not an admin.'],
              ['`CSRF_INVALID`', '403', 'Header missing or mismatched.'],
              ['`CSRF_NOT_READY`', '—', 'Client-side only: a click that landed before `/api/me` set the token.'],
              ['`BAD_CREDENTIALS`', '401', 'Deliberately generic. Never says which half was wrong.'],
              ['`ACCOUNT_LOCKED`', '423', 'The **one** non-generic answer — and only for somebody who already proved they know the password.'],
              ['`RATE_LIMITED`', '429', 'With `retryAfterMinutes`.'],
              ['`INVITE_INVALID`', '400', 'Covers "no such code", "expired", "already used" and "username taken".'],
              ['`VAULT_LOCKED`', '409', 'No key in the session — sign out and back in.'],
              ['`DB_UNAVAILABLE`', '503', 'Database unreachable. Nothing was wrong with the request.'],
              ['`BODY_TOO_LARGE`', '413', 'Over 512 KB (or 32 MB on the Crimson path).'],
              ['`CRIMSON_UNREACHABLE`', '502', 'The backend or client stack is not up.'],
              ['`AI_UNREACHABLE` / `AI_NOT_CONFIGURED`', '503', 'AI service unreachable, or not set up for this deployment.'],
              ['`INTERNAL`', '500', 'The detail is in the log, not in the response.']
            ]
          }
        }
      ]
    },

    /* ====================================================================== */
    {
      id: 'conventions',
      icon: 'checklist',
      title: { de: 'Konventionen und Invarianten', en: 'Conventions and invariants' },
      blocks: [
        {
          type: 'lead',
          de: 'Die Regeln, die zwischen den Zeilen stehen — und die Liste der Dinge, die man **nicht** tun darf, ohne den Rest mitzudenken.',
          en: 'The rules that live between the lines — and the list of things you must **not** do without thinking the rest through.'
        },

        { type: 'h3', de: 'Sprache und Stil', en: 'Language and style' },
        {
          type: 'ul',
          de: [
            'Alles in den Repos — Code, Kommentare, Dokumentation, Commit-Nachrichten — ist auf **Englisch**. Das einzige Deutsche lebt im `de`-Wörterbuch in `i18n.js` und in dieser Docs-Seite, wo es **Daten** sind statt Code.',
            'Commit-Nachrichten folgen Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`.',
            'Python: `from __future__ import annotations` oben in jedem Modul, Typhinweise auf allem Öffentlichen, `snake_case`.',
            'JavaScript: eine IIFE pro Datei, `\'use strict\'`, keine Globals außer den dokumentierten `window.ZS_*` / `window.API` / `window.I18N`.',
            'Kommentare erklären **warum**, besonders die nicht offensichtlichen Abwägungen — nicht, was die Zeile tut.',
            'Eine Besonderheit: `zer0space-ai` und der KI-Code im Dashboard verwenden **keine Gedankenstriche**. Der Rest des Dashboard-Repos verwendet sie reichlich. Das ist bewusst so.'
          ],
          en: [
            'Everything in the repositories — code, comments, documentation, commit messages — is in **English**. The only German lives in the `de` dictionary in `i18n.js` and in this docs page, where it is **data** rather than code.',
            'Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`.',
            'Python: `from __future__ import annotations` at the top of every module, type hints on anything public, `snake_case`.',
            'JavaScript: one IIFE per file, `\'use strict\'`, no globals except the documented `window.ZS_*` / `window.API` / `window.I18N`.',
            'Comments explain **why**, especially the non-obvious trade-offs — not what the line does.',
            'One oddity: `zer0space-ai` and the AI code in the dashboard use **no em dashes**. The rest of the dashboard repo uses them heavily. That is deliberate.'
          ]
        },

        { type: 'h3', de: 'Nicht ohne Weiteres tun', en: 'Do not do this casually' },
        {
          type: 'table',
          head: { de: ['Nicht tun', 'Warum'], en: ['Do not', 'Why'] },
          rows: {
            de: [
              ['Repliken des Dashboards erhöhen', 'Der Session-Speicher liegt im Prozess. Zweite Replik = zufällige Logouts.'],
              ['Sessions in Cookie oder Datenbank auslagern', 'Beides gäbe den Tresorschlüssel aus der Hand — genau das, was der Tresor verhindert.'],
              ['`script-src` um `\'unsafe-inline\'` erweitern', 'Der Grund, warum es kein inline `<script>` gibt. Bequemlichkeit ist kein Grund.'],
              ['Einen Exception-Handler für `OSError`/`ConnectionError` registrieren', 'Jeder unbeteiligte Socket-Fehler würde zu „Datenbank nicht erreichbar".'],
              ['Die automatische Kontosperre dauerhaft machen', 'Der Admin-Name ist ratbar; das Dashboard wäre für immer abschließbar.'],
              ['`DASHBOARD_USER`/`DASHBOARD_PASS` wieder einführen', 'Es gibt genau zwei Wege zu einem Konto: der Setup-Assistent und ein Einladungscode.'],
              ['Ein `ports:` beim KI-Dienst hinzufügen', 'Er authentifiziert keine Benutzer. Erreichbarkeit bricht das Sicherheitsmodell, nicht nur die Portliste.'],
              ['Ein mutierendes Werkzeug in die KI-Registry legen', 'Die CI bricht — absichtlich, bis jemand auch den Freigabe-Roundtrip baut.'],
              ['Das Tresor-Wire-Format ändern', 'Bestehende Einträge ließen sich nicht mehr entschlüsseln.'],
              ['SQL per String-Verkettung bauen', 'Es gibt genau eine interpolierte Stelle im Projekt, und die hat eine Allowlist.'],
              ['`ZS_UI.esc()` oder `safeUrl()` umgehen', 'Dienstnamen, Hostnamen und Audit-Zeilen sind benutzergesteuert.'],
              ['Ein Frontend-Framework oder einen Bundler einführen', 'Die Bau-Freiheit ist der Grund, warum die ausgelieferte Datei die Datei im Git ist.'],
              ['Einen Schlüssel aus Secret oder Umgebung in `settings` zurückschreiben', 'Eine alte Zeile würde beim nächsten Boot den echten Schlüssel überschreiben.'],
              ['Echte Passwörter, Hashes, Tokens oder Connection-Strings committen', '`.env.example` ist eine Vorlage mit Platzhaltern, sonst nichts.']
            ],
            en: [
              ['Raise the dashboard\'s replica count', 'The session store is in-process. A second replica means random logouts.'],
              ['Move sessions into the cookie or the database', 'Either would give away the vault key — exactly what the vault prevents.'],
              ['Add `\'unsafe-inline\'` to `script-src`', 'It is the reason there is no inline `<script>`. Convenience is not a reason.'],
              ['Register an exception handler for `OSError`/`ConnectionError`', 'Every unrelated socket error would become "database unavailable".'],
              ['Make the automatic account lock permanent', 'The admin name is guessable; the dashboard would become lockable for good.'],
              ['Reintroduce `DASHBOARD_USER`/`DASHBOARD_PASS`', 'There are exactly two paths to an account: the setup wizard and an invite code.'],
              ['Add a `ports:` entry to the AI service', 'It authenticates no users. Reachability breaks the security model, not just the port list.'],
              ['Put a mutating tool in the AI registry', 'CI breaks — deliberately, until somebody also builds the approval round trip.'],
              ['Change the vault wire format', 'Existing entries would stop decrypting.'],
              ['Build SQL by string concatenation', 'There is exactly one interpolated place in the project, and it has an allowlist.'],
              ['Bypass `ZS_UI.esc()` or `safeUrl()`', 'Service names, hostnames and audit rows are user-controlled.'],
              ['Introduce a frontend framework or a bundler', 'The no-build property is why the served file is the file in git.'],
              ['Write a secret- or env-sourced key back into `settings`', 'A stale row would clobber the real key on the next boot.'],
              ['Commit real passwords, hashes, tokens or connection strings', '`.env.example` is a template with placeholders and nothing else.']
            ]
          }
        },

        { type: 'h3', de: 'Wenn man etwas hinzufügt', en: 'When you add something' },
        {
          type: 'ul',
          numbered: true,
          de: [
            '**Neue Route?** Guard nicht vergessen — sie ist sonst öffentlich. Und einen stabilen `code` für jede Fehlerantwort vergeben.',
            '**Neuer Fehlercode?** Passenden `err.<CODE>`-Schlüssel in **beide** Wörterbücher.',
            '**Neuer sichtbarer Text?** Die drei Stellen aus [Frontend](#frontend) — beide Wörterbücher, `data-i18n` im Markup, `t()` im JS.',
            '**Neue JS-gerenderte Ansicht?** Den `languagechange:zs`-Listener erweitern, sonst bleibt sie beim Sprachwechsel stehen.',
            '**CSS oder JS geändert?** `ASSET_VERSION` in `src/main.py` erhöhen.',
            '**Schema geändert?** In `SCHEMA` in `db.py`, rückwärtskompatibel, und falls es eine Kerntabelle ist: in `REQUIRED_TABLES`.',
            '**Diese Docs-Seite betroffen?** Den passenden Abschnitt in `static/js/docs-content.js` mitziehen — beide Sprachen.'
          ],
          en: [
            '**New route?** Do not forget the guard — it is public otherwise. And give every error response a stable `code`.',
            '**New error code?** A matching `err.<CODE>` key in **both** dictionaries.',
            '**New visible text?** The three places from [Frontend](#frontend) — both dictionaries, `data-i18n` in the markup, `t()` in the JS.',
            '**New JS-rendered view?** Extend the `languagechange:zs` listener, otherwise it freezes on a language switch.',
            '**Changed CSS or JS?** Bump `ASSET_VERSION` in `src/main.py`.',
            '**Changed the schema?** In `SCHEMA` in `db.py`, backwards-compatible, and if it is a core table: in `REQUIRED_TABLES`.',
            '**Does it touch this docs page?** Update the matching section in `static/js/docs-content.js` — both languages.'
          ]
        },
        {
          type: 'note',
          tone: 'ok',
          title: { de: 'Diese Seite ist Dokumentation des echten Systems', en: 'This page documents the real system' },
          de: 'Jedes Codebeispiel hier ist aus der Datei kopiert, die darüber steht. Es ist **kein** paralleles Designdokument, das auseinanderdriften darf: ändert sich der Code, ändert sich dieser Abschnitt mit. Der Ort ist `static/js/docs-content.js`, die Blocktypen stehen oben in der Datei.',
          en: 'Every code sample here is copied from the file named above it. This is **not** a parallel design document allowed to drift: when the code changes, this section changes with it. The place is `static/js/docs-content.js`, and the block types are documented at the top of that file.'
        }
      ]
    }

  ]
};
