# R5 — Конкуренты и SEO-ландшафт InvoiceGen

Задание из `brainstorm.md`, Priority 1. Дата: 12.08.2026.
**[F]** факт · **[О]** оценка · **[?]** не найдено.

**Метод.** Выдача снята через DuckDuckGo с региональным параметром `kl=de-de` (прокси немецкого SERP;
Google из автоматизации недоступен). Оценок трафика нет — для этого нужны платные инструменты **[?]**.
Тарифы и функции сняты с сайтов напрямую браузером.

> **Короткий ответ: все четыре гипотезы дифференциации InvoiceGen опровергнуты.**
> Дизайн по текущей спеке начинать нельзя. Варианты — в §6.

---

## 1. Бенчмарк easyerechnung.de — разобран, и он не работает

Первое, что видно на каждой странице **[F]**:

> «Внимание: EasyRechnung в настоящее время работает в **тестовом режиме**. Реальные платежи
> не принимаются и услуги не предоставляются.»

То есть эталон, на который мы равнялись, **не является работающим бизнесом**. Как ориентир по
фичам он годится, как доказательство жизнеспособности модели — нет.

**Тарифы [F]:**

| | Free | Pro | Business |
|---|---|---|---|
| Цена | **0 €** | **7,99 €/мес** | **19,99 €/мес** |
| Счетов | 3/мес | безлимит | безлимит |
| XRechnung & ZUGFeRD, PDF & XML | да | да | да |
| Профилей компании | 1 | 1 | **2–3** |
| Без водяного знака | да | да | да |
| Аналитика и налоговый прогноз | да | да | да |
| Статусы, Mahnung | да | да | да |
| Управление клиентами | — | да | да |
| **Командный доступ (Steuerberater)** | — | — | **да** |
| Приоритетная поддержка | — | — | да |

Годовая оплата — экономия 38 %.

**SEO-конструкция [F]:** бесплатные инструменты `/tools/invoice-generator`, **`/tools/xml-validator`**
(«ZUGFeRD & XRechnung XML-Prüfer… EN 16931, Drag & Drop im Browser»), `/tools/mwst-rechner`,
`/tools/iban-validator`; шаблоны по профессиям `/vorlagen/{kosmetiker|gaertner|physiotherapeut|friseur|lehrer}`;
`/ratgeber`; страница сравнений `/alternative` (против sevDesk, lexoffice, FastBill, invoiz);
партнёрская программа; языки **DE/EN/RU/TR** с корректным `hreflang`.

**Слабое место, которое видно сразу [F]:** на всех проверенных страницах `h1` — это просто
«EasyRechnung», а не тема страницы. Для сайта, построенного на SEO, это грубая ошибка вёрстки.

**Важно:** «Командный доступ (Steuerberater)» уже продаётся за 19,99 € — то есть **наш мост к
канцелярии как дифференциатор занят у самого бенчмарка**.

---

## 2. Ниша Viewer — не пуста. Она переполнена, и там сидит государство

Выдача по «XRechnung öffnen / anzeigen / lesen / visualisieren» **[F]**:

- **Специализированные домены под один запрос:** `xrechnungs.de`, `xrechnung-online.de`,
  `xrechnung-lesen.de`, `erechnung-tool.de`, `e-rechnung.tools`, `digital-rechnung.de`,
  `rechnex.de`, `baseinvoice.eu`, `e-rechnungen.org`
- **Крупные игроки с бесплатным вьюером как контент-маркетингом:** **sevdesk.de**, `papierkram.de`
- **Open source:** `jcthiele.github.io/OpenXRechnungToolbox`
- **И главное — государство**

**Финансовая администрация раздаёт вьюер бесплатно** на `e-rechnung.elster.de`: загрузить файл,
**вход в ELSTER не требуется** **[F]**. Запущен до 01.01.2025 по прямому лоббированию ZDH, который
добивался «kostenfreier Software von der Finanzverwaltung» **[F]**. Его продвигают Handwerkskammern
(HWK Pfalz, HWK Berlin-Brandenburg), отраслевые объединения (Metallhandwerk) и земли — министр
финансов Баварии выпустил отдельный пресс-релиз **[F]**.

**Вывод:** конкурировать за «XRechnung öffnen» бессмысленно не потому, что трудно ранжироваться,
а потому что **пользователю не нужен ещё один вьюер**, когда налоговая даёт свой без регистрации,
а его рекомендует его же палата.

---

## 3. Валидатор — то же самое, включая государственный

Выдача по «XRechnung validieren / E-Rechnung prüfen» **[F]**:

`erechnungsvalidator.service-bw.de` — **валидатор земли Баден-Вюртемберг** · `erechnungs-validator.de`
(«kostenlos, **KoSIT** & EN 16931») · `zugferd-validator.de` · `xvalidator.de` · `eu-rechnung.de` ·
`online-rechnungen.de` · `e-rechnungs-checker.de` · `ebill-checker.de`

Щель, которую я называл в прошлом отчёте единственной оставшейся («настоящая KoSIT-валидация»),
**тоже закрыта**: минимум один игрок заявляет KoSIT прямо, плюс работает государственный сервис.

---

## 4. Генераторы: карта и цены

| Продукт | Бесплатно | Регистрация | Форматы | Вьюер/валидатор | Платный тариф |
|---|---|---|---|---|---|
| **kostenlose-erechnung.de** | **3 счёта/мес** | **не нужна** **[F]** | PDF · **ZUGFeRD 2.5** · **XRechnung 3.0.2** **[F]** | **да, + KoSIT-схема** **[F]** | **от 9,92 €/мес** **[F]** |
| **easyerechnung.de** | 3 счёта/мес | нужна | PDF · XML · XRechnung · ZUGFeRD | да, XML-валидатор | 7,99 / 19,99 € **[F]** |
| **PDF24 Tools** | да | нет | PDF, E-Rechnung **[F]** | — | бесплатно (домен-гигант) |
| **kundenbuch.de** | да, **«ohne Anmeldung»** **[F]** | нет | E-Rechnung | — | **[?]** |
| **e-rechnungsprogramm.de** | генератор **[F]** | **[?]** | E-Rechnung | — | **[?]** |
| **123rechnung.com** | «kostenloses Rechnungsprogramm» **[F]** | да | **[?]** | — | **[?]** |
| **BilledOK** (из R2) | да, без лимита | **нет** **[F]** | создание + просмотр + из PDF **[F]** | **да** **[F]** | воронка в 24–444 € |
| **sevDesk / Lexware / FastBill / Billomat / Papierkram / Zervant** | вьюеры и калькуляторы как контент | да | все | да | 10–30 €/мес |

**`kostenlose-erechnung.de` — это буквально спроектированный нами InvoiceGen**, уже работающий:
тот же бесплатный лимит 3 счёта/мес, те же три формата, **без регистрации**, со встроенной
KoSIT-проверкой, и платный тариф от 9,92 €.

---

## 5. Карта запросов: где что

| Кластер | Интент | Состояние |
|---|---|---|
| XRechnung öffnen / anzeigen / lesen / visualisieren · ZUGFeRD öffnen | tool | **насыщен + государство (ELSTER)** |
| XRechnung validieren · E-Rechnung prüfen | tool | **насыщен + государство (service-bw)** |
| E-Rechnung erstellen kostenlos | tool | насыщен: PDF24, kundenbuch, e-rechnungsprogramm, chip.de |
| Rechnung schreiben kostenlos · Rechnungsvorlage kostenlos | tool/шаблон | старый насыщенный рынок: rechnungen-muster, rechnungsvorlagen.de, buhl, 123rechnung |
| E-Rechnung Pflicht (Kleinunternehmer, Fristen) | info | ведомства (**BMF**, IHK) + sevDesk + агрегаторы |
| Rechnungsvorlage **по профессиям** (`/vorlagen/friseur` …) | tool, long tail | **относительно свободно** — но это низкочастотка с низкой ценностью **[О]** |

Единственное место, где ещё есть воздух, — длинный хвост шаблонов по профессиям. Это ровно то,
что easyerechnung уже строит, и это не основание для продукта.

---

## 6. Вердикт по гипотезам и что делать

| Гипотеза InvoiceGen | Вердикт |
|---|---|
| Бесплатный **Viewer** как SEO-магнит, ниша пуста | **Опровергнута.** Насыщена; государство раздаёт бесплатно без регистрации |
| Бесплатный **Validator** (KoSIT) как SEO-магнит | **Опровергнута.** Насыщена, включая земельный сервис |
| Настоящий **DATEV-экспорт** как отличие | **Не проверена [?]** — и это фича, а не воронка. Для **исходящих** счетов потребность слабее: канцелярия и так их получает |
| **Мост к Steuerberater** | **Опровергнута.** У бенчмарка это уже продаётся в тарифе за 19,99 € |

**Рекомендация: не начинать дизайн InvoiceGen как отдельного продукта.** Не потому, что рынок
большой и сложный, а потому, что **у продукта не осталось ни одного отличия**, а воронка, ради
которой он задумывался, перекрыта в том числе государством.

Три варианта, в порядке моего предпочтения:

**A. Свернуть InvoiceGen в функцию GastroBeleg (рекомендую).**
У ресторана есть исходящие счета: кейтеринг, банкеты, корпоративные клиенты, поставки в офисы.
С 2028 их придётся выставлять как E-Rechnung. Мы всё равно пишем парсеры и генераторы EN 16931 —
превратить это в кнопку «выставить счёт» для существующего клиента стоит недорого, CAC равен нулю,
и это усиливает основной продукт вместо того, чтобы конкурировать за самый вытоптанный SEO-луг
Германии. Маркетинговое агентство переориентируется на GastroBeleg и полевой канал.

**B. Оставить бесплатные инструменты, но как воронку GastroBeleg, а не отдельный бренд.**
Ровно то, что делает BilledOK: `/tools/*` на нашем домене → регистрация в основном продукте.
Дёшево, но и отдача скромная — конкуренция та же.

**C. Продолжать InvoiceGen только при новой дифференциации вне SEO.** Например язык и сегмент
(предприниматели-мигранты: DE/TR/RU/AR/PL) — но easyerechnung уже DE/EN/RU/TR, так что и это
не пустое поле. Требует отдельного ресёрча до любых вложений.

**Что это значит для партнёров:** решение по InvoiceGen влияет на договорённость с маркетинговым
агентством (revenue share был завязан на InvoiceGen как основной объект продвижения) — обсудить
до следующего этапа.

---

## 7. Что осталось непроверенным

- **Трафик** бесплатных инструментов конкурентов — нужны платные SEO-данные **[?]**.
- **Google-выдача** (проверял через DuckDuckGo de-de) — порядок может отличаться, состав игроков
  вряд ли **[О]**.
- **DATEV-экспорт** у kostenlose-erechnung.de, PDF24, kundenbuch.de **[?]**.
- **Отзывы и слабости** easyerechnung — продукт в тестовом режиме, отзывов нет **[F]**.
- **Юридический статус** бесплатных валидаторов (заявление «KoSIT» ≠ официальная сертификация) **[?]**.

## Источники

Бенчмарк: [easyerechnung.de](https://easyerechnung.de) — тарифы, инструменты, шаблоны, `hreflang`
(снято браузером 12.08.2026)
Государственные сервисы: [E-Rechnung-Viewer der Finanzverwaltung](https://www.erechnung.elster.de/) ·
[ELSTER — E-Rechnung ansehen](https://www.elster.de/eportal/e-rechnung) ·
[E-Rechnungs-Validator service-bw](https://erechnungsvalidator.service-bw.de) ·
[HWK: kostenfreier Viewer über ELSTER](https://www.hwk-bls.de/artikel/e-rechnungen-kostenfreier-viewer-ueber-elster-portal-22,0,3248.html) ·
[Bayern: Pressemitteilung E-Rechnungs-Viewer](https://www.bayern.de/fueracker-e-rechnungs-viewer-neues-innovatives-tool-aus-bayern-einfache-schnelle-und-unkomplizierte-e-rechnungsverwaltung-fuer-jeden-tool-auch-ohne-elster-konto-kostenlos-nutzbar/) ·
[Handwerksblatt: Bund bietet kostenlose Software](https://www.handwerksblatt.de/themen-specials/die-e-rechnung-wird-pflicht-tipps-fuer-handwerksbetriebe/e-rechnungen-lesen-bund-bietet-eine-kostenlose-software)
Генераторы: [kostenlose-erechnung.de](https://kostenlose-erechnung.de/) ·
[PDF24 — E-Rechnung erstellen](https://tools.pdf24.org) · [OpenXRechnungToolbox](https://jcthiele.github.io)
Выдача: DuckDuckGo `kl=de-de`, 11 запросов, снято 12.08.2026
