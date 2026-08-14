# R6 — Партнёрство и интерфейсы DATEV

Задание из `brainstorm.md`, Priority 1. Дата: 12.08.2026.
Снято напрямую с `developer.datev.de` и партнёрских страниц DATEV браузером.
**[F]** факт · **[О]** оценка · **[?]** не найдено.

**Короткий ответ.**
1. **В DATEV-Marktplatz нельзя попасть до продукта** — нужен работающий интерфейс **и минимум
   25 клиентов**, которые им пользуются. Это веха Phase 2, а не условие старта.
2. **Нужный нам интерфейс существует и делает ровно то, что мы хотим** — `accounting:dxso-jobs`
   («DATEV Rechnungsdatenservice 1.0»): передаёт образы документов **и структурированные позиции**,
   из которых DATEV **сам генерирует предложения проводок** для программы Rechnungswesen.
3. **Но он упирается в то, что у нашего сегмента нет DATEV Unternehmen online.** Отсюда трёхступенчатый
   план: файл → API → Marktplatz.
4. **Sandbox доступен по самостоятельной регистрации**, без партнёрства и без звонков.

---

## 1. Партнёрская программа: две ступени и жёсткий порог

**Ступени [F]:**

| | DATEV-Marktplatz **Schnittstellen Partner** | DATEV-Marktplatz **Premium Partner** |
|---|---|---|
| Кто | поставщик с реализованным DATEV-интерфейсом; листинг, если решение осмысленно расширяет DATEV | отбирается и **рекомендуется самим DATEV**, тесное сотрудничество по рынку и разработке интерфейсов |
| Сертификация по защите данных и ИБ | **рекомендуется, но не обязательна** для листинга | **обязательна с 01.07.2026**, иначе статус теряется |

**Порог входа для Schnittstellen Partner [F]:**
- реализован **DATEV-Datenservice**, которым пользуются **минимум 25 клиентов**;
- **три референс-клиента**, с которыми DATEV связывается лично;
- (для зарплатных интеграций отдельно — `hr:exchange`, тоже от 25 клиентов).

**Процесс [F]:** подача документов → внутренняя проверка DATEV + обзвон референсов → вводная встреча →
презентация продукта → решение (индивидуальное, выполнение требований **не гарантирует** партнёрства).
После одобрения: договор → техническая проверка интерфейса на соответствие спецификации → проверка
документации и справочных материалов → согласование маркетинга → публикация в Marktplatz.

**Сроки и стоимость публично не указаны [?].**

**Что это значит для нас.** Partnerstatus — не вход, а следствие. Нельзя «сначала получить статус,
чтобы снять сомнения канцелярий», как предполагал бриф: сначала 25 работающих клиентов на интерфейсе,
потом статус. Планировать как **веху конца Phase 2**, а до неё жить без него.

---

## 2. Технические интерфейсы: что открыто третьим сторонам

Полный каталог Online-API на `developer.datev.de` **[F]** — релевантные нам:

| API | Что делает | Платность |
|---|---|---|
| **`accounting:dxso-jobs` 2.0** | **образы документов + структурированные данные счетов и кассы** в формате «DATEV XML-Schnittstelle online» ≥ 4.0 → в DATEV Unternehmen online | не отмечен как платный |
| `accounting:documents` 2.0 | передача цифровых **документов** без разрыва носителя через РЦ DATEV к Steuerberater | не отмечен |
| `accounting:extf-files` 2.0 | **движения и мастер-данные в «DATEV-Format»** в РЦ DATEV для выборки в DATEV Rechnungswesen | не отмечен |
| `cashregister:import` 2.6.0 | автоматическая загрузка файлов **кассовыми устройствами** (DATEV Kassenarchiv / Kassenmeldung) | не отмечен |
| `accounting:clients` 2.0 | список доступных Rechnungswesen-бестандов | не отмечен |
| `accounting:dataexchange` 1 | выборка бухгалтерских данных из Rechnungswesen | **платный, особые условия** |
| `master-data:master-clients` 3 | мастер-данные клиентов членов DATEV | **платный, особые условия** |

Отдельно есть сторонние API в портале (b4Value `smarttransfer:inbound/outbound`, `traffiqx:invoice`
для DATEV E-Rechnungsplattform) — нам не нужны.

**Аутентификация: OAuth 2.0 + OpenID Connect. Качество сервиса: PLATIN** (для `dxso-jobs`) **[F]**.

### `accounting:dxso-jobs` — это ровно наш сценарий

Дословно **[F]**: образы документов и структурированные данные счетов/кассы передаются из веб-приложений
в приложения внутри DATEV Unternehmen online в формате DATEV XML-Schnittstelle online версии 4.0+.
Из структурированных данных **генерируются позиции документов** для Belege Online (расширенная форма),
Rechnungseingangsbuch online, Rechnungsausgangsbuch online и/или Kassenbuch online. Документы
сохраняются в Belege Online и **автоматически привязываются** к позициям. А при передаче позиций
дальше **генерируются предложения проводок (Buchungsvorschläge) для программы DATEV Rechnungswesen**.
API прямо разрешён к использованию внешними веб-приложениями.

Это и есть «канцелярия получает всё чистым — заодно». Не CSV, который кто-то импортирует, а данные,
которые появляются там, где канцелярия уже работает.

**Полезное для разработки [F]:** DATEV даёт **Prüftool** (Hilfe-Center 1070393) для проверки, что
экспортированные XML формально и технически корректны и импортируются в Unternehmen online.
Это готовый внешний валидатор — вставляем в CI рядом с golden-file тестами.
Условия использования импорта позиций — документ 1071255.

### Порядок доступа [F]

Регистрация DATEV-аккаунта → вступление в организацию или её создание → создание приложения и
получение credentials → подписка на нужные API-продукты → **разработка на Sandbox** → запись на
техническую проверку и включение продуктива.

**Sandbox не требует ни партнёрства, ни 25 клиентов.** Начать техническую работу можно завтра.

---

## 3. Главная развилка: у нашего клиента нет Unternehmen online

`dxso-jobs` и `documents` пишут **в DATEV Unternehmen online**. По интервью [[I1-steuerberater]]:
«DATEV nutzen nur die mit großer Kanzlei, kleinen Betrieben ist das Abo zu teuer» — то есть у нашего
целевого сегмента портала мандата чаще всего **нет** (n=1, но согласуется с ценой 3,75 € и общей
картиной цифровизации из R3).

Отсюда честный вывод: **лучший интерфейс доступен не всем нашим клиентам**, и строить на нём
единственный путь нельзя. Нужны три пути одновременно, по состоянию клиента.

---

## 4. Рекомендация: три ступени

### Ступень 1 — MVP, без партнёрства и без зависимостей: **файл EXTF**

Как уже записано в `CLAUDE.md`: **EXTF-Buchungsstapel CSV**. Что важно знать **[F]**:
- EXTF = *Erweitertes TransFer Format*, CSV с разделителем `;`, заголовочная строка + по строке
  на проводку; актуальный номер версии в заголовке — **700**;
- официальное описание — документ DATEV **1034038** «Buchungsstapel und Stammdaten im DATEV-Format»;
- есть открытые референс-реализации (`ledermann/datev`, `ameax/datev-extf`) с примерами файлов —
  годятся как вторая пара глаз к нашим golden-file тестам **[F]**.

Ограничения ступени 1 **[О]**: канцелярия импортирует руками; ошибки формата видит только она;
образы документов идут отдельно; никакой обратной связи о том, что импорт прошёл.
Зато: работает у **любого** клиента и любой канцелярии, ноль зависимостей, ноль согласований.

### Ступень 2 — Phase 2: **`accounting:dxso-jobs`** для клиентов, у которых есть Unternehmen online

Даёт то, ради чего всё затевалось: документы и позиции попадают в UO, DATEV сам делает предложения
проводок. Плюс `accounting:extf-files` как вторая, более простая опция — залить тот же EXTF в РЦ
вместо ручного импорта. Работать начинать **сейчас** — Sandbox открыт.
Побочно: **`cashregister:import`** ложится на волну B (DSFinV-K) и открывает Kassenarchiv/Kassenmeldung.

### Ступень 3 — конец Phase 2 / Phase 3: **Marktplatz**

Когда наберётся 25 клиентов на интерфейсе и найдутся три референс-канцелярии. Тогда же решать про
сертификацию по защите данных и ИБ: для Schnittstellen Partner она **не обязательна**, для Premium —
обязательна с 01.07.2026.

---

## 5. Прецеденты

- **Finmatics** — партнёр DATEV-Marktplatz, 4,8/5, 1 300+ канцелярий и компаний; интеграция через
  сервисы **Belegbild, Rechnungsdaten, Buchungsdaten + Unternehmen online** **[F]**.
- **Candis** — в DATEV-Marktplatz, нативный DATEV-интерфейс **[F]**.
- **Lightspeed Restaurant K-Series** — тоже листинг в Marktplatz **[F]** (кассовая сторона).
- **Tac** — заявляет прямую интеграцию DATEV, статус в Marktplatz **[?]**.
- **GetMyInvoices** — экспорт в DATEV/Finmatics/Candis, статус партнёра **[?]**.

Вывод: все наши соседи по нише прошли этот путь. Порог в 25 клиентов проходим — но только после
того, как продукт продан.

---

## 6. Что осталось непроверенным

- **Стоимость** партнёрства и листинга — публично нет **[?]**. Спросить письмом в DATEV Partnering.
- **Сроки** прохождения процесса **[?]**.
- Требуется ли **у клиента отдельная лицензия/включение** DATEVconnect online для использования
  `dxso-jobs` (документ 1071255 описывает Nutzungsvoraussetzungen — доступен из Hilfe-Center,
  вероятно после входа) **[?]**.
- Есть ли **лимиты вызовов и объёмов** у бесплатных API **[?]** — видно после подписки в Sandbox.
- Что именно означает **PLATIN** в шкале качества сервиса **[?]**.

**Первый шаг, который стоит ноль:** зарегистрироваться на developer.datev.de, создать организацию
и приложение, подписаться на `accounting:dxso-jobs` и `accounting:extf-files`, забрать спецификацию
XML 4.0 и Prüftool. Это снимает половину оставшихся вопросов и не требует ни партнёрства, ни бюджета.

## Источники

- [DATEV Developer Portal](https://developer.datev.de/de/) · [Каталог API-продуктов](https://developer.datev.de/de/products) ·
  [`accounting:dxso-jobs` 2.0 — Überblick](https://developer.datev.de/de/product-detail/accounting-dxso-jobs/2.0/overview)
- [DATEV-Marktplatz — Erste Schritte zum Partnerstatus](https://www.datev.de/web/de/berufsgruppenuebergreifend/ueber-datev/portfolio/oekosystem/partnering/datev-marktplatz/erste-schritte-zum-partnerstatus) ·
  [FAQ für Software-Hersteller](https://www.datev.de/web/de/berufsgruppenuebergreifend/ueber-datev/portfolio/oekosystem/partnering/datev-marktplatz/faq-fuer-softwarehersteller) ·
  [Zertifikate Premium Partner (PDF)](https://www.datev.de/content/dam/markenassets/themen-und-produktgruppen/zielgruppen/datev-marktplatz-partner/information_zertifikate_datev_marktplatz_premium_partner.pdf)
- [DATEV Hilfe: Buchungsstapel und Stammdaten im DATEV-Format (1034038)](https://wissensplattform.apps.datev.de/help/document/1034038) ·
  [EXTF — разбор формата](https://auditplan.io/datev-buchungsstapel-extf) ·
  [Референс-реализация `ledermann/datev`](https://github.com/ledermann/datev/blob/master/examples/EXTF_Buchungsstapel.csv)
