"use strict";
/* ============================================================
   СВЯТА ЗА КАЛЕНДАРЕМ 🗓️ — дев'ять подій на рік у справжні дати.
   Працюють на тій самій машинці, що й Свято Миколая (js/event.js): власний генератор і ланцюжок,
   замовлення від господарів свята, бали свята (своя іконка), шкала нагород, історія.
   Рухомі свята (Масляна, Великдень, Зелені свята) рахуються від православної пасхалії.
   Стан: S.ev — поточне свято (як і раніше); S.evDone — id уже завершених.
   ============================================================ */
const HOL_KEYS = ["rizdvo", "maslyana", "velykden", "triytsia", "kupala", "spas", "nezalezhnist", "pokrova"];
const HOL_ART = HOL_KEYS.flatMap(k => [0, 1, 2, 3, 4, 5].map(l => `hol-${k}-${l}`).concat("gen-hol-" + k, "yard-" + k));   // аркуші H1–H4
HOL_ART.push(...["novyirik", "stritennia", "blahovishchennia", "maty", "vyshyvanka"].flatMap(k => [0, 1, 2, 3, 4, 5].map(l => `hol-${k}-${l}`).concat("gen-hol-" + k)));   // аркуші N1–N3
/* де в дворику стоїть велика мальована прикраса свята: x, y, розмір */
const HOL_YARD = { rizdvo: [22, 58, 17], maslyana: [26, 62, 17], velykden: [22, 58, 17], triytsia: [24, 62, 17],
  kupala: [50, 60, 17], spas: [24, 62, 16], nezalezhnist: [24, 60, 17], pokrova: [24, 60, 16] };
const HOL_MS = [
  { pts: 10, reward: { energy: 10 } }, { pts: 25, reward: { chest: 0 } }, { pts: 45, reward: { coins: 200 } },
  { pts: 70, reward: { chest: 1, stars: 2 }, story: "mid" }, { pts: 100, reward: { energy: 25, coins: 300 } },
  { pts: 140, reward: { chest: 2, stars: 5 }, story: "final" }
];
/* православний Великдень (за юліанською пасхалією) → григоріанська дата */
function orthodoxEaster(y) {
  const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7;
  const m = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
  return new Date(y, m - 1, day + 13);
}
const fromEaster = (y, a, b) => { const E = orthodoxEaster(y), at = n => new Date(E.getFullYear(), E.getMonth(), E.getDate() + n).getTime(); return { start: at(a), end: at(b) }; };   // календарними днями (без зсуву через літній час)
const fixed = (y, m1, d1, m2, d2, y2 = y) => ({ start: new Date(y, m1, d1).getTime(), end: new Date(y2, m2, d2).getTime() });
/* n-й день тижня місяця (wd: 0 — неділя, 4 — четвер) і вікно довкола нього, календарними днями */
const nthDay = (y, m, wd, n) => { const d = new Date(y, m, 1); const off = (wd - d.getDay() + 7) % 7; return new Date(y, m, 1 + off + (n - 1) * 7); };
const around = (d, a, b) => ({ start: new Date(d.getFullYear(), d.getMonth(), d.getDate() + a).getTime(), end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + b).getTime() });
/* коротші свята — скромніша шкала нагород */
const HOL_MS_SHORT = [
  { pts: 6, reward: { energy: 5 } }, { pts: 15, reward: { chest: 0 } }, { pts: 28, reward: { coins: 120 } },
  { pts: 42, reward: { chest: 1, stars: 2 }, story: "mid" }, { pts: 60, reward: { coins: 200 } },
  { pts: 80, reward: { chest: 2, stars: 4 }, story: "final" }
];
const HOL_MS_TINY = [
  { pts: 4, reward: { energy: 5 } }, { pts: 10, reward: { chest: 0 } }, { pts: 18, reward: { coins: 100 } },
  { pts: 28, reward: { chest: 1, stars: 2 }, story: "mid" }, { pts: 40, reward: { coins: 150 } },
  { pts: 55, reward: { chest: 2, stars: 3 }, story: "final" }
];
const HOL_MS_MID = [
  { pts: 8, reward: { energy: 8 } }, { pts: 20, reward: { chest: 0 } }, { pts: 36, reward: { coins: 160 } },
  { pts: 55, reward: { chest: 1, stars: 2 }, story: "mid" }, { pts: 80, reward: { energy: 15, coins: 250 } },
  { pts: 110, reward: { chest: 2, stars: 5 }, story: "final" }
];

const HOLIDAYS = [
  { key: "rizdvo", title: tt`Різдвяні свята`, pt: "🕯️", ptName: tt`свічечки`, gen: ["🌾", tt`Дідух`], who: ["ivan", "taras", "halya"],
    window: y => fixed(y, 11, 15, 11, 31),
    desc: tt`Готуємо Святвечір і колядки! Тапай дідуха, об'єднуй святкові страви й віддавай колядникам.`,
    items: [["🌾", tt`Колосок`], ["🕯️", tt`Свічечка`], ["🥣", tt`Кутя`], ["🥯", tt`Пампушки`], ["🌟", tt`Різдвяна зірка`], ["🎄", tt`Святвечірній стіл`]],
    deco: [["🎄", 22, 52, 12], ["🌟", 78, 30, 6], ["🕯️", 70, 70, 5], ["🌾", 30, 74, 6]],
    story: {
      intro: [["halya", tt`{name}, Святвечір на носі! 🕯️ Треба дванадцять страв наготувати, а дідуха я вже поставила в твоєму дворику 🌾`],
        ["ivan", tt`А ми з Тарасом колядників збираємо! Тапай дідуха — будуть колоски, свічечки, кутя… Віддавай нам — за кожне свічечки 🕯️`]],
      mid: [["taras", tt`Ми вже пів села обколядували! «Добрий вечір тобі, пане господарю…» 🎶`], ["halya", tt`А кутя цього року — найсмачніша! Мак сама терла 😄`]],
      final: [["ivan", tt`Усе село колядувало до ранку! 🌟 Христос народився!`], ["halya", tt`Славімо Його! І тобі, {name}, дякуємо — без тебе такого свята не було б 💛`]],
      ending: [["halya", tt`Різдвяні свята минули, а дідух ще довго стоятиме на покуті 🌾`]] } },
  { key: "maslyana", title: tt`Масляна`, pt: "🥞", ptName: tt`млинці`, gen: ["🧈", tt`Масляна піч`], who: ["andriy", "halya", "olya"],
    window: y => fromEaster(y, -56, -48),
    desc: tt`Тиждень млинців і вареників із сиром! Тапай піч, об'єднуй частування й віддавай сусідам.`,
    items: [["🧀", tt`Сирок`], ["🥟", tt`Вареник із сиром`], ["🥞", tt`Млинець`], ["🍯", tt`Млинці з медом`], ["🎀", tt`Колодка зі стрічками`], ["🔥", tt`Опудало Масляни`]],
    deco: [["🔥", 26, 70, 7], ["🎀", 74, 66, 5], ["🎈", 80, 34, 6]],
    story: {
      intro: [["andriy", tt`{name}, Масляна! 🥞 Цілий тиждень — млинці, вареники з сиром і гуляння!`], ["halya", tt`Я піч розтопила в твоєму дворику. Тапай — а млинці віддавай нам, рахуватимемо 🥞`]],
      mid: [["olya", tt`Хлопці колодку чіпляють неодруженим — Андрію, а ти чого ховаєшся? 😄`], ["andriy", tt`Та я ж кухар, мені ніколи! …Ну хіба один млинчик 🥞`]],
      final: [["halya", tt`Спалили опудало Масляни — зима, прощавай! 🔥`], ["andriy", tt`Ще ніколи стільки млинців не пекли. Дякую, {name}! 🥞`]],
      ending: [["halya", tt`Масляна минула — попереду піст і весна 🌱`]] } },
  { key: "velykden", title: tt`Великдень`, pt: "🥚", ptName: tt`крашанки`, gen: ["🧺", tt`Великодній кошик`], who: ["halya", "olya", "marichka"],
    window: y => fromEaster(y, -6, 4),
    desc: tt`Печемо паски й пишемо писанки до Великодня! Тапай кошик, об'єднуй і віддавай сусідам.`,
    items: [["🥚", tt`Яйце`], ["🔴", tt`Крашанка`], ["🎨", tt`Писанка`], ["🥮", tt`Паска`], ["🧺", tt`Кошик до церкви`], ["⛪", tt`Святковий кошик із рушником`]],
    deco: [["🌸", 22, 52, 11], ["🧺", 72, 72, 5], ["🥚", 30, 76, 4]],
    story: {
      intro: [["halya", tt`{name}, Великдень іде! 🥚 Будемо паски пекти й писанки писати — я вже й віск розтопила`], ["marichka", tt`Я поставила тобі кошик! Тапай — і віддавай нам крашанки, писанки, паски 🧺`]],
      mid: [["olya", tt`Подивись, яку писанку Марічка написала — з півниками! 🐓`], ["marichka", tt`А в тебе, {name}, із ружами виходять найкращі 🌸`]],
      final: [["halya", tt`Христос воскрес! 🥚 Кошики освячено, паски — пухкі, як хмаринки`], ["olya", tt`Воістину воскрес! Битимемося крашанками — чия міцніша? 😄`]],
      ending: [["halya", tt`Великдень минув, а писанки ще цілий рік берегтимуть хату 💛`]] } },
  { key: "triytsia", title: tt`Зелені свята`, pt: "🌿", ptName: tt`гілочки`, gen: ["🌿", tt`Клечання`], who: ["marichka", "stepan", "liza"],
    window: y => fromEaster(y, 45, 52),
    desc: tt`Прикрашаємо хати зеленню на Трійцю! Тапай клечання, об'єднуй і віддавай сусідам.`,
    items: [["🌱", tt`Травинка`], ["🌿", tt`Гілочка липи`], ["🍃", tt`Пучок аїру`], ["🚪", tt`Клечання на воротах`], ["🌸", tt`Зелений вінок`], ["🏡", tt`Хата в зелені`]],
    deco: [["🌿", 24, 70, 7], ["🌿", 76, 70, 7], ["🌳", 18, 50, 11]],
    story: {
      intro: [["marichka", tt`{name}, Зелені свята! 🌿 Треба хату заквітчати — липою, клечанням, аїром на підлогу`], ["stepan", tt`Я тобі клечання наламав. Тапай — і роздавай сусідам зелень 🌿`]],
      mid: [["liza", tt`Як же пахне в хаті аїром! Наче в лісі 🌿`], ["stepan", tt`Отож! Дід мій казав: заквітчана хата — щаслива хата`]],
      final: [["marichka", tt`Усе село зелене-зелене! 🌳 Найгарніші свята в році`], ["liza", tt`Дякуємо, {name}! Зелень до осені стоятиме 💚`]],
      ending: [["marichka", tt`Зелені свята минули — а літо тільки починається ☀️`]] } },
  { key: "kupala", title: tt`Івана Купала`, pt: "🌸", ptName: tt`квіточки`, gen: ["🔥", tt`Купальське вогнище`], who: ["liza", "marichka", "olya"],
    window: y => fixed(y, 5, 20, 5, 26),
    desc: tt`Найкоротша ніч року! Тапай вогнище, плети вінки й шукай цвіт папороті.`,
    items: [["🌼", tt`Ромашка`], ["💐", tt`Польові квіти`], ["🌸", tt`Віночок`], ["🕯️", tt`Свічка у вінку`], ["🛶", tt`Вінок на воді`], ["✨", tt`Цвіт папороті`]],
    deco: [["🔥", 50, 64, 8], ["🌼", 28, 78, 5], ["🕯️", 72, 76, 4]],
    story: {
      intro: [["liza", tt`{name}, Купала! 🔥 Сьогодні плетемо вінки й пускаємо на воду — а вночі шукаємо цвіт папороті!`], ["marichka", tt`Я вогнище розклала в твоєму дворику. Тапай — і віддавай нам квіточки 🌸`]],
      mid: [["olya", tt`Мій вінок поплив далеко-далеко… Може, і мені суджений знайдеться? 🥹`], ["liza", tt`Знайдеться! Тільки через вогнище стрибнути не забудь 😄🔥`]],
      final: [["marichka", tt`Ми знайшли цвіт папороті! ✨ Ну… майже. Але бажання я загадала!`], ["liza", tt`Дякую, {name}! Найчарівніша ніч у році 🌸`]],
      ending: [["liza", tt`Купальська ніч минула — а вінки ще пливуть річкою 🌼`]] } },
  { key: "spas", title: tt`Три Спаси`, pt: "🍯", ptName: tt`медові краплинки`, gen: ["🐝", tt`Вулик`], who: ["stepan", "halya", "andriy"],
    window: y => fixed(y, 7, 1, 7, 18),
    desc: tt`Медовий, Яблучний і Горіховий Спас — 1, 6 і 16 серпня! Тапай вулик, об'єднуй і неси святити.`,
    items: [["🍏", tt`Яблучко`], ["🍯", tt`Стільник`], ["🫙", tt`Глечик меду`], ["🧺", tt`Кошик яблук`], ["🍪", tt`Медяник`], ["🎁", tt`Освячений кошик`]],
    deco: [["🍯", 26, 72, 5], ["🧺", 72, 72, 5], ["🌳", 80, 48, 11]],
    story: {
      intro: [["stepan", tt`{name}, Медовий Спас! 🍯 Я вулик тобі поставив — бджілки цього року наносили меду, як ніколи`], ["halya", tt`А за тиждень — Яблучний Спас 🍏 Тапай вулик і віддавай нам мед та яблука!`]],
      mid: [["andriy", tt`Медяники з першим медом — це щось! 🍪 Пахне на все село`], ["stepan", tt`Отож. А яблука до Спаса — не їсти! Стерпи ще трошки 😄`]],
      final: [["halya", tt`Кошики освятили — мед, яблука, мак 🧺 Тепер можна й скуштувати!`], ["stepan", tt`Дякую, {name}. Солодкого тобі року, як цей мед 🍯`]],
      ending: [["stepan", tt`Спаси минули — а мед у коморі ще всю зиму радуватиме 🍯`]] } },
  { key: "nezalezhnist", title: tt`День Незалежності`, pt: "🌻", ptName: tt`соняшники`, gen: ["🎪", tt`Святкова сцена`], who: ["taras", "iryna", "ivan"],
    window: y => fixed(y, 7, 20, 7, 26),
    desc: tt`Свято всієї країни! Тапай сцену, готуй вишиванки й віддавай сусідам.`,
    items: [["🎗️", tt`Синьо-жовта стрічка`], ["🌾", tt`Колосся`], ["🌻", tt`Соняшник`], ["👕", tt`Вишиванка`], ["🍞", tt`Святковий коровай`], ["🎆", tt`Святковий салют`]],
    deco: [["🎈", 22, 36, 6], ["🎈", 78, 36, 6], ["🌻", 28, 74, 5], ["🌻", 72, 74, 5]],
    story: {
      intro: [["iryna", tt`{name}, День Незалежності! 💙💛 Діти з моєї школи готують концерт — допоможеш?`], ["taras", tt`Я сцену поставив у твоєму дворику! Тапай — і віддавай нам усе для свята 🌻`]],
      mid: [["ivan", tt`Усе село у вишиванках — аж очі радіють! 👕`], ["iryna", tt`А діти так співають «Ой у лузі червона калина»… я аж плакала 🥹`]],
      final: [["taras", tt`Салют! 🎆 Слава Україні!`], ["iryna", tt`Героям слава! Дякуємо, {name}, — найкраще свято в селі 💙💛`]],
      ending: [["iryna", tt`Свято минуло, а соняшники й далі дивляться на сонце 🌻`]] } },
  { key: "pokrova", title: tt`Покрова`, pt: "🍂", ptName: tt`листочки`, gen: ["🍁", tt`Осінній кошик`], who: ["olya", "andriy", "halya"],
    window: y => fixed(y, 8, 27, 9, 4),
    desc: tt`Свято Покрови й захисників! Тапай кошик, збирай осінні дари й віддавай сусідам.`,
    items: [["🍒", tt`Гроно калини`], ["🍁", tt`Кленовий листок`], ["🧣", tt`Хустка`], ["🎀", tt`Рушник`], ["🎃", tt`Гарбуз`], ["🥧", tt`Покровський пиріг`]],
    deco: [["🍂", 30, 76, 6], ["🍁", 70, 74, 6], ["🎃", 24, 66, 5]],
    story: {
      intro: [["olya", tt`{name}, Покрова! 🍂 Свято осені й наших захисників. Пироги, калина, хустки…`], ["andriy", tt`Я кошик поставив у твоєму дворику — тапай і віддавай нам осінні дари 🍁`]],
      mid: [["halya", tt`Кажуть: на Покрову дівчата свататися чекають 😄 Олю, чого почервоніла?`], ["olya", tt`Та то від калини! 🍒`]],
      final: [["andriy", tt`Пиріг на все село спекли! 🥧 А частину — нашим захисникам`], ["halya", tt`Хай Покрова вкриває всіх наших. Дякую, {name} 💛`]],
      ending: [["olya", tt`Покрова минула — попереду золота осінь 🍂`]] } },
  /* ---------- нові свята ---------- */
  { key: "novyirik", title: tt`Новий рік і Водохреще`, pt: "✨", ptName: tt`іскорки`, gen: ["🧺", tt`Кошик щедрувальників`], who: ["marichka", "taras", "andriy"], ms: "mid",
    window: y => fixed(y, 11, 31, 0, 11, y + 1),
    desc: tt`Щедрий вечір, засівання на Новий рік і Водохреще! Тапай кошик щедрувальників, об'єднуй гостинці й віддавай.`,
    items: [["🌾", tt`Посівальне зерно`], ["🍬", tt`Цукерки щедрувальникам`], ["🍊", tt`Мандаринки`], ["🎁", tt`Новорічний подарунок`], ["🎆", tt`Феєрверк`], ["🕊️", tt`Голуб Водохреща`]],
    deco: [["🎆", 78, 24, 6], ["✨", 22, 30, 5], ["🎁", 70, 72, 5], ["🕊️", 30, 40, 5]],
    story: {
      intro: [["marichka", tt`{name}, сьогодні Щедрий вечір! 🌟 Ми підемо щедрувати, а зранку хлопці прийдуть засівати зерном — на щастя!`],
        ["andriy", tt`А я наготую щедру кутю й вареники. Тапай кошик щедрувальників, віддавай нам гостинці — за кожен іскорки ✨`]],
      mid: [["taras", tt`Щедрик, щедрик, щедрівочка… 🎶 Я записав, як Марічка щедрує — на все село слава!`], ["marichka", tt`А мені насипали стільки цукерок, що кишені рвуться 😄`]],
      final: [["andriy", tt`З Новим роком! 🎆 А на Водохреще вся громада ходила до річки святити воду 💧`], ["marichka", tt`І голубів пускали в небо! 🕊️ Дякуємо, {name}, — свято вдалося!`]],
      ending: [["halya", tt`Святки закінчилися. Хай рік буде щедрим і мирним 💛`]] } },
  { key: "stritennia", title: tt`Стрітення`, pt: "🌤️", ptName: tt`сонечка`, gen: ["🕯️", tt`Громична свічка`], who: ["halya", "stepan", "olya"], ms: "short",
    window: y => fixed(y, 0, 30, 1, 6),
    desc: tt`Зима з весною зустрічаються! Тапай громичну свічку, збирай прикмети весни й віддавай сусідам.`,
    items: [["🧊", tt`Бурулька`], ["💧", tt`Крапля відлиги`], ["🕯️", tt`Громична свічка`], ["🐦", tt`Перша пташка`], ["🌱", tt`Перший паросток`], ["🌤️", tt`Весняне сонце`]],
    deco: [["🕯️", 24, 70, 5], ["🌤️", 78, 16, 7], ["🐦", 70, 40, 4]],
    story: {
      intro: [["halya", tt`{name}, на Стрітення зима з весною зустрічаються! ❄️🌤️ Як сьогодні тепло — весна буде рання 😊`],
        ["stepan", tt`А я засвічу громницю — від грому й біди. Тапай свічку, збирай прикмети весни — за них сонечка 🌤️`]],
      mid: [["olya", tt`Бурульки капають — весна вже стукає у вікна! 💧`], ["halya", tt`Перші пташки прилетіли — на добро 🐦`]],
      final: [["stepan", tt`Зима поступилася! 🌤️ Весна виграла цей поєдинок`], ["olya", tt`Скоро сіятимемо — дякую, {name}, що зустріли весну разом 💛`]],
      ending: [["halya", tt`Громницю сховаю за образи — хай береже хату до літа 🕯️`]] } },
  { key: "blahovishchennia", title: tt`Благовіщення`, pt: "🕊️", ptName: tt`голубки`, gen: ["🪺", tt`Пташине гніздечко`], who: ["olya", "iryna", "liza"], ms: "short",
    window: y => fixed(y, 2, 21, 2, 29),
    desc: tt`«Птиця гнізда не в'є» — весна прийшла! Печемо жайворонків, випускаємо голубів. Тапай гніздечко й віддавай.`,
    items: [["🌱", tt`Паросток`], ["🌷", tt`Тюльпан`], ["🥨", tt`Тістечко-жайворонок`], ["🐦", tt`Весняна пташка`], ["🕊️", tt`Голубка`], ["💐", tt`Весняний букет`]],
    deco: [["🕊️", 76, 24, 6], ["🌷", 26, 76, 5], ["🪺", 72, 64, 6]],
    story: {
      intro: [["iryna", tt`Сьогодні Благовіщення — «птиця гнізда не в'є» 🕊️ А весна вже точно прийшла!`],
        ["olya", tt`Напечемо жайворонків і випустимо голубів! Тапай гніздечко, збирай весняне — за все голубки 🕊️`]],
      mid: [["liza", tt`Діти бігають із жайворонками й кличуть весну: «Весна, весна красна!» 🎶`], ["olya", tt`А в мене перший тюльпан розпустився 🌷`]],
      final: [["iryna", tt`Голуби злетіли над селом 🕊️ — тепер весна наша!`], ["liza", tt`Дякуємо, {name}! Це найсвітліше свято весни 💛`]],
      ending: [["olya", tt`Благовіщення минуло — пора сіяти 🌱`]] } },
  { key: "maty", title: tt`День матері`, pt: "💐", ptName: tt`букетики`, gen: ["🌷", tt`Клумба для мам`], who: ["marichka", "liza", "andriy"], ms: "tiny",
    window: y => around(nthDay(y, 4, 0, 2), -1, 2),
    desc: tt`Друга неділя травня — свято мам і бабусь! Тапай клумбу, готуй квіти, листівки й смаколики.`,
    items: [["🌼", tt`Ромашка`], ["💌", tt`Листівка`], ["🍰", tt`Тістечко`], ["🎀", tt`Подарунок із бантом`], ["💐", tt`Букет для мами`], ["🧺", tt`Кошик-сюрприз`]],
    deco: [["💐", 24, 74, 6], ["🎀", 76, 70, 5], ["💖", 50, 20, 5]],
    story: {
      intro: [["marichka", tt`{name}, у неділю День матері! 💐 Хочу зробити мамі й бабусі Галі найкращі подарунки!`],
        ["liza", tt`Допоможемо! Тапай клумбу — квіти, листівки, тістечка… Віддавай нам, за кожен — букетики 💐`]],
      mid: [["andriy", tt`Я спік для всіх мам у селі торт із полуницею 🍰`], ["marichka", tt`А я листівку намалювала — тільки нікому не кажи! 🤫`]],
      final: [["halya", tt`Ой, діточки, які подарунки… аж сльози на очах 🥹 Дякую вам!`], ["marichka", tt`Мамо, бабусю — ми вас любимо! 💛 Дякую, {name}!`]],
      ending: [["liza", tt`Кожен день — трохи День матері. Обійміть своїх мам 💛`]] } },
  { key: "vyshyvanka", title: tt`День вишиванки`, pt: "🧵", ptName: tt`ниточки`, gen: ["🧺", tt`Кошик вишивальниці`], who: ["olya", "iryna", "taras"], ms: "short",
    window: y => around(nthDay(y, 4, 4, 3), -2, 3),
    desc: tt`Третій четвер травня — усі у вишиванках! Тапай кошик вишивальниці, вишивай і даруй.`,
    items: [["🧵", tt`Нитки`], ["🪡", tt`Голка з ниткою`], ["🌸", tt`Вишита квітка`], ["🧣", tt`Вишита хустка`], ["👕", tt`Сорочка-вишиванка`], ["👗", tt`Святковий стрій`]],
    deco: [["👕", 24, 66, 7], ["🧵", 76, 72, 5], ["🌸", 70, 30, 5]],
    story: {
      intro: [["olya", tt`{name}, у четвер — День вишиванки! 🧵 Усе село вдягне вишиванки, а я ще й нові вишиваю`],
        ["iryna", tt`А в школі — свято вишиванок! Тапай кошик вишивальниці, віддавай нам — за все ниточки 🧵`]],
      mid: [["taras", tt`Фотографую всіх у вишиванках — буде альбом «Наше село вишите» 📸`], ["olya", tt`Кожна вишиванка — своя історія: червоне — любов, чорне — земля 🧵`]],
      final: [["iryna", tt`Ціле село у вишиванках! 👕👗 Яка ж це сила й краса!`], ["taras", tt`Найкращий кадр року. Дякую, {name}! 💛`]],
      ending: [["olya", tt`Вишиванку — не лише на свято. Носімо її з гордістю 💛`]] } }
];

window.PUA_MAP = window.PUA_MAP || {};
HOLIDAYS.forEach((h, k) => {
  const art = id => HOL_ART.includes(id) ? `items/${id}.webp` : null;
  const chain = "hol_" + h.key;
  CHAINS[chain] = { name: h.title, items: h.items.map(([e, n], l) => { const c = String.fromCharCode((k < 8 ? 0xE600 + k * 16 : 0xE700 + (k - 8) * 16) + l); PUA_MAP[c] = { e, img: art(`hol-${h.key}-${l}`) }; return [c, n]; }) };
  const g = String.fromCharCode(k < 8 ? 0xE6A0 + k : 0xE7A0 + (k - 8));
  PUA_MAP[g] = { e: h.gen[0], img: art("gen-hol-" + h.key) };
  GENS[chain] = { icon: g, name: h.gen[1], chain, holiday: true };
  /* велика прикраса двору: мальована фігура замість емодзі поруч */
  const at = HOL_YARD[h.key], yimg = art("yard-" + h.key);
  if (at && yimg) {
    const yc = String.fromCharCode(k < 8 ? 0xE6B0 + k : 0xE7B0 + (k - 8));
    PUA_MAP[yc] = { e: h.deco[0][0], img: yimg };
    window.PAINTED[yc.codePointAt(0).toString(16)] = yimg;
    h.deco = [[yc, ...at]].concat(h.deco.filter(d => Math.abs(d[1] - at[0]) > 15 || d[3] < 6));
  }
  Object.assign(h, { chain, gen: chain, genName: h.gen[1], milestones: h.ms === "tiny" ? HOL_MS_TINY : h.ms === "short" ? HOL_MS_SHORT : h.ms === "mid" ? HOL_MS_MID : HOL_MS });
});
if (GENS.mykolai) GENS.mykolai.holiday = true;
/* Миколай — теж у календарі (з тими самими даними, що й були) */
const HOL_ALL = [...HOLIDAYS, Object.assign({}, EVENT, { pt: "❄️", ptName: tt`сніжинки`, deco: [["❄️", 30, 30, 5], ["🎁", 70, 74, 5]],
  desc: tt`Допоможи Ірині й Марічці зібрати подарунки для сільських дітей! Тапай скриньку, об'єднуй подарунки й віддавай їм.` })];
HOL_ALL.sort((a, b) => a.window(2027).start - b.window(2027).start);   // у порядку року (від січня)

window.HOL = (() => {
  const now = () => window.DVORYK_NOW || Date.now();
  const winOf = (h, t = now()) => {
    const y = new Date(t).getFullYear();
    for (const yy of [y - 1, y]) { const w = h.window(yy); if (t >= w.start && t < w.end) return Object.assign({ y: yy }, w); }
    return Object.assign({ y }, h.window(y));
  };
  const inWin = (h, t = now()) => { const w = winOf(h, t); return t >= w.start && t < w.end; };
  const idOf = (h, t = now()) => h.key + "-" + winOf(h, t).y;
  const byKey = k => HOL_ALL.find(h => h.key === k);
  let cur = byKey("mykolai");
  /* обрати поточне свято й підставити його в EVENT (машинка js/event.js працює з EVENT) */
  function pick() {
    let h = null;
    if (S && S.ev && S.ev.intro && !S.ev.ended) h = byKey(S.ev.id.replace(/-\d+$/, ""));
    if (!h) { const done = (S && S.evDone) || []; h = HOL_ALL.filter(x => inWin(x) && !done.includes(idOf(x)) && !(S && S.ev && S.ev.id === idOf(x) && S.ev.ended)).sort((a, b) => winOf(a).start - winOf(b).start)[0] || null; }
    if (!h) h = next() || cur;
    if (h !== cur || EVENT.key !== h.key) { cur = h; Object.assign(EVENT, { key: h.key, title: h.title, window: h.window, chain: h.chain, gen: h.gen, who: h.who, milestones: h.milestones, story: h.story, pt: h.pt, desc: h.desc }); }
    if (typeof DAILY !== "undefined" && DAILY.snow) { DAILY.snow.icon = h.pt; DAILY.snow.text = tt`Збери ${h.ptName} на свято`; }
    return h;
  }
  const win = () => winOf(cur);
  /* найближче свято, що ще попереду */
  function next(t = now()) {
    let best = null, bt = Infinity;
    HOL_ALL.forEach(h => { const y = new Date(t).getFullYear(); [y, y + 1].forEach(yy => { const w = h.window(yy); if (w.start > t && w.start < bt) { bt = w.start; best = h; } }); });
    return best;
  }
  const fmt = ts => new Date(ts).toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
  function finished(id) { S.evDone = (S.evDone || []).concat(id).slice(-20); }
  /* прикраси свята в дворику */
  function yard() {
    if (!window.EV || !EV.active()) return [];
    return (cur.deco || []).map(([e, x, y, s], k) => ({ key: "hol-" + cur.key + "-" + k, e, x, y, s }));
  }
  /* календар свят */
  function calendar() {
    const t = now(), y = new Date(t).getFullYear();
    const andr = { h: { pt: "🥟", title: tt`Андріївські вечорниці (ворожіння)` }, w: (() => { let w = fixed(y, 10, 29, 11, 1); if (w.end <= t) w = fixed(y + 1, 10, 29, 11, 1); return w; })(), live: false };
    const rows = HOL_ALL.map(h => { let w = h.window(y); if (w.end <= t) w = h.window(y + 1); const live = inWin(h) && window.EV && EV.active() && cur === h;
      return { h, w, live }; }).concat([andr]).sort((a, b) => a.w.start - b.w.start)
      .map(({ h, w, live }) => `<div class="hl-row${live ? " live" : ""}"><span class="hl-ic">${h.pt}</span><span class="hl-t"><b>${h.title}</b><small>${fmt(w.start)} — ${fmt(w.end - 864e5)}</small></span>${live ? tt`<span class="hl-on">триває!</span>` : ""}</div>`).join("");
    modal({ title: tt`Свята року 🗓️`, html: tt`<p class="hint-s">Кожне свято — у свої справжні дні: окремий генератор, замовлення від господарів свята й шкала нагород.</p><div class="hl-list">${rows}</div>`,
      buttons: [...(window.EV && EV.active() ? [{ label: `${cur.pt} ${cur.title}`, onClick: () => EV.panel() }] : []), { label: tt`Закрити`, cls: "ghost" }] });
  }
  function card() {
    if (!S || !S.started) return null;
    if (window.EV && EV.active()) return { icon: cur.pt, title: cur.title, sub: tt`триває · ${S.ev.pts} ${cur.pt} зібрано`, btn: tt`Відкрити`, act: "hol-ev" };
    const n = next(); if (!n) return null;
    const w = winOf(n, now() + 1); const st = w.start > now() ? w.start : n.window(new Date(now()).getFullYear() + 1).start;
    return { icon: "🗓️", title: tt`Свята року`, sub: tt`наступне — ${n.title}, ${fmt(st)}`, btn: tt`Календар`, act: "hol-cal" };
  }
  return { pick, win, next, finished, yard, calendar, card, list: HOL_ALL, easter: orthodoxEaster };
})();
window.HUB_EXTRA = (window.HUB_EXTRA || []).concat([() => HOL.card()]);
window.HUB_ACTS = Object.assign(window.HUB_ACTS || {}, { "hol-cal": () => HOL.calendar(), "hol-ev": () => EV.panel() });

/* ============================================================
   АНДРІЇВСЬКІ ВЕЧОРНИЦІ 🥟 — 29–30 листопада, одна сценка з ворожінням на варениках
   (не окреме свято — щоб не перебивати Миколая). Стан: S.andr — рік, коли вже ворожили.
   ============================================================ */
window.ANDR = (() => {
  const now = () => new Date(window.DVORYK_NOW || Date.now());
  const busy = () => $("modal").classList.contains("show") || $("dialog").classList.contains("show");
  function tick() {
    if (!S || !S.started || S.level < 4 || S.sideOn || busy()) return;
    const d = now(); if (d.getMonth() !== 10 || d.getDate() < 29) return;
    if (S.andr === d.getFullYear()) return;
    S.andr = d.getFullYear(); save();
    playDialog([["liza", tt`{name}, сьогодні Андріївські вечорниці! 🕯️ Ворожимо, співаємо, жартуємо — ходімо!`],
      ["halya", tt`А я вареників наліпила з сюрпризами 🥟 Обирай один — і дізнаєшся, що тебе чекає цього року!`]], pick3);
  }
  function pick3() {
    modal({ title: tt`Ворожіння на варениках 🥟`, html: tt`<div class="big-emoji">🥟</div><p>Три вареники — у кожному свій сюрприз. Який обереш?</p>`,
      buttons: [tt`🥟 Лівий`, tt`🥟 Середній`, tt`🥟 Правий`].map(label => ({ label, onClick: reveal })) });
  }
  function reveal() {
    const r = Math.random(); let title, got;
    if (r < 0.34) { S.coins += 200; title = tt`З монеткою — до багатства! 💰`; got = "+200 🪙"; }
    else if (r < 0.67) {
      S.stars += 5; got = "+5 ⭐";
      const fr = typeof FRIENDS !== "undefined" ? Object.keys(FRIENDS).filter(k => k !== "cat" && CHARS[k] && (CHARS[k].from || 0) <= S.chapter) : [];
      if (fr.length) { const k = fr[Math.floor(Math.random() * fr.length)]; S.fr = S.fr || {}; S.fr[k] = Math.min(FRIEND_STEPS[2], (S.fr[k] || 0) + 1); got += ` · 💛 ${shortName(CHARS[k].name)}`; }
      title = tt`З вишнею — до кохання й дружби! 🍒`;
    } else { placeItem({ c: "chest", l: 1 }); title = tt`З сиром — до достатку в хаті! 🧀`; got = CHAINS.chest.items[1][0]; }
    save(); renderAll(); confetti(); sfx.level();
    modal({ title, html: tt`<div class="big-emoji">🥟</div><p class="rewards">${got}</p><p class="hint-s">Андріївські вечорниці — щороку 29–30 листопада.</p>`, buttons: [{ label: tt`Хай збудеться! 💛` }] });
  }
  return { tick };
})();
