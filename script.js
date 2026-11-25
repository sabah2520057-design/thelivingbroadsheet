/**
 * THE LIVING BROADSHEET — Core Engine & Investigative Lens
 * The Case of the Missing Marquess · London, 1888
 * (after Nancy Springer's Enola Holmes novels)
 *
 * Flow: sealed packet → fold-out reveal → Lady Eudoria's dossier & field-instinct
 * appraisal → six printed pages, chained clues, instruments docked in the blank
 * slots and hotspots in the print itself → barge climax → Kodak keepsake & share card.
 */
(() => {
  "use strict";

  /* ======================================================================
     CONFIG — answers, positions and copy live here
     ====================================================================== */
  const PAGE_W = 1000; // every page is laid out 1000px wide; height follows the image ratio

  const PAGES = [
    { n: 1, src: "page1.jpg", thumb: "thumb1.jpg", name: "Front Page" },
    { n: 2, src: "page2.jpg", thumb: "thumb2.jpg", name: "Patents, Optics & Botany" },
    { n: 3, src: "page3.jpg", thumb: "thumb3.jpg", name: "The Agony Column" },
    { n: 4, src: "page4.jpg", thumb: "thumb4.jpg", name: "Culture & Theatres" },
    { n: 5, src: "page5.jpg", thumb: "thumb5.jpg", name: "Maritime Intelligence" },
    { n: 6, src: "page6.jpg", thumb: "thumb6.jpg", name: "The Kodak Camera" },
  ];

  // Blank instrument slots measured from the printed pages, in page px [x, y, w, h]
  const SLOTS = {
    1: [30, 602, 732, 84],
    2: [520, 470, 450, 246],
    4: [48, 1293, 348, 272],
    5: [608, 1190, 344, 186],
  };

  // The eight heavy capitals on page 1 (centres in page px, measured from the print)
  const INK_LETTERS = [
    { id: "s", ch: "S", x: 90.9, y: 272.8, word: "Sensation" },
    { id: "w", ch: "W", x: 48.6, y: 508.2, word: "Working" },
    { id: "e1", ch: "E", x: 780.9, y: 587.5, word: "Effect" },
    { id: "t", ch: "T", x: 886.2, y: 678.9, word: "To" },
    { id: "p", ch: "P", x: 910.2, y: 816.9, word: "Price" },
    { id: "e2", ch: "E", x: 142.3, y: 816.6, word: "East" },
    { id: "e3", ch: "E", x: 178.4, y: 816.6, word: "End" },
    { id: "a", ch: "A", x: 28.3, y: 999.4, word: "Act" },
  ];

  // Watches on page 3 [x, y, w, h]; the sixth (the £6 one) hides the cipher disc
  const WATCHES = [
    [443, 363, 157, 160], [751, 382, 188, 203], [459, 739, 157, 172],
    [760, 807, 164, 172], [443, 1075, 173, 163], [791, 1157, 173, 219],
  ];
  const FAN_AD = [726, 1245, 219, 326]; // page 4: "The Secret Language of the Fan" advertisement
  const KODAK = [61, 265, 431, 412]; // page 6: the camera engraving
  const WOODCUT = [30, 746, 370, 462]; // page 2: the sweet pea woodcut
  const THAMES = [41, 210, 518, 347]; // page 5: "Thames After Dark" engraving
  const LAMP = [275, 395]; // page 5: the steamer's signal lamp, centre
  const DESPATCH = [585, 416, 391, 166]; // page 5: Private Telegraphic Despatches box
  const POSTCARD_SRC = "postcard.jpg"; // drop your own photograph here; falls back to the engraved scene

  const ANSWERS = {
    steg: "SWEETPEA",
    tendrils: 6,
    cipherText: "UVKXG IUBKTZ IGXJKT",
    cipherShift: 6,
    cutterBox: 3,
    morse: ".-. --- - .... . .-. .... .. - .... . / -... . .-. - .... / ....-",
    wharf: "ROTHERHITHE",
    ship: "STARLING",
  };

  // focus = desktop framing (clue + docked slot); focusM = phone framing (clue only)
  const STAGES = [
    null,
    { n: 1, roman: "I", page: 1, title: "Stage I · Steganography", amb: "street",
      focus: [0, 180, 1000, 850], focusM: [0, 230, 1000, 800] },
    { n: 2, roman: "II", page: 2, title: "Stage II · Floriography", amb: "street",
      focus: [20, 460, 960, 780], focusM: [20, 770, 640, 500] },
    { n: 3, roman: "III", page: 3, title: "Stage III · The Agony Column", amb: "street",
      focus: [0, 0, 1000, 1414], focusM: [0, 0, 1000, 1414] },
    { n: 4, roman: "IV", page: 4, title: "Stage IV · The Thameside Opera", amb: "opera",
      focus: [30, 770, 950, 860], focusM: [400, 770, 590, 420] },
    { n: 5, roman: "V", page: 5, title: "Stage V · Telegraphic Despatch", amb: "river",
      focus: [30, 195, 545, 380], focusM: [30, 195, 545, 380], decoder: [420, 990, 580, 420] },
    { n: 6, roman: "VI", page: 5, title: "Stage VI · Rotherhithe, Berth 4", amb: "river",
      focus: [0, 0, 1000, 1414], focusM: [0, 0, 1000, 1414] },
    { n: 7, roman: "∞", page: 6, title: "Epilogue · The Perditorian", amb: "street",
      focus: [0, 0, 1000, 1414], focusM: [0, 0, 1000, 1414] },
  ];

  /* ---------------- Field-instinct appraisal ---------------- */
  const PERSONALITY_QUESTIONS = [
    { title: "Dilemma I: Footsteps in the Fog",
      desc: "You are alone in a gaslit London alleyway when two menacing dockmen step out to block your path. What is your immediate instinct?",
      options: [
        ["Face them head-on. Raise a solid walking stick and prepare a firm, decisive strike.", "TACTICIAN"],
        ["Study them closely. Inspect their posture, boot scuffs, and hands for concealed blades.", "FORENSIC"],
        ["Use your surroundings. Tip over a barrel of pungent fish oil to make the stones too slick to walk on.", "ALCHEMIST"],
        ["Vanish silently. Slip into the shadow of a cellar door and let them walk right past.", "INFILTRATOR"],
      ] },
    { title: "Dilemma II: The Locked Iron Box",
      desc: "You find a heavy, locked strongbox belonging to the missing Viscount. How do you open it?",
      options: [
        ["Force the hinges with a heavy metal pry-bar until the iron hasp gives way.", "TACTICIAN"],
        ["Examine the keyhole under a magnifying glass to check for internal scratches that reveal the pins.", "FORENSIC"],
        ["Drop a measure of caustic acid onto the rusted bolt to melt the mechanism silently.", "ALCHEMIST"],
        ["Feel the tumblers with a thin hairpin, listening for each subtle click in the dark.", "INFILTRATOR"],
      ] },
    { title: "Dilemma III: The Suspect Letter",
      desc: "You intercept a torn letter regarding the boy's disappearance. Where does your eye focus first?",
      options: [
        ["The urgency of the words—working out what the villains plan to do next.", "TACTICIAN"],
        ["The printing itself—the uneven type, paper texture, and rogue smeared ink.", "FORENSIC"],
        ["The faint botanical scent of dried flower sap and chemical watermarks on the sheet.", "ALCHEMIST"],
        ["The physical address mentioned—planning how to sneak inside that wharf building undetected.", "INFILTRATOR"],
      ] },
    { title: "Dilemma IV: Street Pursuit",
      desc: "A dockside thief snatches your satchel in a crowded Covent Garden market. How do you recover it?",
      options: [
        ["Sprint after them immediately and tackle them to the ground before they turn the corner.", "TACTICIAN"],
        ["Pause to calculate their path, knowing the alleyway ahead dead-ends at the river wall.", "FORENSIC"],
        ["Knock over a spice cart, sending a cloud of ground pepper into the air to halt their flight.", "ALCHEMIST"],
        ["Melt into the crowd, tracking their coat from thirty paces until they enter their hideout.", "INFILTRATOR"],
      ] },
    { title: "Dilemma V: The Runaway's Motive",
      desc: "Why do you think twelve-year-old Lord Tewksbury ran away from his family's grand estate?",
      options: [
        ["To gain independence and physical control over his own life.", "TACTICIAN"],
        ["Because the evidence in his room shows he carefully packed working knives and sailor's boots.", "FORENSIC"],
        ["To escape suffocating domestic rules and live closer to nature and the wild moors.", "ALCHEMIST"],
        ["Because he wanted to disappear completely and start a new life under a false identity.", "INFILTRATOR"],
      ] },
  ];

  /* ---------------- Archetypes: voice + first-tier (cryptic) counsel ---------------- */
  const ARCHETYPES = {
    TACTICIAN: {
      title: "The Tactician", weapon: "Loaded Malacca Walking Cane",
      weaponDesc: "A hollowed cane concealing an 8-inch stiletto and a weighted brass ball-pommel calibrated for leverage.",
      voice: "Weigh it, child: ",
      clue: {
        1: "A compositor in a hurry leaves fingerprints. Some letters on the front page were struck harder than their neighbours. Weight always tells.",
        2: "A climber carries its own weight on little coiled springs. Count the springs and you have your number.",
        3: "A wheel turns and a lock opens. But first find the wheel: it hides among things that tick.",
        4: "Silk hides much, but never a frame. Watch who sits like a lady and who sits like a docker.",
        5: "A lamp that blinks without reason is a lamp with something to say. Long and short, like oars.",
      },
      action: "You draw the concealed Malacca stiletto and lever the corroded padlock clean off Tewksbury's chains.",
      verb: "Strike with the cane",
    },
    FORENSIC: {
      title: "The Forensic", weapon: "Optical Vernier Reticle Loupe",
      weaponDesc: "A dual-achromatic glass ocular with 0.1 mm micrometer scales and folding calipers for detecting micro-print irregularities.",
      voice: "Measure, do not guess: ",
      clue: {
        1: "Measure the ink, not the words. Eight types on the front page carry more of it than they should.",
        2: "The Royal Botanic note on page two praises a climber's 'structural regularity'. Whatever is regular can be counted.",
        3: "One article on page three is priced wrong for its company. Anomalies are never accidents.",
        4: "Gestures are a grammar. Two ladies above speak it fluently; one only mimics the sounds.",
        5: "One lamp on the river does not flicker like gas. Time its flashes: long and short are letters.",
      },
      action: "You find the stress fault in the chain link and snap it cleanly with your vernier lever.",
      verb: "Find the flaw",
    },
    ALCHEMIST: {
      title: "The Alchemist", weapon: "Chemist's Acid Reagent Dropper",
      weaponDesc: "A sealed vulcanite and cobalt-glass vial of fuming nitric acid, engineered to dissolve hemp cordage and iron rivets.",
      voice: "Distil it, darling: ",
      clue: {
        1: "I never write plainly; I grow my messages. Gather eight dark seeds from the front page and see what flower they make.",
        2: "Lathyrus odoratus holds its stake with spirals, not roots. Their tally is the measure of the reagent.",
        3: "Read the italics under the electric lamps. I rhyme with prices.",
        4: "My friends speak with fans as flowers speak with petals. Find the speaker who never learned the tongue.",
        5: "Every element has its symbol, and every letter its rhythm. A steamer is spelling its own name in light.",
      },
      action: "You let three drops of reagent fall on the hemp lashings; the cords dissolve in smoking silence.",
      verb: "Uncork the reagent",
    },
    INFILTRATOR: {
      title: "The Infiltrator", weapon: "Braided Pocket Sinker Sling",
      weaponDesc: "Hand-plaited silk cord with calibrated lead ballasts, for shattering lanterns, throwing distraction sounds and covert strikes.",
      voice: "Quietly now: ",
      clue: {
        1: "In a crowd of grey coats, look for the eight who stand a little too straight.",
        2: "Every vine that climbs leaves handholds. How many did this one leave?",
        3: "Things that tick make fine hiding places. Listen along the jewellery column.",
        4: "Every disguise slips at the edges: at the wrists, and at the hands.",
        5: "Watch the river, not the wharves. Somebody aboard a steamer is talking with a lantern.",
      },
      action: "You loose a lead sinker into the hanging kerosene lamp. In the pitch-black confusion, Squeaky goes down.",
      verb: "Loose the sinker",
    },
  };

  // Second and third tiers of counsel: plainer, then nearly the answer
  const HINT_TIERS = {
    1: ["Use the loupe. Hunt the capitals printed heavier than their neighbours: two in The Berkshire Mystery, three in The Fogs of London, three among the Matchgirls. Tap them in the print.",
        "Sensation · Working · Effect · East · End · To · Price · Act. Their heavy first letters name a flower of eight letters. Let the colours guide the order."],
    2: ["Mrs Lefevre's woodcut of the sweet pea: count every curling spiral that springs from the stem, on both sides of the stake.",
        "Three spirals to the left of the stake, three to the right."],
    3: ["The italic note beneath ELECTRIC LIGHTING IN THE CITY is no advertisement but a riddle. Five watches sell for a fiver. Which asks a pound more?",
        "Open Benson's Lady's watch, the one priced £6. Turn its inner wheel by the sweet pea's number."],
    4: ["Double-tap Madame Elara's advertisement to unfold her fan guide. Compare each box's gesture with it, and remember the subheading's yellow gloves.",
        "A fan held shut and jabbed like a truncheon is in no lady's guide, and only one box wears yellow kid."],
    5: ["Tap the Thames engraving to catch the steamer's lamp. Then key each group of flashes into the Decoder 101 at the bottom right, one letter at a time.",
        "Eight letters. A small brown songbird: the very bird the Agony Column says has taken flight."],
  };

  /* ---------------- Enola's casebook + the lesson on each page ---------------- */
  const NOTES = {
    1: {
      diary: "Mother's parcel came by hand, unsigned, tied with twine. She never sends a letter when a newspaper will do. Somewhere on this front page she has set type against type. And the boy in the portrait does not look kidnapped. He looks like someone who has decided.",
      lesson: "Steganography: hidden in plain sight",
      body: [
        "Cryptography scrambles a message. <b>Steganography</b> hides the fact that there is a message at all. The word comes from the Greek <i>steganos</i>, covered, and <i>graphein</i>, to write.",
        "Around 1499 the abbot Johannes Trithemius wrote <i>Steganographia</i>, a book that seemed to be about summoning spirits but quietly taught hidden writing.",
        "Victorians had their own trick. Newspapers travelled through the post cheaply, so people pricked tiny holes above chosen letters and posted the paper as a secret letter.",
      ],
      tryit: "Here the compositor used heavier type for eight capitals. Tap them in the print. When all eight are set, the register answers like a game of words: <span class='k-g'>green</span> is the right letter in the right place, <span class='k-y'>amber</span> is the right letter in the wrong place.",
    },
    2: {
      diary: "A flower, then. Mother taught me its meanings before she taught me to sew, and I was better at the flowers. If the Viscount means departure, the next door is Mrs Lefevre's: chemists keep their secrets in glass and in drawings.",
      lesson: "Floriography: the language of flowers",
      body: [
        "Victorians gave flowers meanings and sent bouquets that could be read like letters. Flower dictionaries were best-sellers; Kate Greenaway's illustrated <i>Language of Flowers</i> appeared in 1884.",
        "In many of those dictionaries the <b>sweet pea</b> stands for <i>departure</i>, or a gentle 'goodbye, and thank you'. In Nancy Springer's novels, Enola and her mother share exactly this kind of flower code.",
        "Botanical engravers drew specimens precisely, petal by petal. That makes a drawing a safe place to hide a number.",
      ],
      tryit: "FLORA_TABLE",
    },
    3: {
      diary: "A number without a lock is useless. Page three sells lost satchels and gold watches, all priced alike but one. Mother always said a thing that costs more than its fellows is either very good or very much more than it seems.",
      lesson: "Cipher wheels and the Agony Column",
      body: [
        "A <b>Caesar shift</b> moves every letter the same number of places along the alphabet. The Roman historian Suetonius says Julius Caesar used a shift of three.",
        "Around 1467 Leon Battista Alberti described a <b>cipher disc</b>: two rings of letters, the inner one turning. Set the shift once and you can read a message straight off the wheel.",
        "Victorian lovers and plotters placed coded notices in newspapers' personal 'Agony Columns'. The scientists Charles Wheatstone and Lyon Playfair are said to have amused themselves by breaking them.",
      ],
      tryit: "To undo a shift of 6, move each letter six places back: U becomes O. Find the wheel first: the italic riddle under the electric lamps knows where it is.",
    },
    4: {
      diary: "The notice says the Thameside house, a private engagement. Where ladies may not speak aloud, they speak with fans; Mother's sisterhood taught them all. But a man in a borrowed gown only learns to hold a fan, not what it says.",
      lesson: "The secret language of the fan",
      body: [
        "In the nineteenth century, fan-makers and publishers sold little guides claiming that every movement of a fan carried a meaning. The best known is linked to the Parisian fan-maker Duvelleroy.",
        "Historians suspect these 'languages' were more clever marketing than everyday practice, and different guides even contradict one another. The idea of a silent code across a crowded room was irresistible all the same.",
      ],
      tryit: "Double-tap Madame Elara's advertisement on this page to unfold her guide. Then read the three boxes with the opera glass.",
    },
    5: {
      diary: "Cutter will run for the river, and the river has its own post. One steamer in the fog keeps a lantern that blinks too evenly for gas. Somebody aboard is talking, and they think nobody on shore can read.",
      lesson: "Morse: by wire, by ear, by light",
      body: [
        "Samuel Morse and Alfred Vail developed their electric telegraph code in the late 1830s and 1840s. The International version used in Britain was agreed by European telegraph administrations in 1865.",
        "Morse is a rhythm, not a picture. Operators learned it by sound: a dot is a short <i>dit</i>, a dash a long <i>dah</i>. Skilled clerks read the clicks of a sounder by ear, faster than they could read the tape.",
        "Ships carried the same code in light. In 1867 the Royal Navy adopted Captain Philip Colomb's system of flashing lamps for signalling at night.",
        "Timing is everything: a dash lasts three dots; letters are parted by three dots of darkness, words by seven.",
      ],
      tryit: "Tap the Thames engraving to catch the lamp, then use the Morse Code Decoder 101 at the bottom right to translate each group yourself. Tap the Private Telegraphic Despatches to hear Morse as sound.",
    },
    6: {
      diary: "Rotherhithe at night smells of coal, tar and low tide. The barge sits at Berth 4 with one lamp lit. I have my wits, my method, and very little time.",
      lesson: "The river at night",
      body: [
        "Rotherhithe lies on the south bank of the Thames, among the timber ponds and docks of the Surrey Commercial Docks.",
        "River theft was common enough that London formed the Marine Police in 1798, often called the first organised police force in England. By 1888 they were the Thames Division of the Metropolitan Police.",
      ],
      tryit: "",
    },
    7: {
      diary: "He thanked me as one thanks a fellow traveller, not a rescuer. Good. Tomorrow's Agony Column will carry a chrysanthemum and a rambling rose: Mother's way of saying she is proud, without saying it.",
      lesson: "1888: the year of the snapshot",
      body: [
        "George Eastman launched the first Kodak camera in 1888 with the slogan 'You press the button, we do the rest.' It came loaded with film for 100 round pictures.",
        "When the roll was finished, the whole camera went back to the factory, which developed the prints and returned the camera reloaded. Photography no longer needed a darkroom.",
        "Enola calls herself a <i>perditorian</i>: a finder of lost things, and of lost people.",
      ],
      tryit: "Your developing receipt lists every craft you learned. Keep the postcard as a namesake, or tap the Kodak engraving to take it again.",
    },
  };

  const MORSE = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
    N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
    1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.", 0: "-----",
  };

  /* ======================================================================
     SHORTHANDS & STATE
     ====================================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const audio = new Phonograph();
  const narrowMQ = window.matchMedia("(max-width: 760px)");

  const state = {
    phase: "opening",
    stage: 0,
    maxStage: 0,
    solved: new Set(),
    page: 1,
    archetype: "TACTICIAN",
    hints: 0,
    hintTier: {},
    hintUse: {},
    misses: {},
    startedAt: 0,
    finishedAt: 0,
    pageH: {},
    loupe: false,
    notesSeen: new Set(),
    watchFound: false,
  };

  const RIVETS = '<i class="rivet"></i><i class="rivet"></i><i class="rivet"></i><i class="rivet"></i>';
  const SEAL = (txt) => `<div class="seal-cover"><i></i><span>${txt}</span></div>`;
  const miss = (n) => (state.misses[n] = (state.misses[n] || 0) + 1);

  /* ======================================================================
     GASLAMP & FOG (from the team's engine)
     ====================================================================== */
  class GaslampFog {
    constructor(canvas) {
      this.c = canvas;
      this.ctx = canvas.getContext("2d");
      this.mx = this.tx = innerWidth / 2;
      this.my = this.ty = innerHeight / 2;
      this.t = 0;
      this.resize();
      this.motes = Array.from({ length: 55 }, () => ({
        x: Math.random() * this.w, y: Math.random() * this.h, z: Math.random() * 500 + 50,
        vx: (Math.random() - 0.5) * 0.25, vy: -Math.random() * 0.35 - 0.1,
        s: Math.random() * 2.2 + 0.8, a: Math.random() * 0.45 + 0.15,
      }));
      this.fog = Array.from({ length: 6 }, () => ({
        x: Math.random() * this.w, y: Math.random() * this.h, r: Math.random() * 260 + 180,
        vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.08, a: Math.random() * 0.08 + 0.04,
      }));
      addEventListener("resize", () => this.resize());
      addEventListener("pointermove", (e) => { this.tx = e.clientX; this.ty = e.clientY; });
      this.loop();
    }
    resize() {
      this.w = this.c.width = innerWidth;
      this.h = this.c.height = innerHeight;
    }
    loop() {
      requestAnimationFrame(() => this.loop());
      const { ctx } = this;
      this.t += 0.012;
      this.mx += (this.tx - this.mx) * 0.04;
      this.my += (this.ty - this.my) * 0.04;
      ctx.fillStyle = "rgba(12,6,2,0.28)";
      ctx.fillRect(0, 0, this.w, this.h);
      for (const f of this.fog) {
        f.x += f.vx; f.y += f.vy;
        if (f.x < -f.r) f.x = this.w + f.r;
        if (f.x > this.w + f.r) f.x = -f.r;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
        g.addColorStop(0, `rgba(45,30,16,${f.a * 1.5})`);
        g.addColorStop(0.6, `rgba(28,16,7,${f.a * 0.6})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      }
      const cx = this.w / 2 + (this.mx - this.w / 2) * 0.08, cy = this.h / 2 + (this.my - this.h / 2) * 0.08;
      for (const m of this.motes) {
        m.x += m.vx; m.y += m.vy; m.z -= 0.4;
        if (m.z <= 10) m.z = 550;
        if (m.y < -20) m.y = this.h + 20;
        if (m.x < -20) m.x = this.w + 20;
        if (m.x > this.w + 20) m.x = -20;
        const sc = 350 / (350 + m.z);
        const flick = 0.85 + Math.sin(this.t * 3 + m.x) * 0.15;
        ctx.fillStyle = `rgba(229,189,104,${m.a * sc * flick})`;
        ctx.beginPath();
        ctx.arc((m.x - cx) * sc + cx, (m.y - cy) * sc + cy, m.s * sc * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ======================================================================
     CAMERA (2D null-camera over the world)
     ====================================================================== */
  const world = $("#world");
  const viewport = $("#viewport");
  const cam = { s: 0.5, x: 0, y: 0, rect: null };

  function applyCam(animate = true, dur = 1.1) {
    world.style.transition = animate ? `transform ${dur}s cubic-bezier(.19,1,.22,1)` : "none";
    world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`;
  }

  function availRect() {
    const investigating = state.phase === "investigate";
    const top = investigating ? $("#hud-top").offsetHeight : 0;
    let bottom = investigating ? $("#hud-bottom").offsetHeight : 0;
    const drawer = $("#drawer");
    if (investigating && drawer.classList.contains("has-dock")) bottom += drawer.offsetHeight;
    let w = innerWidth;
    const notes = $("#notes");
    if (investigating && !notes.hidden && !narrowMQ.matches) w -= notes.offsetWidth;
    return { x: 0, y: top, w, h: innerHeight - top - bottom };
  }

  const pageH = (n = state.page) => state.pageH[n] || 1414;

  function focusRect(rect, { animate = true, pad = 18, max = 2.6 } = {}) {
    const A = availRect();
    const [x, y, w, h] = rect;
    cam.rect = rect;
    cam.s = Math.min((A.w - pad * 2) / w, (A.h - pad * 2) / h, max);
    cam.x = A.x + A.w / 2 - (x + w / 2) * cam.s;
    cam.y = A.y + A.h / 2 - (y + h / 2) * cam.s;
    applyCam(animate);
  }
  const fitPage = (o) => focusRect([0, 0, PAGE_W, pageH()], o);
  function focusStage(animate = true) {
    const st = STAGES[state.stage];
    if (!st || st.page !== state.page) return fitPage({ animate });
    focusRect(narrowMQ.matches ? st.focusM : st.focus, { animate });
  }

  function zoomAt(factor, px, py) {
    const fit = Math.min(innerWidth / PAGE_W, innerHeight / pageH());
    const ns = Math.min(Math.max(cam.s * factor, fit * 0.5), 5);
    cam.x = px - (px - cam.x) * (ns / cam.s);
    cam.y = py - (py - cam.y) * (ns / cam.s);
    cam.s = ns;
    cam.rect = null;
    applyCam(false);
  }

  const NOPAN = ".dock, button, input, a, .hotspot";
  const pointers = new Map();
  let pinch0 = null;
  viewport.addEventListener("pointerdown", (e) => {
    if (state.phase !== "investigate") return;
    if (e.target.closest(NOPAN)) return;
    if (state.loupe && e.pointerType !== "mouse") return; // finger drives the loupe
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    document.body.classList.add("grabbing");
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), s: cam.s };
    }
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      cam.x += e.clientX - prev.x;
      cam.y += e.clientY - prev.y;
      cam.rect = null;
      applyCam(false);
    } else if (pointers.size === 2 && pinch0) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt((pinch0.s * (d / pinch0.d)) / cam.s, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
  });
  const endPtr = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch0 = null;
    if (!pointers.size) document.body.classList.remove("grabbing");
  };
  viewport.addEventListener("pointerup", endPtr);
  viewport.addEventListener("pointercancel", endPtr);
  viewport.addEventListener("wheel", (e) => {
    if (state.phase !== "investigate") return;
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
  }, { passive: false });
  viewport.addEventListener("dblclick", (e) => {
    if (state.phase !== "investigate" || e.target.closest(NOPAN)) return;
    const A = availRect();
    const fit = Math.min(A.w / PAGE_W, A.h / pageH());
    if (cam.s > fit * 1.4) return fitPage();
    const ns = cam.s * 2.2;
    cam.x = e.clientX - (e.clientX - cam.x) * (ns / cam.s);
    cam.y = e.clientY - (e.clientY - cam.y) * (ns / cam.s);
    cam.s = ns;
    cam.rect = null;
    applyCam(true, 0.6);
  });

  addEventListener("resize", () => {
    placeDocks();
    if (cam.rect) focusRect(cam.rect, { animate: false });
  });

  /* ======================================================================
     LOUPE
     ====================================================================== */
  const loupe = $("#loupe");
  const pageImg = $("#page-img");
  function setLoupe(on) {
    state.loupe = on;
    if (on) $("#btn-loupe").classList.remove("beckon");
    document.body.classList.toggle("loupe-on", on);
    $("#btn-loupe").setAttribute("aria-pressed", String(on));
    if (!on) loupe.classList.remove("show");
    audio.tick(on ? 1.3 : 0.9);
  }
  function moveLoupe(x, y, touch) {
    if (!state.loupe || state.phase !== "investigate") return;
    const r = pageImg.getBoundingClientRect();
    const ly = touch ? y - 130 : y;
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return loupe.classList.remove("show");
    const Z = 2.4, R = 110;
    loupe.classList.add("show");
    loupe.style.left = x + "px";
    loupe.style.top = ly + "px";
    loupe.style.backgroundImage = `url("${pageImg.src}")`;
    loupe.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
    loupe.style.backgroundPosition = `${-((x - r.left) * Z - R)}px ${-((y - r.top) * Z - R)}px`;
  }
  addEventListener("pointermove", (e) => moveLoupe(e.clientX, e.clientY, e.pointerType === "touch"));
  addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") moveLoupe(e.clientX, e.clientY, true); });

  /* ======================================================================
     TOAST, TELEGRAM, LENS
     ====================================================================== */
  let toastT;
  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), ms);
  }

  let tgOpen = false;
  function telegram(title, paras, buttons = [{ label: "Continue" }], stamp = "LONDON · 1888") {
    return new Promise((resolve) => {
      tgOpen = true;
      const layer = $("#telegram-layer");
      $("#tg-title").textContent = title;
      $("#tg-stamp").textContent = stamp;
      const body = $("#tg-body");
      body.innerHTML = "";
      const acts = $("#tg-actions");
      acts.innerHTML = "";
      layer.hidden = false;
      audio.tick(1.4);
      const ps = paras.map((t) => { const p = el("p"); body.appendChild(p); return [p, t]; });
      let skip = false, done = false;
      const finish = () => {
        if (done) return;
        done = true;
        ps.forEach(([p, t]) => (p.textContent = t));
        buttons.forEach((b, i) => {
          const btn = el("button", "brass-btn" + (b.wax ? " wax" : ""), b.label);
          btn.addEventListener("click", () => {
            layer.hidden = true;
            tgOpen = false;
            audio.tick(1.1);
            b.fn && b.fn();
            resolve(b.value ?? i);
          });
          acts.appendChild(btn);
          if (i === buttons.length - 1) setTimeout(() => btn.focus(), 30);
        });
      };
      body.onclick = () => (skip = true);
      (async () => {
        for (const [p, t] of ps) {
          for (let i = 0; i <= t.length; i++) {
            if (skip) return finish();
            p.textContent = t.slice(0, i);
            if (i % 3 === 0) audio.typeKey();
            await wait(13);
          }
        }
        finish();
      })();
    });
  }

  let lensOnClose = null;
  function openLens(html, onClose, cls = "") {
    $("#lens-content").innerHTML = html;
    $(".lens-card").className = "lens-card " + cls;
    $("#lens-layer").hidden = false;
    lensOnClose = onClose || null;
  }
  function closeLens() {
    if ($("#lens-layer").hidden) return;
    $("#lens-layer").hidden = true;
    $("#lens-content").innerHTML = "";
    const f = lensOnClose;
    lensOnClose = null;
    f && f();
  }
  $("#lens-close").addEventListener("click", closeLens);

  /* ======================================================================
     FIELD NOTES (casebook + lesson)
     ====================================================================== */
  function morseTable() {
    return `<div class="morse-chart">${[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"].map((k) => [k, MORSE[k]]).map(([k, v]) =>
      `<span><b>${k}</b><i>${v.replace(/\./g, "·").replace(/-/g, "–")}</i></span>`).join("")}</div>`;
  }
  const FLORA = [
    ["Sweet pea", "Departure; 'goodbye, and thank you for a lovely time'"],
    ["Chrysanthemum", "Red: 'I love'. White: truth"],
    ["Rose", "Love, in a hundred shades of meaning"],
    ["Ivy", "Fidelity and friendship"],
    ["Forget-me-not", "True love; remembrance"],
    ["Foxglove", "Insincerity"],
    ["Lavender", "Distrust"],
    ["Snowdrop", "Hope"],
  ];
  function floraTable() {
    return `<p>A pocket dictionary, after the Victorian flower books. Meanings varied from one book to the next, so senders and readers had to own the same one.</p>
      <div class="flora">${FLORA.map(([f, m]) => `<p><b>${f}</b><span>${m}</span></p>`).join("")}</div>
      <p style="margin-top:8px">Now count what holds the sweet pea to its stake, and seal the tally in the counter.</p>`;
  }
  function openNotes(n = state.stage) {
    const d = NOTES[n];
    if (!d) return;
    state.notesSeen.add(n);
    $("#notes-kicker").textContent = `Field Notes · ${STAGES[n].roman}`;
    $("#notes-body").innerHTML = `
      <button class="loupe-tip" id="loupe-tip">${state.loupe ? "Loupe equipped. Press L to put it away." : "Equip your loupe: press L, or tap here. Every page hides small print."}</button>
      <section class="casebook"><p class="nb-label">From Enola's casebook</p><p class="diary">${d.diary}</p></section>
      <section class="lesson"><h3>${d.lesson}</h3>${d.body.map((p) => `<p>${p}</p>`).join("")}
        ${d.tryit ? `<div class="tryit"><p class="nb-label">Try it</p>${d.tryit === "FLORA_TABLE" ? floraTable() : `<p>${d.tryit}</p>`}</div>` : ""}
      </section>`;
    $("#loupe-tip").addEventListener("click", () => { setLoupe(!state.loupe); openNotes(n); });
    const notes = $("#notes");
    const was = notes.hidden;
    notes.hidden = false;
    $("#btn-notes").setAttribute("aria-expanded", "true");
    $("#notes-body").scrollTop = 0;
    if (was) {
      audio.rustle(0.4, 0.4);
      if (cam.rect) setTimeout(() => focusRect(cam.rect), 20);
    }
  }
  function closeNotes() {
    const notes = $("#notes");
    if (notes.hidden) return;
    notes.hidden = true;
    $("#btn-notes").setAttribute("aria-expanded", "false");
    if (cam.rect) focusRect(cam.rect);
  }
  $("#notes-close").addEventListener("click", closeNotes);

  /* ======================================================================
     OPENING — the sealed packet unfolds
     ====================================================================== */
  function prepareFold() {
    $$("#fold-rig .face.front").forEach((f) => (f.style.backgroundImage = `url("${PAGES[0].src}")`));
    world.style.width = PAGE_W + "px";
    world.style.height = pageH(1) + "px";
    const A = { w: innerWidth, h: innerHeight };
    cam.s = Math.min((A.w * 0.9) / PAGE_W, (A.h * 0.78) / pageH(1)) * 1.05;
    cam.x = A.w / 2 - (PAGE_W / 2) * cam.s;
    cam.y = A.h * 0.56 - (pageH(1) / 2) * cam.s;
    applyCam(false);
  }

  async function breakSeal() {
    if (state.phase !== "opening") return;
    state.phase = "unfolding";
    audio.init();
    audio.setMuted(state.muted || false);
    const rig = $("#fold-rig");
    $("#wax-seal").classList.add("broken");
    $("#title-card").classList.add("gone");
    audio.sealCrack();
    audio.setAmbience("street");
    await wait(260);
    $("#packet-dress").classList.add("cut");
    audio.rustle(0.4, 0.4);
    await wait(700);
    document.body.classList.replace("phase-opening", "phase-dossier");
    rig.classList.remove("folded");
    rig.classList.add("lifted");
    audio.rustle(1.0, 0.5);
    fitPage({ animate: true, pad: 24 });
    world.style.transition = "transform 3.6s cubic-bezier(.45,.05,.25,1)";
    await wait(1100);
    $("#packet-dress").style.opacity = 0;
    rig.classList.replace("lifted", "open-1");
    audio.rustle(1.1, 1);
    await wait(1250);
    rig.classList.replace("open-1", "open-2");
    audio.rustle(1.2, 1.3);
    await wait(1350);
    $("#book").hidden = false;
    $(".crease").classList.add("fresh");
    $("#fold-stage").hidden = true;
    renderPage(1);
    const bells = audio.westminster(2, 0);
    setTimeout(() => audio.setMusic("waltz"), Math.max(0, bells * 1000 - 1500));
    await wait(1300);
    $(".crease").classList.remove("fresh");
    showDossier("brief");
  }
  $("#wax-seal").addEventListener("click", breakSeal);

  /* ======================================================================
     DOSSIER — briefing, appraisal, result
     ====================================================================== */
  let quizIdx = 0;
  let quizScores = {};
  const setPhaseClass = (p) => (document.body.className = document.body.className.replace(/phase-\w+/g, "").trim() + " phase-" + p);

  function showDossier(step) {
    state.phase = "dossier";
    setPhaseClass("dossier");
    const wrap = $("#dossier");
    const card = $("#dossier-card");
    wrap.hidden = false;
    card.classList.remove("swap");
    void card.offsetWidth;
    card.classList.add("swap");

    if (step === "brief") {
      audio.rustle(0.5, 0.6);
      card.innerHTML = `
        <div class="d-rule"><span class="d-badge">Tucked inside the Gazette</span><span class="d-stamp">CASE No. 6207</span></div>
        <h2 class="d-title">An Untold Runaway Case</h2>
        <div class="d-body">
          <p>London, December 1888. The fog has come down over the city, and this morning's press hides more than it prints.</p>
          <p>The twelve-year-old Seventh Marquess of Basilwether, Viscount Tewksbury, has vanished from Basilwether Park. Scotland Yard cries abduction, yet his velvet suit lies cast aside and his working knives are gone. You are fourteen-year-old <strong>Enola Holmes</strong>, newly arrived in the capital on a quiet quest of your own.</p>
          <p>Your mother vanished too, a year ago. She never writes; she prints. Somewhere in the type, woodcuts and notices of this edition, Lady Eudoria has left you a trail. Read the paper slowly. Every page holds one link of the chain.</p>
        </div>
        <div class="d-foot">
          <span class="d-meta">FIELD APPRAISAL · 5 BRIEF INQUIRIES</span>
          <button class="brass-btn" id="d-start">Examine your field instincts &rarr;</button>
        </div>`;
      $("#d-start").addEventListener("click", () => {
        quizIdx = 0;
        quizScores = { TACTICIAN: 0, FORENSIC: 0, ALCHEMIST: 0, INFILTRATOR: 0 };
        audio.tick(1.2);
        showDossier("quiz");
      });
    } else if (step === "quiz") {
      if (quizIdx >= PERSONALITY_QUESTIONS.length) return showDossier("result");
      const q = PERSONALITY_QUESTIONS[quizIdx];
      card.innerHTML = `
        <div class="d-rule"><span class="d-badge">Field Profile</span>
          <span class="d-progress">${PERSONALITY_QUESTIONS.map((_, i) => `<i class="${i <= quizIdx ? "on" : ""}"></i>`).join("")}</span></div>
        <h2 class="d-title">${q.title}</h2>
        <div class="d-scenario">“${q.desc}”</div>
        <div class="d-options">${q.options.map(([t, a], i) =>
          `<button class="d-choice" data-a="${a}"><b>${"ABCD"[i]}</b><span>${t}</span></button>`).join("")}</div>`;
      $$(".d-choice", card).forEach((b) => b.addEventListener("click", () => {
        quizScores[b.dataset.a]++;
        audio.typeKey();
        audio.tick(1.15);
        quizIdx++;
        showDossier("quiz");
      }));
      setTimeout(() => $(".d-choice", card)?.focus(), 50);
    } else if (step === "result") {
      const win = Object.entries(quizScores).sort((a, b) => b[1] - a[1])[0][0];
      state.archetype = win;
      const p = ARCHETYPES[win];
      audio.success();
      card.innerHTML = `
        <div class="d-rule"><span class="d-badge">Appraisal Complete</span><span class="d-stamp">CERTIFIED</span></div>
        <p class="d-meta">YOUR INVESTIGATIVE METHOD</p>
        <h2 class="d-title" style="color:var(--oxblood)">${p.title}</h2>
        <div class="d-tool"><h3>Field tool: ${p.weapon}</h3><p>${p.weaponDesc}</p></div>
        <div class="d-body"><p><em>Lady Eudoria will answer in your method whenever you seek her counsel. Ask once and she speaks in riddles; ask again and she grows plainer. Your instruments wait in the blank columns of the paper; your field notes teach each old craft as you go.</em></p></div>
        <div class="d-foot"><span class="d-meta">Tip: press L for the loupe</span>
          <button class="brass-btn wax" id="d-go">Take up the Gazette &rarr;</button></div>`;
      $("#d-go").addEventListener("click", () => {
        $("#dossier").hidden = true;
        state.phase = "investigate";
        state.startedAt = Date.now();
        setPhaseClass("investigate");
        audio.rustle(0.6, 0.7);
        setTimeout(() => setStage(1), 350);
      });
    }
  }

  /* ======================================================================
     PAGES — render, turn
     ====================================================================== */
  function renderPage(n) {
    state.page = n;
    const p = PAGES[n - 1];
    const h = pageH(n);
    pageImg.src = p.src;
    pageImg.alt = `The Pall Mall Gazette, page ${n}: ${p.name}`;
    $("#page").style.height = h + "px";
    world.style.height = h + "px";
    renderSlots(n);
    renderHotspots(n);
    updateTabs();
  }

  let turning = false;
  async function turnTo(n, { focus = "stage" } = {}) {
    if (n === state.page) {
      focus === "stage" ? focusStage() : fitPage();
      return;
    }
    if (turning) return;
    turning = true;
    const back = n < state.page;
    const old = PAGES[state.page - 1];
    const leaf = el("div", "leaf" + (back ? " back-turn" : ""));
    leaf.style.width = PAGE_W + "px";
    leaf.style.height = pageH() + "px";
    leaf.innerHTML = `<div class="lf f" style="background-image:url('${old.src}')"></div><div class="lf b"></div>`;
    $("#book").appendChild(leaf);
    audio.pageTurn();
    renderPage(n);
    fitPage({ animate: true });
    await wait(950);
    leaf.remove();
    turning = false;
    if (focus === "stage") focusStage();
  }

  function updateTabs() {
    const st = STAGES[state.stage];
    $$(".page-tab").forEach((t) => {
      const n = +t.dataset.n;
      t.classList.toggle("cur", n === state.page);
      t.classList.toggle("clue", !!st && st.page === n && !state.solved.has(st.n));
    });
  }

  /* ======================================================================
     HOTSPOTS IN THE PRINT
     ====================================================================== */
  // Taps with a double-tap detector that works for mouse and touch alike
  function tapTarget(node, { single, double }) {
    let last = 0, timer = null;
    node.addEventListener("dblclick", (e) => e.stopPropagation());
    node.addEventListener("click", (e) => {
      e.stopPropagation();
      const now = Date.now();
      if (double && now - last < 380) {
        clearTimeout(timer);
        last = 0;
        double(e);
        return;
      }
      last = now;
      if (!single) return;
      if (double) timer = setTimeout(() => single(e), 380);
      else single(e);
    });
  }

  function renderHotspots(n) {
    const layer = $("#hot-layer");
    layer.innerHTML = "";
    const add = (cls, [x, y, w, h], label) => {
      const b = el("button", "hotspot " + cls);
      Object.assign(b.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
      b.setAttribute("aria-label", label);
      layer.appendChild(b);
      return b;
    };
    if (n === 1) {
      INK_LETTERS.forEach((L) => {
        const b = add("ink-letter", [L.x - 15, L.y - 15, 30, 30], `Heavy capital ${L.ch} in “${L.word}”`);
        b.dataset.id = L.id;
        tapTarget(b, { single: () => tapInk(L) });
      });
      syncInk();
    }
    if (n === 3) {
      WATCHES.forEach((r, i) => {
        const b = add("watch-spot" + (i === 5 ? " sixth" : ""), r, i === 5 ? "Benson's Lady's watch, priced six pounds" : `Pocket watch ${i + 1}`);
        if (i === 5) b.innerHTML = '<span class="watch-tag">Tap to open the case</span>';
        tapTarget(b, { single: () => (i === 5 ? openWatch() : honestWatch(i)) });
      });
    }
    if (n === 4) {
      const b = add("fan-ad", FAN_AD, "Madame Elara's fan guide advertisement: double-tap to unfold");
      tapTarget(b, {
        single: () => { audio.tick(1.2); toast("Madame Elara's guide is folded shut. Double-tap to unfold it."); },
        double: () => openFanLegend(),
      });
    }
    if (n === 2) {
      const b = add("woodcut-spot", WOODCUT, "The sweet pea woodcut: open Floriography 101");
      tapTarget(b, { single: openFlora });
    }
    if (n === 5) {
      const ph = add("thames-spot", THAMES, "Thames After Dark: catch the steamer's signal lamp");
      ph.innerHTML = `<span class="sig-lamp" style="left:${LAMP[0] - THAMES[0]}px;top:${LAMP[1] - THAMES[1]}px"></span><span class="lamp-strip" id="lamp-strip"></span>`;
      tapTarget(ph, { single: catchLamp });
      startLamp();
      const dp = add("despatch-spot", DESPATCH, "Private Telegraphic Despatches: listen");
      tapTarget(dp, { single: hearDespatch });
    } else stopLamp();
    if (n === 6) {
      const b = add("kodak-spot", KODAK, "The Kodak camera: take the photograph");
      tapTarget(b, { single: () => (state.solved.has(6) ? openEpilogue(true) : toast("Not yet. There is a boy to find first.")) });
    }
    document.body.classList.toggle("stage-1-live", state.stage === 1 && !state.solved.has(1));
  }

  /* ======================================================================
     INSTRUMENT DOCKS
     ====================================================================== */
  const DOCKS = {}; // stage → { el, page, slot }

  function buildDocks() {
    DOCKS[1] = { page: 1, el: buildSteg() };
    DOCKS[2] = { page: 2, el: buildTendril() };
    DOCKS[4] = { page: 4, el: buildOpera() };
    DOCKS[5] = { page: 5, el: buildDecoder() };
  }

  function renderSlots(n) {
    const layer = $("#slot-layer");
    Object.values(DOCKS).forEach((d) => d.el.remove());
    layer.innerHTML = "";
    Object.entries(DOCKS).forEach(([stage, d]) => {
      if (d.page !== n) return;
      const [x, y, w, h] = SLOTS[n];
      const s = el("div", "slot");
      s.dataset.stage = stage;
      Object.assign(s.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
      s.appendChild(el("div", "slot-placeholder", "Instrument below&nbsp;↓"));
      s.appendChild(d.el);
      d.slot = s;
      layer.appendChild(s);
    });
    refreshDocks();
    placeDocks();
  }

  function refreshDocks() {
    Object.entries(DOCKS).forEach(([stage, d]) => {
      stage = +stage;
      d.el.classList.toggle("sealed", stage > state.maxStage);
      d.el.classList.toggle("solved", state.solved.has(stage));
    });
  }

  function placeDocks() {
    const drawer = $("#drawer");
    const narrow = narrowMQ.matches;
    const cur = DOCKS[state.stage];
    Object.values(DOCKS).forEach((d) => {
      const wantDrawer = narrow && d === cur && d.page === state.page && !state.solved.has(state.stage) && state.phase === "investigate";
      if (wantDrawer && d.el.parentElement !== drawer) {
        drawer.innerHTML = "";
        drawer.appendChild(d.el);
        d.slot && d.slot.classList.add("moved");
      } else if (!wantDrawer && d.el.parentElement === drawer) {
        d.slot ? d.slot.appendChild(d.el) : d.el.remove();
        d.slot && d.slot.classList.remove("moved");
      }
    });
    drawer.classList.toggle("has-dock", drawer.children.length > 0);
  }
  narrowMQ.addEventListener?.("change", () => { placeDocks(); focusStage(false); });

  const hintBtn = (stage, extra = "") => `<button class="tool-btn hint" data-hint="${stage}" ${extra}>✒ Counsel</button>`;
  document.addEventListener("click", (e) => {
    const h = e.target.closest("[data-hint]");
    if (h) hint(+h.dataset.hint);
  });

  /* ---------- Dock I: Steganographic register (Wordle-style) ---------- */
  // reg[i] = null | { ch, src (ink id or null), locked }
  const steg = { reg: Array(8).fill(null), undo: [], redo: [], attempts: 0, busy: false };
  const snapSteg = () => JSON.stringify(steg.reg);

  function buildSteg() {
    const d = el("div", "dock dock-steg", `${RIVETS}
      <div class="steg-label"><p class="dock-title">Steganographic Register</p>
        <p class="dock-sub" id="steg-sub">Some types stand heavier than their neighbours. Tap them in the print, or type.</p></div>
      <div class="steg-plate" id="steg-plate" tabindex="0" role="textbox" aria-label="Steganographic register: eight letters">
        ${Array.from({ length: 8 }, (_, i) => `<span class="steg-cell" data-i="${i}"><b></b></span>`).join("")}</div>
      <div class="steg-keys">
        <button class="tool-btn" data-steg="undo" title="Undo" aria-label="Undo">↶</button>
        <button class="tool-btn" data-steg="redo" title="Redo" aria-label="Redo">↷</button>
        <button class="tool-btn" data-steg="back" title="Erase last" aria-label="Erase last letter">⌫</button>
        <button class="tool-btn" data-steg="clear" title="Clear">Clear</button>
        ${hintBtn(1, 'style="grid-column: span 2"')}
      </div>
      <input class="steg-hidden-input" id="steg-input" autocomplete="off" autocapitalize="characters" aria-hidden="true" tabindex="-1">
      ${SEAL("Sealed")}`);
    const input = $("#steg-input", d);
    $("#steg-plate", d).addEventListener("click", () => input.focus({ preventScroll: true }));
    input.addEventListener("input", () => {
      const v = input.value.toUpperCase().replace(/[^A-Z]/g, "");
      input.value = "";
      [...v].forEach((c) => stegPush(c, null));
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Backspace") { e.preventDefault(); stegOp("back"); } });
    $$("[data-steg]", d).forEach((b) => b.addEventListener("click", () => stegOp(b.dataset.steg)));
    return d;
  }

  function stegSave() {
    steg.undo.push(snapSteg());
    steg.redo = [];
  }

  function tapInk(L) {
    if (state.stage !== 1 || state.solved.has(1)) {
      audio.tick(1.1);
      return toast(state.solved.has(1) ? `“${L.word}”: the S-W-E-E-T-P-E-A trail is already yours.` : "A heavier type than its neighbours…");
    }
    if (steg.reg.some((c) => c && c.src === L.id)) return toast("That type is already set in the register.");
    stegPush(L.ch, L.id);
  }

  function stegPush(ch, src) {
    if (state.stage !== 1 || state.solved.has(1) || steg.busy) return;
    const i = steg.reg.indexOf(null);
    if (i < 0) return;
    stegSave();
    steg.reg[i] = { ch, src, locked: false };
    audio.typeKey();
    stegDraw(i);
    if (!steg.reg.includes(null)) setTimeout(stegEvaluate, 250);
  }

  function stegOp(op) {
    if (state.solved.has(1) || steg.busy) return;
    if (op === "undo" && steg.undo.length) { steg.redo.push(snapSteg()); steg.reg = JSON.parse(steg.undo.pop()); }
    else if (op === "redo" && steg.redo.length) { steg.undo.push(snapSteg()); steg.reg = JSON.parse(steg.redo.pop()); }
    else if (op === "back") {
      let i = -1;
      steg.reg.forEach((c, k) => { if (c && !c.locked) i = k; });
      if (i < 0) return;
      stegSave();
      steg.reg[i] = null;
    } else if (op === "clear") {
      if (!steg.reg.some((c) => c && !c.locked)) return;
      stegSave();
      steg.reg = steg.reg.map((c) => (c && c.locked ? c : null));
    } else return;
    audio.tick(op === "clear" ? 0.7 : 0.9);
    stegDraw();
  }

  function syncInk() {
    const used = new Set(steg.reg.filter(Boolean).map((c) => c.src));
    const locked = new Set(steg.reg.filter((c) => c && c.locked).map((c) => c.src));
    $$(".ink-letter").forEach((b) => {
      b.classList.toggle("found", used.has(b.dataset.id) || state.solved.has(1));
      b.classList.toggle("placed", locked.has(b.dataset.id) || state.solved.has(1));
    });
  }

  function stegDraw(typedIdx = -1) {
    const d = DOCKS[1].el;
    const next = steg.reg.indexOf(null);
    $$(".steg-cell", d).forEach((c, i) => {
      const r = steg.reg[i];
      $("b", c).textContent = r ? r.ch : "";
      c.classList.toggle("cur", i === next);
      c.classList.toggle("g", !!(r && r.locked) || state.solved.has(1));
      if (!r) c.classList.remove("y", "x", "g");
      if (i === typedIdx) { c.classList.remove("filled"); void c.offsetWidth; c.classList.add("filled"); }
    });
    syncInk();
  }

  function stegEvaluate() {
    const ans = [...ANSWERS.steg];
    const guess = steg.reg.map((c) => c.ch);
    const res = Array(8).fill("x");
    const left = {};
    ans.forEach((a, i) => { if (guess[i] === a) res[i] = "g"; else left[a] = (left[a] || 0) + 1; });
    guess.forEach((g, i) => { if (res[i] !== "g" && left[g] > 0) { res[i] = "y"; left[g]--; } });
    steg.attempts++;
    steg.busy = true;
    const cells = $$(".steg-cell", DOCKS[1].el);
    res.forEach((r, i) => setTimeout(() => {
      cells[i].classList.remove("flip", "g", "y", "x");
      void cells[i].offsetWidth;
      cells[i].classList.add("flip", r);
      audio.tick(r === "g" ? 1.5 : r === "y" ? 1.15 : 0.8);
    }, i * 110));
    const greens = res.filter((r) => r === "g").length;
    setTimeout(() => {
      if (greens === 8) {
        steg.busy = false;
        audio.ding();
        state.solved.add(1);
        stegDraw();
        state.solved.delete(1);
        setTimeout(() => solve(1), 500);
        return;
      }
      miss(1);
      audio.fail();
      $("#steg-sub", DOCKS[1].el).innerHTML = `Attempt ${steg.attempts}: <b>${greens}</b> in place. <span class="k-g">Green</span> stays; <span class="k-y">amber</span> belongs elsewhere.`;
      setTimeout(() => {
        steg.reg = steg.reg.map((c, i) => (res[i] === "g" ? { ...c, locked: true } : null));
        steg.undo = [];
        steg.redo = [];
        cells.forEach((c) => c.classList.remove("flip", "y", "x"));
        steg.busy = false;
        stegDraw();
      }, 1500);
    }, 8 * 110 + 450);
  }

  document.addEventListener("keydown", (e) => {
    if (state.phase !== "investigate" || state.stage !== 1 || tgOpen || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.matches("input, textarea") || !$("#lens-layer").hidden || !$("#wire-layer").hidden) return;
    if (state.solved.has(1) || e.shiftKey) return;
    if (/^[a-z]$/i.test(e.key)) {
      stegPush(e.key.toUpperCase(), null);
      e.stopImmediatePropagation();
    } else if (e.key === "Backspace") { e.preventDefault(); stegOp("back"); }
  }, true);

  /* ---------- Dock II: Tendril counter ---------- */
  let tendrils = 0;
  function buildTendril() {
    const strip = Array.from({ length: 10 }, (_, i) => `<span>${i}</span>`).join("");
    const d = el("div", "dock dock-tendril", `${RIVETS}
      <div><p class="dock-title">Botanical Verification</p>
        <p class="dock-sub">Mrs Lefevre's climber holds its stake with little coiled springs. Tally them.</p></div>
      <div class="tendril-body">
        <div class="odometer" aria-live="polite" aria-label="Tally">
          <div class="odo-digit"><div class="odo-strip" id="odo-t">${strip}</div></div>
          <div class="odo-digit"><div class="odo-strip" id="odo-u">${strip}</div></div>
        </div>
        <div class="tendril-ctl">
          <div class="row"><button class="brass-btn" data-t="-1" aria-label="One fewer">−</button><button class="brass-btn" data-t="1" aria-label="One more">+</button></div>
          <button class="brass-btn wax" id="t-verify">Seal the tally</button>
        </div>
      </div>
      <div class="tendril-foot"><span class="dock-sub" id="t-msg">The tally becomes the key.</span>${hintBtn(2)}</div>
      ${SEAL("Sealed until the register is solved")}`);
    $$("[data-t]", d).forEach((b) => b.addEventListener("click", () => {
      tendrils = Math.max(0, Math.min(99, tendrils + +b.dataset.t));
      audio.tick(1 + tendrils * 0.04);
      $("#odo-t", d).style.transform = `translateY(${-Math.floor(tendrils / 10) * 58}px)`;
      $("#odo-u", d).style.transform = `translateY(${-(tendrils % 10) * 58}px)`;
    }));
    $("#t-verify", d).addEventListener("click", () => {
      if (tendrils === ANSWERS.tendrils) solve(2);
      else {
        audio.fail();
        miss(2);
        $("#t-msg", d).textContent = !tendrils ? "Count first, then seal." : tendrils > 6 ? "Too many. Leaves are not springs." : "Too few. Look on both sides of the stake.";
      }
    });
    return d;
  }

  function openFlora() {
    audio.rustle(0.4, 0.5);
    openLens(`<p class="lens-h">Floriography 101</p>
      <p class="lens-p">Victorians said with flowers what they could not say aloud. Mother taught Enola this tongue before her letters.</p>
      <div class="flora big">${FLORA.map(([f, m]) => `<p><b>${f}</b><span>${m}</span></p>`).join("")}</div>
      <p class="lens-p" style="margin-top:10px">This woodcut is also a measure: count what holds the sweet pea to its stake.</p>`);
  }

  /* ---------- Stage III: the sixth watch & its cipher disc ---------- */
  function honestWatch(i) {
    audio.tick(1 + i * 0.05);
    const lines = [
      "An honest watch. It keeps time, and nothing else.",
      "Five pounds of good Cheapside craft, and not one secret.",
      "It ticks. That is all it does.",
      "A fine half-hunter. Fine, and empty.",
      "A gentleman's watch. Mother would not hide in a gentleman's watch.",
    ];
    if (state.stage === 3 && !state.solved.has(3)) toast(lines[i] || lines[0]);
  }
  function openWatch() {
    if (state.maxStage < 3) return toast("A handsome watch, at a handsome price. Its moment has not come.");
    if (!state.watchFound) {
      state.watchFound = true;
      audio.westminster(0, 0);
      audio.ding();
      $("#btn-instrument").hidden = false;
    }
    openCipher();
  }

  function openCipher() {
    const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const INNER = ["1","2","3","4","5","6","7","8","9","·","†","‡","§","¶","*","#","%","&","Ω","Δ","Φ","Ψ","★","✦","✧","⚙"];
    const step = 360 / 26;
    const glyphs = (arr, cls) => arr.map((c, i) => `<div class="g3 ${cls}" style="transform:rotate(${i * step}deg)">${c}</div>`).join("");
    const rivets = (n, r) => Array.from({ length: n }, (_, i) => {
      const a = ((i + 0.5) * 360 / n) * Math.PI / 180;
      return `<i class="rv" style="left:${50 + r * Math.sin(a)}%;top:${50 - r * Math.cos(a)}%"></i>`;
    }).join("");
    const solved = state.solved.has(3);
    openLens(`
      <p class="lens-h">Benson's Lady's Watch · £6</p>
      <p class="lens-p">The back springs open with a click. Inside there is no movement at all: only a brass cipher engine, and a line engraved around the case.</p>
      <div class="cipher-tape">${ANSWERS.cipherText}</div>
      <div class="c3-bar">
        <button class="c3-cam" data-cam="iso">Isometric</button>
        <button class="c3-cam" data-cam="plan">Plan</button>
        <button class="c3-cam on" data-cam="persp">Perspective</button>
      </div>
      <div class="c3-view" id="c3-view">
        <div class="c3-rig" id="c3-rig">
          <div class="c3-desk"></div>
          <div class="c3-wall"></div>
          <div class="c3-ring c3-outer">${rivets(26, 48.2)}${glyphs([...L], "go")}
            <svg class="c3-needle" viewBox="0 0 28 36"><path d="M14 34 L3 8 L14 1 L25 8 Z" fill="#e0a945" stroke="#3f2305" stroke-width="1.5"/><circle cx="14" cy="11" r="3" fill="#ffeaa7" stroke="#4a2c07"/></svg>
            <i class="c3-sheen"></i></div>
          <div class="c3-ring c3-mid" id="c3-mid">${rivets(26, 47.6)}${glyphs([...L], "gm")}<b class="c3-mark"></b><i class="c3-sheen"></i></div>
          <div class="c3-ring c3-core" id="c3-core">${glyphs(INNER, "gi")}<i class="c3-sheen"></i></div>
          <div class="c3-ring c3-spindle"><span id="c3-nut">0</span></div>
        </div>
      </div>
      <p class="lens-p" style="font-size:13px">Drag the middle ring. Right-drag or Alt-drag to orbit the engine. Each notch turns every engraved letter one place back.</p>
      <div class="cipher-out" id="cipher-out"></div>
      <div class="lens-row">
        <button class="brass-btn small" id="c-minus">↶ −1</button>
        <button class="brass-btn small" id="c-plus">+1 ↷</button>
        <button class="brass-btn wax" id="c-lock" ${solved ? "disabled" : ""}>Lock in</button>
        ${hintBtn(3).replace("tool-btn hint", "brass-btn small")}
      </div>`, null, "watch-lens");
    const rig = $("#c3-rig"), mid = $("#c3-mid"), core = $("#c3-core"), out = $("#cipher-out"), view = $("#c3-view");
    const CAMS = { iso: [55, 35], plan: [0, 0], persp: [30, 15] };
    let camX = 30, camZ = 15, angle = 0, stepN = 0, coreA = 0, drag = null;
    const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV"];
    const decode = (k) => ANSWERS.cipherText.replace(/[A-Z]/g, (c) => L[(L.indexOf(c) - k + 26) % 26]);
    const setCam = (smooth) => {
      rig.style.transition = smooth ? "transform .7s cubic-bezier(.19,1,.22,1)" : "none";
      rig.style.transform = `rotateX(${camX}deg) rotateZ(${camZ}deg)`;
    };
    const draw = () => {
      const k = ((stepN % 26) + 26) % 26;
      $("#c3-nut").textContent = ROMAN[k];
      out.innerHTML = `<span class="off">TURNED ${k}</span> · ${decode(k)}`;
      return k;
    };
    const setRing = (a, snap) => {
      angle = a;
      mid.style.transition = snap ? "transform .3s cubic-bezier(.18,.89,.32,1.28)" : "none";
      mid.style.transform = `translateZ(10px) rotate(${angle}deg)`;
      core.style.transition = mid.style.transition;
      core.style.transform = `translateZ(20px) rotate(${-angle * 0.5 + coreA}deg)`;
      const s = Math.round(angle / step);
      if (s !== stepN) { stepN = s; audio.tick(1 + (Math.abs(s) % 6) * 0.06); draw(); }
    };
    const angAt = (x, y) => {
      const r = mid.getBoundingClientRect();
      return Math.atan2(x - (r.left + r.width / 2), -(y - (r.top + r.height / 2))) * 180 / Math.PI;
    };
    view.addEventListener("contextmenu", (e) => e.preventDefault());
    view.addEventListener("pointerdown", (e) => {
      view.setPointerCapture(e.pointerId);
      const orbit = e.button === 2 || e.altKey || !e.target.closest(".c3-mid, .c3-core, .c3-spindle");
      drag = orbit ? { mode: "orbit", x: e.clientX, y: e.clientY } : { mode: "ring", a0: angAt(e.clientX, e.clientY), ang0: angle };
    });
    view.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (drag.mode === "orbit") {
        camZ += (e.clientX - drag.x) * 0.5;
        camX = Math.max(0, Math.min(80, camX - (e.clientY - drag.y) * 0.5));
        drag.x = e.clientX; drag.y = e.clientY;
        setCam(false);
        $$(".c3-cam").forEach((b) => b.classList.remove("on"));
      } else {
        let d = angAt(e.clientX, e.clientY) - drag.a0;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        setRing(drag.ang0 + d);
        if (Math.abs(d) > 150) { drag.a0 = angAt(e.clientX, e.clientY); drag.ang0 = angle; }
      }
    });
    const up = () => {
      if (drag && drag.mode === "ring") setRing(Math.round(angle / step) * step, true);
      drag = null;
    };
    view.addEventListener("pointerup", up);
    view.addEventListener("pointercancel", up);
    $$(".c3-cam").forEach((b) => b.addEventListener("click", () => {
      [camX, camZ] = CAMS[b.dataset.cam];
      $$(".c3-cam").forEach((x) => x.classList.toggle("on", x === b));
      audio.tick(0.8);
      setCam(true);
    }));
    $("#c-plus").addEventListener("click", () => setRing((stepN + 1) * step, true));
    $("#c-minus").addEventListener("click", () => setRing((stepN - 1) * step, true));
    $("#c-lock").addEventListener("click", () => {
      if (draw() === ANSWERS.cipherShift) { closeLens(); solve(3); }
      else { audio.fail(); miss(3); out.innerHTML += "<br><em>Gibberish. The key grew on page two.</em>"; }
    });
    setCam(false);
    // the engine rises out of the case
    rig.style.transform = "rotateX(80deg) rotateZ(0deg) scale(.6)";
    requestAnimationFrame(() => requestAnimationFrame(() => setCam(true)));
    setRing(solved ? ANSWERS.cipherShift * step : 0, true);
    draw();
  }

  /* ---------- Dock IV: Opera boxes + Madame Elara's fan legend ---------- */
  const FAN = {
    1: '<svg viewBox="0 0 44 40"><path d="M22 36 L4 14 A22 22 0 0 1 40 14 Z" fill="#f3dfb5" stroke="#2c1e05"/><path d="M22 36 L10 9 M22 36 L22 6 M22 36 L34 9" stroke="#8a6a3c"/></svg>',
    2: '<svg viewBox="0 0 44 40"><circle cx="22" cy="12" r="7" fill="#f3dfb5"/><path d="M22 38 L6 22 A18 18 0 0 1 38 22 Z" fill="#f3dfb5" stroke="#2c1e05"/><path d="M22 38 L14 18 M22 38 L22 16 M22 38 L30 18" stroke="#8a6a3c"/></svg>',
    3: '<svg viewBox="0 0 44 40"><path d="M8 30 L40 12 L42 16 L10 34 Z" fill="#f3dfb5" stroke="#2c1e05"/><circle cx="8" cy="32" r="3" fill="#e5bd68"/></svg>',
  };
  const BOX_READ = {
    1: "Box I. Her fan lies open, pressed flat over her heart. White kid gloves. Her eyes never leave yours.",
    2: "Box II. Her fan is raised to veil all but her eyes. Lavender gloves, perfectly still.",
    3: "Box III. The fan is shut in a fist and jabbed at the river window like a constable's truncheon. Gloves of yellow kid, strained over broad knuckles.",
  };
  let operaSel = 0;
  function buildOpera() {
    const d = el("div", "dock dock-opera", `${RIVETS}
      <div><p class="dock-title">Opera Glass · Grand Tier</p><p class="dock-sub">Two ladies speak in fans. One only waves one.</p></div>
      <div class="box-row">${[1, 2, 3].map((n) => `<button class="opera-box" data-box="${n}" aria-label="Grand tier box ${n}">${FAN[n]}<b>${["I", "II", "III"][n - 1]}</b></button>`).join("")}</div>
      <div class="opera-read" id="opera-read" aria-live="polite">Raise the glass to a box.</div>
      <div class="opera-foot"><button class="tool-btn" id="opera-guide">❦ Fan guide</button>${hintBtn(4)}<button class="brass-btn wax small" id="opera-accuse" disabled>Unmask</button></div>
      ${SEAL("Sealed until the watch gives up its secret")}`);
    $$(".opera-box", d).forEach((b) => b.addEventListener("click", () => {
      operaSel = +b.dataset.box;
      $$(".opera-box", d).forEach((x) => x.classList.toggle("sel", x === b));
      $("#opera-read", d).textContent = BOX_READ[operaSel];
      $("#opera-accuse", d).disabled = false;
      audio.tick(1.2);
    }));
    $("#opera-guide", d).addEventListener("click", openFanLegend);
    $("#opera-accuse", d).addEventListener("click", () => {
      if (operaSel === ANSWERS.cutterBox) solve(4);
      else {
        audio.fail();
        miss(4);
        $("#opera-read", d).textContent = "She lowers her fan and meets your eye: a true lady, and her gesture is in the guide. She is warning you, not hiding.";
      }
    });
    return d;
  }

  // Small engraved figures for each gesture
  function fanFig(kind) {
    const sector = (cx, cy, r, a0, a1) => {
      const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      const ribs = [0.25, 0.5, 0.75].map((t) => { const [x, y] = p(a0 + (a1 - a0) * t); return `M${cx} ${cy} L${x.toFixed(1)} ${y.toFixed(1)}`; }).join(" ");
      return `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" class="fan"/><path d="${ribs}" class="rib"/>`;
    };
    const closed = (x0, y0, x1, y1) => `<path d="M${x0} ${y0} L${x1} ${y1}" class="shut"/>`;
    const bust = '<circle cx="40" cy="22" r="10" class="head"/><path d="M18 70 C20 44 60 44 62 70" class="body"/>';
    const F = {
      heart: sector(40, 62, 17, 215, 325),
      veil: sector(40, 40, 18, 210, 330),
      cheekR: sector(54, 30, 14, 240, 330),
      cheekL: sector(26, 30, 14, 210, 300),
      twirl: closed(14, 56, 6, 40) + '<path d="M4 36 a7 7 0 1 1 9 6" class="arrow"/>',
      snap: sector(64, 50, 12, 230, 320) + '<path d="M58 32 l4 -6 M66 30 l2 -7 M72 34 l5 -5" class="arrow"/>',
      drop: closed(56, 64, 66, 74) + '<path d="M60 52 v8" class="arrow"/>',
      tip: closed(56, 40, 70, 26) + '<circle cx="70" cy="26" r="2.6" class="head"/>',
      river: sector(58, 54, 15, 20, 110),
    };
    return `<svg viewBox="0 0 80 76" class="fan-fig" aria-hidden="true">${bust}${F[kind]}</svg>`;
  }

  function openFanLegend() {
    const G = [
      ["heart", "Open, pressed to the heart", "Run. Leave this place at once."],
      ["veil", "Raised to veil all but the eyes", "We are watched."],
      ["river", "Half-open, tipped toward the floor", "Meet me by the river."],
      ["cheekR", "Rested on the right cheek", "Yes."],
      ["cheekL", "Rested on the left cheek", "No."],
      ["tip", "Its tip touched with a finger", "I wish to speak with you."],
      ["snap", "Opened and shut sharply", "You are cruel."],
      ["twirl", "Twirled in the left hand", "I wish to be rid of you."],
      ["drop", "Let fall to the floor", "We shall be friends."],
    ];
    const panels = [G.slice(0, 3), G.slice(3, 6), G.slice(6, 9)];
    openLens(`
      <div class="pamphlet" id="pamphlet">
        <div class="pp-cover">
          <p class="pp-kicker">Madame Elara presents</p>
          <h2>The Fan's Own Tale</h2>
          <p class="pp-sub">A Lady's Essential Guide · selected gestures</p>
        </div>
        <div class="pp-panels">
          ${panels.map((col, i) => `<div class="pp" style="--i:${i}">${col.map(([k, how, means]) =>
            `<div class="gesture">${fanFig(k)}<div><p class="g-how">${how}</p><p class="g-means">“${means}”</p></div></div>`).join("")}</div>`).join("")}
        </div>
        <p class="pp-foot">Mark well: a gesture not set down in this guide belongs to no lady's tongue. Whoever makes it does not speak the language, and so is no lady at all.</p>
      </div>`, null, "pamphlet-lens");
    audio.rustle(0.5, 0.6);
    [350, 750, 1150].forEach((t) => setTimeout(() => audio.rustle(0.35, 0.5), t));
  }

  /* ---------- Stage V: the signal lamp, the despatch, and Decoder 101 ---------- */
  const SHIP_CODE = [...ANSWERS.ship].map((c) => MORSE[c]).join(" ");
  let lampTimer = null, lampCaught = false;
  function lampSequence() {
    // returns [[on, ms], ...] for one pass of the ship's name; dot = 1 unit
    const U = 260, seq = [];
    [...ANSWERS.ship].forEach((ch, li) => {
      [...MORSE[ch]].forEach((sym, si) => {
        seq.push([true, sym === "." ? U : U * 3, sym, li]);
        seq.push([false, si === MORSE[ch].length - 1 ? U * 3 : U]);
      });
    });
    seq[seq.length - 1][1] = U * 9; // long dark pause before repeating
    return seq;
  }
  function startLamp() {
    stopLamp();
    const seq = lampSequence();
    let i = 0;
    const tickLamp = () => {
      const lamp = $(".sig-lamp");
      if (!lamp) return stopLamp();
      const [on, ms, sym, li] = seq[i];
      lamp.classList.toggle("on", on);
      if (on && lampCaught && state.page === 5) {
        const strip = $("#lamp-strip");
        if (strip && strip.dataset.done !== "1") {
          strip.textContent += (li !== +strip.dataset.li && strip.textContent ? "  " : "") + (sym === "." ? "·" : "–");
          strip.dataset.li = li;
        }
      }
      i++;
      if (i >= seq.length) {
        i = 0;
        const strip = $("#lamp-strip");
        if (lampCaught && strip && strip.textContent) {
          if (strip.dataset.done !== "1") {
            strip.dataset.done = "1";
            toast("The lamp has spelled its name in full. Take the groups to the Morse Code Decoder 101, bottom right.", 4200);
            if (state.stage === 5 && !state.solved.has(5)) setTimeout(() => focusRect(narrowMQ.matches ? [400, 980, 600, 430] : STAGES[5].decoder), 1200);
          }
        }
      }
      lampTimer = setTimeout(tickLamp, ms);
    };
    tickLamp();
  }
  function stopLamp() { clearTimeout(lampTimer); lampTimer = null; }
  function catchLamp() {
    if (state.maxStage < 5) { audio.tick(1); return toast("Steamers on the river, smoke on the water. Nothing to read here yet."); }
    const strip = $("#lamp-strip");
    if (lampCaught && strip && strip.dataset.done === "1") return toast(`The lamp spells: ${strip.textContent}`, 4200);
    if (!lampCaught) {
      lampCaught = true;
      audio.ding();
      $(".thames-spot").classList.add("caught");
      strip.textContent = "";
      strip.dataset.li = "-1";
      toast("You catch the steamer's lamp. Every flash is being written down for you: short, long…", 3600);
      startLamp();
    }
  }
  function hearDespatch() {
    audio.playMorse(SHIP_CODE.replace(/ /g, "   ").split("").join(""));
    toast("Listen: Morse is a rhythm as much as a mark. The same ship's name, sent by ear: dit, dah.", 4200);
  }

  const DITDAH = (code) => [...code].map((c) => (c === "." ? "dit" : "dah")).join("-");
  const LETTER_NOTES = {
    E: "the commonest letter in English gets the shortest code", T: "a single dah", A: "dit-dah, like 'a-WAY'",
    N: "A turned around", I: "two dits", M: "two dahs", S: "three dits: the first of SOS", O: "three dahs", H: "four dits",
  };
  let dkey = "", dword = "";
  function buildDecoder() {
    const d = el("div", "dock dock-decoder", `${RIVETS}
      <div class="dec-head"><p class="dock-title">Morse Code Decoder 101</p>${hintBtn(5)}</div>
      <div class="dec-screen" aria-live="polite"><span class="dec-key" id="dec-key">key a group…</span><span class="dec-out" id="dec-out"></span></div>
      <div class="dec-keys">
        <button class="brass-btn small" data-k="." aria-label="Dot">· dit</button>
        <button class="brass-btn small" data-k="-" aria-label="Dash">– dah</button>
        <button class="tool-btn" data-k="back" aria-label="Erase">⌫</button>
        <button class="tool-btn" data-k="add" id="dec-add">Write ▸</button>
      </div>
      <div class="dec-slots" id="dec-slots" aria-label="The ship's name, letter by letter">${Array.from({ length: ANSWERS.ship.length }, (_, i) =>
        `<input class="dec-slot" maxlength="1" autocomplete="off" autocapitalize="characters" aria-label="Letter ${i + 1}">`).join("")}</div>
      ${SEAL("Sealed until the impostor is named")}`);
    const keyEl = $("#dec-key", d), outEl = $("#dec-out", d);
    const slots = $$(".dec-slot", d);
    const LOOK = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
    const show = () => {
      if (!dkey) { keyEl.textContent = "key a group…"; outEl.textContent = ""; return; }
      keyEl.textContent = dkey.replace(/\./g, "·").replace(/-/g, "–");
      const L = LOOK[dkey];
      outEl.innerHTML = L ? `= <b>${L}</b> · ${LETTER_NOTES[L] || DITDAH(dkey)}` : "<em>no letter has that rhythm yet</em>";
    };
    // check the slots: correct letters lock green; when all are right, the case moves on by itself
    const check = () => {
      if (state.solved.has(5)) return;
      const word = slots.map((x) => x.value.toUpperCase()).join("");
      if (word.length < slots.length) return;
      if (word === ANSWERS.ship) {
        slots.forEach((x, i) => setTimeout(() => { x.classList.add("ok"); audio.tick(1.2 + i * 0.05); }, i * 90));
        setTimeout(() => solve(5), slots.length * 90 + 400);
        return;
      }
      audio.fail();
      miss(5);
      slots.forEach((x, i) => {
        const right = x.value.toUpperCase() === ANSWERS.ship[i];
        x.classList.toggle("ok", right);
        x.readOnly = right;
        if (!right) { x.classList.remove("bad"); void x.offsetWidth; x.classList.add("bad"); setTimeout(() => (x.value = ""), 500); }
      });
      toast("Green letters are right. Decode the others again.");
    };
    const nextEmpty = () => slots.find((x) => !x.value);
    slots.forEach((x, i) => {
      x.addEventListener("input", () => {
        x.value = x.value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
        if (x.value) { audio.typeKey(); const n = slots.slice(i + 1).find((y) => !y.value); n ? n.focus() : x.blur(); }
        check();
      });
      x.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !x.value && i > 0 && !slots[i - 1].readOnly) { slots[i - 1].value = ""; slots[i - 1].focus(); }
      });
    });
    $$("[data-k]", d).forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.k;
      if (k === "." || k === "-") {
        if (dkey.length >= 5) return;
        dkey += k;
        audio.ctx && audio.beep(audio.ctx.currentTime, k === "." ? 0.08 : 0.24);
      } else if (k === "back") dkey = dkey.slice(0, -1);
      else if (k === "add") {
        const L = LOOK[dkey], slot = nextEmpty();
        if (!L || !slot) { audio.fail(); return; }
        slot.value = L;
        slot.classList.remove("pop"); void slot.offsetWidth; slot.classList.add("pop");
        dkey = "";
        audio.typeKey();
        check();
      }
      show();
    }));
    return d;
  }

  /* ---------- Stage VI: the barge ---------- */
  function openClimax() {
    const p = ARCHETYPES[state.archetype];
    audio.setMusic("tension");
    openLens(`
      <p class="lens-h">The Coal Barge · Rotherhithe, Berth 4</p>
      <div class="climax-art" id="c-art"><div class="lamp"></div><div class="hull"></div><div class="water"></div></div>
      <p class="lens-p" id="c-text">You slip down into the bilge. Squeaky stands guard over Viscount Tewksbury, chained to a rib of the hull, while Cutter watches from the hatch above. The tide is turning, and so is the key in Cutter's pocket.</p>
      <p class="lens-p" style="margin-top:8px"><b>${p.weapon}</b></p>
      <div class="lens-row" style="margin-top:12px"><button class="brass-btn wax" id="c-act">${p.verb}</button></div>`);
    $("#c-act").addEventListener("click", async () => {
      audio.strike();
      $("#c-art").classList.add("dark");
      $("#c-act").disabled = true;
      await wait(500);
      $("#c-text").textContent = p.action + " Tewksbury scrambles free beside you, sailor's boots and all, and the two of you run for the river stairs.";
      audio.setMusic("waltz");
      const row = $("#c-act").parentElement;
      row.innerHTML = '<button class="brass-btn wax" id="c-go">Up the river stairs</button>';
      $("#c-go").addEventListener("click", () => { closeLens(); solve(6); });
    });
  }

  /* ---------- Epilogue: the photograph & the share card ---------- */
  // Original engraved scene: two small figures on the Rotherhithe river stairs at dawn, seen from behind
  const FINALE_SVG = `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" class="finale-svg" role="img" aria-label="At dawn, Enola and the young Viscount sit on the river stairs at Rotherhithe, looking across the Thames at the half-built Tower Bridge.">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9bf8f"/><stop offset=".7" stop-color="#f2dfb6"/><stop offset="1" stop-color="#e8cf9c"/></linearGradient>
      <linearGradient id="riv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7a874"/><stop offset="1" stop-color="#6d5233"/></linearGradient>
      <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0 V5" stroke="#3b2a17" stroke-width="1.1" opacity=".55"/></pattern>
      <pattern id="water" width="40" height="7" patternUnits="userSpaceOnUse"><path d="M0 4 Q10 1 20 4 T40 4" fill="none" stroke="#3b2a17" stroke-width=".9" opacity=".45"/></pattern>
      <radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6dc"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="600" height="380" fill="url(#sky)"/>
    <circle cx="372" cy="176" r="90" fill="url(#sun)"/>
    <circle cx="372" cy="176" r="26" fill="#fff3d0" opacity=".9"/>
    <g fill="#8a7050" opacity=".55">
      <path d="M40 196 h60 v-16 h10 v-10 h12 v10 h10 v16 h40 v12 H40z"/>
      <path d="M96 170 a18 18 0 0 1 36 0 z"/><rect x="112" y="150" width="4" height="14"/>
      <rect x="470" y="182" width="90" height="26"/><rect x="486" y="168" width="6" height="14"/><rect x="520" y="172" width="5" height="10"/>
    </g>
    <g fill="#5e4a32" stroke="#3b2a17" stroke-width="1">
      <rect x="232" y="120" width="30" height="88"/><rect x="330" y="120" width="30" height="88"/>
      <path d="M226 120 l21 -24 l21 24z M324 120 l21 -24 l21 24z"/>
    </g>
    <g stroke="#3b2a17" stroke-width="1.1" opacity=".8" fill="none">
      <path d="M228 120 V96 M266 120 V96 M326 120 V96 M364 120 V96 M228 108 H266 M326 108 H364 M228 96 l38 24 M266 96 l-38 24"/>
      <path d="M262 150 Q296 164 330 150 M262 158 H330"/>
      <path d="M150 196 Q190 150 232 140 M360 140 Q410 150 452 196"/>
    </g>
    <rect x="0" y="206" width="600" height="110" fill="url(#riv)"/>
    <rect x="0" y="206" width="600" height="110" fill="url(#water)"/>
    <path d="M400 210 l6 46 l8 -46 z M420 214 l4 30 l4 -30z" fill="#fff3d0" opacity=".5"/>
    <g fill="#3b2a17" opacity=".75"><path d="M120 222 h46 l-6 8 h-34z"/><rect x="140" y="200" width="2" height="22"/><path d="M142 202 l14 14 h-14z" opacity=".6"/></g>
    <g fill="#2d2013"><path d="M470 236 c4 -3 8 -3 12 0 c-4 -1 -8 -1 -12 0z M500 150 q6 -5 12 0 q-6 -2 -12 0z M520 140 q5 -4 10 0 q-5 -2 -10 0z"/></g>
    <path d="M0 300 L600 300 L600 380 L0 380Z" fill="#7d6545"/>
    <path d="M0 300 L600 300 L600 380 L0 380Z" fill="url(#hatch)" opacity=".7"/>
    <g fill="#6a5438" stroke="#2d2013" stroke-width="1.2"><path d="M0 300 h600 v12 H0z"/><path d="M0 330 h600 v10 H0z" opacity=".8"/></g>
    <g stroke="#2d2013" stroke-width="3" fill="#2d2013">
      <path d="M70 300 V150" fill="none"/><path d="M58 150 h24 l-4 -22 h-16z" fill="#5e4a32"/><circle cx="70" cy="138" r="5" fill="#fff0c4" stroke="none"/>
      <path d="M62 300 h16" fill="none"/>
    </g>
    <g fill="#2a1d10">
      <path d="M268 300 C266 262 270 246 282 236 C288 232 300 232 306 236 C318 246 322 262 322 300 Z"/>
      <path d="M282 238 C280 222 284 214 294 212 C304 214 308 222 306 238 Z"/>
      <circle cx="294" cy="206" r="11"/>
      <path d="M280 199 C284 188 304 188 308 199 C302 196 286 196 280 199 Z"/><path d="M282 198 h24 v3 h-24z"/>
      <path d="M300 197 l10 4 l-2 4z"/>
      <path d="M318 280 l26 -30" stroke="#2a1d10" stroke-width="3"/>
      <path d="M338 300 C337 272 340 258 350 252 C358 248 366 250 372 256 C378 264 378 282 378 300 Z"/>
      <circle cx="357" cy="238" r="9"/>
      <path d="M346 236 C348 224 368 224 370 236 Z"/><path d="M344 234 h28 v3 h-28z"/>
      <path d="M352 222 h2 v-4 h-2z"/>
    </g>
    <rect x="0" y="0" width="600" height="380" fill="none" stroke="#3b2a17" stroke-width="6"/>
  </svg>`;

  function caseStats() {
    const end = state.finishedAt || Date.now();
    const mins = Math.max(1, Math.round((end - state.startedAt) / 60000));
    const grid = [1, 2, 3, 4, 5, 6].map((n) => (state.hintUse[n] ? "🟨" : "🟩"));
    return { mins, grid };
  }
  function shareText() {
    const p = ARCHETYPES[state.archetype];
    const { mins, grid } = caseStats();
    return `THE PALL MALL GAZETTE · Case No. 6207 · SOLVED
The Case of the Missing Marquess
${["I", "II", "III", "IV", "V", "VI"].map((r, i) => `${r} ${grid[i]}`).join("  ")}
${p.title} · ${mins} min · ${state.hints} counsel ${state.hints === 1 ? "wire" : "wires"}
🟩 solved unaided · 🟨 with Lady Eudoria's counsel
#TheLivingBroadsheet`;
  }

  async function makeShareCard(pc) {
    const p = ARCHETYPES[state.archetype];
    const { mins } = caseStats();
    const c = document.createElement("canvas");
    c.width = 1080; c.height = 1350;
    const x = c.getContext("2d");
    x.fillStyle = "#efe3c6"; x.fillRect(0, 0, 1080, 1350);
    const g = x.createRadialGradient(540, 600, 200, 540, 640, 900);
    g.addColorStop(0, "rgba(255,255,255,0.35)"); g.addColorStop(1, "rgba(120,80,30,0.25)");
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
    x.strokeStyle = "#3b2a17"; x.lineWidth = 6; x.strokeRect(36, 36, 1008, 1278);
    x.lineWidth = 2; x.strokeRect(50, 50, 980, 1250);
    x.fillStyle = "#16120e"; x.textAlign = "center";
    x.font = "700 22px Cinzel, Georgia, serif"; x.fillText("THE PALL MALL GAZETTE  ·  CASE No. 6207", 540, 110);
    x.font = "900 64px Cinzel, Georgia, serif"; x.fillText("THE MARQUESS IS FOUND", 540, 190);
    x.font = "italic 30px 'IM Fell English', Georgia, serif"; x.fillText("The Case of the Missing Marquess · London, 1888", 540, 240);
    const img = pc || (await postcardImg());
    if (img) {
      const r = Math.max(900 / img.width, 570 / img.height), w = img.width * r, h = img.height * r;
      x.save(); x.beginPath(); x.rect(90, 280, 900, 570); x.clip();
      try { x.drawImage(img, 90 + (900 - w) / 2, 280 + (570 - h) / 2, w, h); } catch (e) {}
      x.restore();
    }
    x.strokeStyle = "#3b2a17"; x.lineWidth = 3; x.strokeRect(90, 280, 900, 570);
    x.font = "italic 30px 'IM Fell English', Georgia, serif"; x.fillStyle = "#2b1c11";
    x.fillText("Miss Enola Holmes, perditorian, and the Viscount Tewksbury, free.", 540, 900);
    // the stage grid
    const n = 6, size = 92, gap = 22, startX = 540 - (n * size + (n - 1) * gap) / 2;
    ["I", "II", "III", "IV", "V", "VI"].forEach((r, i) => {
      const used = !!state.hintUse[i + 1];
      x.fillStyle = used ? "#b8892a" : "#3d7a3a";
      x.fillRect(startX + i * (size + gap), 950, size, size);
      x.fillStyle = "#fff6dc"; x.font = "700 34px Cinzel, Georgia, serif";
      x.fillText(r, startX + i * (size + gap) + size / 2, 950 + size / 2 + 12);
    });
    x.fillStyle = "#16120e"; x.font = "700 34px Cinzel, Georgia, serif";
    x.fillText(`${p.title.toUpperCase()}  ·  ${mins} MIN  ·  ${state.hints} COUNSEL`, 540, 1110);
    x.font = "19px 'Special Elite', 'Courier New', monospace"; x.fillStyle = "#6b1414";
    x.fillText("AM BLOOMING IN THE SUN. NOT ONLY CHRYSANTHEMUM, ALSO RAMBLING ROSE.", 540, 1170);
    x.font = "italic 26px 'IM Fell English', Georgia, serif"; x.fillStyle = "#463b32";
    x.fillText("The Living Broadsheet · an investigative lens", 540, 1250);
    return c.toDataURL("image/png");
  }

  function postcardImg() {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => {
        const f = new Image();
        f.onload = () => res(f);
        f.onerror = () => res(null);
        f.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(FINALE_SVG.replace('class="finale-svg"', ""));
      };
      im.src = POSTCARD_SRC;
    });
  }

  async function openEpilogue(retake) {
    await wait(retake ? 200 : 900);
    audio.shutter();
    const f = $("#flash");
    f.classList.remove("pop"); void f.offsetWidth; f.classList.add("pop");
    await wait(900);
    if (!state.finishedAt) state.finishedAt = Date.now();
    const p = ARCHETYPES[state.archetype];
    const { mins } = caseStats();
    const pc = await postcardImg();
    const SKILLS = [
      ["I", "Steganography", "eight heavy types read"],
      ["II", "Floriography", "sweet pea: departure"],
      ["III", "Cryptography", "Alberti engine turned VI"],
      ["IV", "Fan language", "an impostor unmasked"],
      ["V", "Morse by light", "the Starling hailed"],
      ["VI", "Field method", p.title.replace("The ", "")],
    ];
    openLens(`
      <div class="receipt">
        <p class="rc-co">EASTMAN DRY PLATE &amp; FILM CO.</p>
        <p class="rc-addr">115 Oxford Street, London W. · Developing &amp; Printing</p>
        <p class="rc-line">ORDER No. 6207 · ${new Date().toLocaleDateString("en-GB")}</p>
        <p class="rc-line">FOR: Miss E. Holmes, Perditorian</p>
        <div class="rc-rows">${SKILLS.map(([r, k, v], i) => `<p class="${i < 5 ? (state.hintUse[i + 1] ? "aid" : "ok") : ""}"><span>${r}. ${k}</span><span>${v}</span></p>`).join("")}</div>
        <div class="rc-rows tot">
          <p><span>Time at the Gazette</span><span>${mins} min</span></p>
          <p><span>Counsel wires</span><span>${state.hints}</span></p>
          <p><span>Field tool</span><span>${p.weapon}</span></p>
          <p class="rc-total"><span>TOTAL</span><span>One Marquess, returned</span></p>
        </div>
        <p class="rc-stamp">PAID</p>
        <p class="rc-foot">You press the button, we do the rest.</p>
      </div>
      <div class="postcard" id="postcard" tabindex="0" role="button" aria-label="Postcard: tap to turn over">
        <div class="pc-front">${pc ? `<img src="${pc.src}" alt="Postcard photograph">` : FINALE_SVG}<span class="pc-hint">Tap to turn over</span></div>
        <div class="pc-back">
          <div class="pc-msg"><p>My dear Enola,</p><p>Am blooming in the sun. Not only chrysanthemum, also rambling rose.</p><p>Live freely.</p><p class="pc-sig">— M.</p></div>
          <div class="pc-addr"><span class="pc-stamp">1d</span><span class="pc-post">LONDON · DE 4 · 88</span><p>Miss Enola Holmes</p><p>Finder of Lost Persons</p><p>London</p></div>
        </div>
      </div>
      <p class="lens-p">Tewksbury introduces himself to an astonished Sherlock Holmes and Inspector Lestrade. Cutter and Squeaky are taken in irons. Keep this postcard as your namesake.</p>
      <div class="share-box">
        <p class="nb-label">Share your case file</p>
        <pre class="share-text" id="share-text"></pre>
        <div class="lens-row">
          <button class="brass-btn small" id="e-copy">Copy result</button>
          <button class="brass-btn small" id="e-card">Make my postcard</button>
        </div>
        <div id="share-card-wrap"></div>
      </div>
      <div class="lens-row" style="margin-top:12px">
        <button class="brass-btn" id="e-read">Read the Gazette freely</button>
        <button class="brass-btn wax" id="e-again">Begin anew</button>
      </div>`, null, "epilogue-lens");
    const card = $("#postcard");
    const flip = () => { card.classList.toggle("flipped"); audio.rustle(0.3, 0.4); };
    card.addEventListener("click", flip);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    $("#share-text").textContent = shareText();
    $("#e-copy").addEventListener("click", async () => {
      const txt = shareText();
      try { await navigator.clipboard.writeText(txt); toast("Copied. Paste it to a friend."); }
      catch (e) {
        const r = document.createRange();
        r.selectNodeContents($("#share-text"));
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        toast("Selected. Press Ctrl/Cmd + C to copy.");
      }
      audio.tick(1.3);
    });
    $("#e-card").addEventListener("click", async () => {
      $("#e-card").disabled = true;
      audio.shutter();
      const url = await makeShareCard(pc);
      $("#share-card-wrap").innerHTML = `<img class="share-card" src="${url}" alt="Your Living Broadsheet postcard."><p class="lens-p" style="font-size:13px">Press and hold (or right-click) to save your postcard.</p>`;
      $("#e-card").disabled = false;
    });
    $("#e-read").addEventListener("click", () => { closeLens(); fitPage(); });
    $("#e-again").addEventListener("click", () => location.reload());
  }

  /* ======================================================================
     STAGE ENGINE
     ====================================================================== */
  async function setStage(n) {
    const st = STAGES[n];
    if (!st) return;
    state.stage = n;
    state.maxStage = Math.max(state.maxStage, n);
    $("#stage-title").textContent = st.title;
    drawPills();
    refreshDocks();
    audio.setAmbience(st.amb);
    if (n !== 6 && audio.musicMode === "tension") audio.setMusic("waltz");
    $("#btn-instrument").hidden = !((n === 3 && state.watchFound) || n === 6 || n === 7);
    document.body.classList.toggle("stage-1-live", n === 1 && !state.solved.has(1));
    const firstVisit = !state.notesSeen.has(n);
    if (firstVisit) openNotes(n);
    else if (!$("#notes").hidden) openNotes(n);
    await turnTo(st.page, { focus: "stage" });
    if (state.stage !== n) return;
    placeDocks();
    focusStage();
    const d = DOCKS[n];
    if (d && d.slot && !state.solved.has(n)) {
      d.slot.classList.remove("glow"); void d.slot.offsetWidth; d.slot.classList.add("glow");
    }
    if (n === 3 && !state.solved.has(3)) {
      $$(".watch-spot").forEach((w) => w.classList.add("hint-glint"));
      setTimeout(() => state.stage === 3 && !state.watchFound && toast("Five watches cost a fiver. One asks a pound more. Tap the watch that is worth more than its time.", 5000), 9000);
    }
    if (n === 5 && !state.solved.has(5) && !lampCaught) setTimeout(() => state.stage === 5 && toast("One lamp on the river blinks too evenly for gas. Tap the engraving to catch it.", 4500), 1200);
    if (!state.loupe && n < 7) { $("#btn-loupe").classList.add("beckon"); }
    if (n === 6 && !state.solved.has(6)) setTimeout(openClimax, 1100);
    if (n === 7) openEpilogue();
  }

  const SOLVE_WIRES = {
    1: ["SWEET PEA", [
      "The heavy type spells SWEET PEA.",
      "In Mother's language of flowers, the sweet pea means DEPARTURE. Not a kidnapping, then. The Viscount went of his own free will, in a sailor's boots.",
      "Where there is a flower, there is a florist. Mrs Lefevre's apothecary keeps a sweet pea of her own, on page two."]],
    2: ["SIX TENDRILS", [
      "Six green springs hold the sweet pea to its stake.",
      "A number with no lock is a key with no door. The Agony Column on page three trades in lost things and fine watches. Find the door."]],
    3: ["OPERA · COVENT GARDEN", [
      "The sixth watch kept more than time. Turned back six hours, the engraving reads OPERA COVENT GARDEN.",
      "Page four: tonight's private engagement at the Thameside Opera-House. Watch the grand tier, and mind the gloves."]],
    4: ["THE IMPOSTOR", [
      "Two true ladies, two true signals: RUN. WE ARE WATCHED.",
      "The third fan said nothing in any lady's tongue, and the yellow kid gloves strained over a docker's knuckles. Cutter, in silk.",
      "He will make for the water. Madame Elara's advertisement has whispered it in capitals all along: RIVER. Page five."]],
    5: ["THE STARLING", [
      "The lamp spells S-T-A-R-L-I-N-G. 'The caged starling has taken flight,' the Agony Column said. This Starling is the cage.",
      "Lloyd's List has her: a coal barge moored at Rotherhithe, Berth 4, on the south bank. Go now, before the tide turns."]],
    6: ["THE MARQUESS IS FOUND", [
      "Viscount Tewksbury is free, and still entirely himself.",
      "Squeaky is bound with his own rope; Cutter has met the Thames Police at the stairs.",
      "One last page. A Kodak is waiting to remember this."]],
  };

  async function solve(n) {
    if (state.solved.has(n)) return;
    state.solved.add(n);
    audio.success();
    refreshDocks();
    placeDocks();
    drawPills();
    updateTabs();
    if (n === 1) { stegDraw(); document.body.classList.remove("stage-1-live"); }
    if (n === 3) $$(".watch-spot").forEach((w) => w.classList.remove("hint-glint"));
    const [title, lines] = SOLVE_WIRES[n];
    await telegram(title, lines, [{ label: n === 6 ? "To the last page →" : "Onward →", wax: true }], `FROM L.E. · STAGE ${STAGES[n].roman}`);
    setStage(n + 1);
  }

  // Counsel grows plainer each time it is asked for
  function hintText(n) {
    const p = ARCHETYPES[state.archetype];
    const tier = state.hintTier[n] || 0;
    const txt = tier === 0 ? p.voice + p.clue[n] : HINT_TIERS[n][Math.min(tier - 1, 1)];
    state.hintTier[n] = Math.min(tier + 1, 2);
    state.hints++;
    state.hintUse[n] = true;
    return { txt, tier };
  }
  function hint(n) {
    if (!ARCHETYPES[state.archetype].clue[n]) return;
    const { txt, tier } = hintText(n);
    audio.tick(1.4);
    telegram(["Lady Eudoria's Counsel", "A Plainer Word", "Mother, Exasperated"][tier], [txt], [{ label: "Return to the Gazette" }], `FROM THE MOORS · ${"I".repeat(tier + 1)}`);
  }

  function drawPills() {
    const wrap = $("#stage-pills");
    wrap.innerHTML = STAGES.slice(1).map((s) => {
      const cls = ["pill", s.n === state.stage ? "cur" : "", state.solved.has(s.n) ? "done" : ""].join(" ");
      return `<button class="${cls}" data-stage="${s.n}" ${s.n > state.maxStage ? "disabled" : ""} aria-label="${s.title}">${s.roman}</button>`;
    }).join("");
    $$(".pill", wrap).forEach((b) => b.addEventListener("click", () => setStage(+b.dataset.stage)));
    $("#prev-stage").disabled = state.stage <= 1;
    $("#next-stage").disabled = state.stage >= state.maxStage;
  }

  /* ======================================================================
     TELEGRAPH (diegetic AI)
     ====================================================================== */
  function wireReply(input) {
    const q = input.toLowerCase();
    const p = ARCHETYPES[state.archetype];
    const n = state.stage;
    if (/hint|help|clue|stuck/.test(q) && p.clue[n]) return `STOP. ${hintText(n).txt} STOP.`;
    if (/sweet ?pea|flower|departure|tendril/.test(q)) return "STOP. A sweet pea says goodbye. And a climber says how many hands it holds on with. STOP.";
    if (/watch|time|clock|cipher|wheel|dial/.test(q)) return "STOP. Five keep honest time. Mind the one that charges more for it. STOP.";
    if (/opera|covent|fan|glove|box/.test(q)) return "STOP. My friends speak with fans. An impostor only waves one. Mind the yellow gloves. STOP.";
    if (/barge|rotherhithe|morse|wharf|berth|river|ship|lamp|light/.test(q)) return "STOP. A lamp that blinks too evenly is a lamp that talks. Dit is short, dah is long. STOP.";
    if (/mother|eudoria|where are you/.test(q)) return "STOP. Seek me not in London's cages. I walk free under the moorland sky. Live freely, Enola. STOP.";
    if (/sherlock|mycroft/.test(q)) return "STOP. Thy brothers would send thee to finishing school. Be quicker than they are. STOP.";
    return `STOP. ${p.voice}the moors wire is weak. Return thine eye to the broadsheet ink. STOP.`;
  }
  $("#wire-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("#wire-input");
    const v = inp.value.trim();
    if (!v) return;
    audio.playMorse(".-");
    const tape = $("#wire-tape");
    tape.appendChild(el("p", "wire-msg", "")).textContent = `ENOLA: ${v}`;
    inp.value = "";
    tape.scrollTop = tape.scrollHeight;
    setTimeout(() => {
      tape.appendChild(el("p", "wire-msg her", "")).textContent = `EUDORIA: ${wireReply(v)}`;
      tape.scrollTop = tape.scrollHeight;
      audio.playMorse("-..");
    }, 700);
  });

  /* ======================================================================
     HUD wiring
     ====================================================================== */
  function buildHud() {
    $("#page-tabs").innerHTML = PAGES.map((p) =>
      `<button class="page-tab" data-n="${p.n}" style="background-image:url('${p.thumb}')" aria-label="Page ${p.n}: ${p.name}"><span>${p.n}</span></button>`).join("");
    $$(".page-tab").forEach((t) => t.addEventListener("click", () => turnTo(+t.dataset.n, { focus: "page" })));

    const ib = el("button", "hud-btn", '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M10 2h4"/></svg><span>Instrument</span>');
    ib.id = "btn-instrument";
    ib.hidden = true;
    ib.addEventListener("click", () => {
      if (state.stage === 3) openCipher();
      else if (state.stage === 6 && !state.solved.has(6)) openClimax();
      else if (state.stage === 7) openEpilogue(true);
    });
    $(".hud-right").prepend(ib);

    $("#prev-stage").addEventListener("click", () => state.stage > 1 && setStage(state.stage - 1));
    $("#next-stage").addEventListener("click", () => state.stage < state.maxStage && setStage(state.stage + 1));
    $("#zoom-in").addEventListener("click", () => zoomAt(1.35, innerWidth / 2, innerHeight / 2));
    $("#zoom-out").addEventListener("click", () => zoomAt(1 / 1.35, innerWidth / 2, innerHeight / 2));
    $("#zoom-fit").addEventListener("click", () => fitPage());
    $("#zoom-focus").addEventListener("click", () => focusStage());

    $("#btn-loupe").addEventListener("click", () => setLoupe(!state.loupe));
    $("#btn-notes").addEventListener("click", () => ($("#notes").hidden ? openNotes(state.stage || 1) : closeNotes()));
    $("#btn-wire").addEventListener("click", () => {
      $("#wire-layer").hidden = false;
      setTimeout(() => $("#wire-input").focus(), 50);
    });
    $("#wire-close").addEventListener("click", () => ($("#wire-layer").hidden = true));

    const panel = $("#sound-panel");
    $("#btn-sound").addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      $("#btn-sound").setAttribute("aria-expanded", String(!panel.hidden));
    });
    [["music", "#vol-music"], ["amb", "#vol-amb"], ["sfx", "#vol-sfx"]].forEach(([k, sel]) => {
      const r = $(sel);
      r.value = audio.levels[k];
      r.addEventListener("input", () => audio.setLevel(k, +r.value));
    });
    $("#btn-mute").addEventListener("click", toggleMute);

    $("#btn-help").addEventListener("click", () =>
      telegram("How to read the lens", [
        "Each page of the Gazette hides one link of the chain. Some clues answer a tap in the print itself; others wait for an instrument in a blank column.",
        "Drag to move the paper, scroll or pinch to zoom, double-click to look closer. Press L for the loupe and N for your field notes.",
        "Stuck? Seek counsel. Mother answers in riddles first, and grows plainer the more you ask. Page tabs let you read any page freely.",
      ], [{ label: "Understood" }], "FIELD MANUAL"));

    addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea")) return;
      if (e.key === "Escape") {
        if (!$("#wire-layer").hidden) $("#wire-layer").hidden = true;
        else if (!$("#lens-layer").hidden) closeLens();
        else closeNotes();
        $("#sound-panel").hidden = true;
      }
      if (state.phase !== "investigate" || tgOpen) return;
      if (state.stage === 1 && !state.solved.has(1) && !e.shiftKey && /^[a-z]$/i.test(e.key)) return; // register is typing
      if (e.key === "l" || e.key === "L") setLoupe(!state.loupe);
      if (e.key === "m" || e.key === "M") toggleMute();
      if (e.key === "n") $("#notes").hidden ? openNotes(state.stage) : closeNotes();
      if (e.key === "ArrowRight" && state.page < 6) turnTo(state.page + 1, { focus: "page" });
      if (e.key === "ArrowLeft" && state.page > 1) turnTo(state.page - 1, { focus: "page" });
      // presenter shortcut: Shift+N solves the current stage
      if (e.key === "N" && e.shiftKey && state.stage < 7) {
        if (!$("#lens-layer").hidden) closeLens();
        solve(state.stage);
      }
    });
  }

  function toggleMute() {
    state.muted = !state.muted;
    audio.setMuted(state.muted);
    document.body.classList.toggle("muted", state.muted);
    $("#btn-mute").textContent = state.muted ? "Unmute" : "Mute all";
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  function preload() {
    return Promise.all(PAGES.map((p) => new Promise((res) => {
      const im = new Image();
      im.onload = () => { state.pageH[p.n] = Math.round((PAGE_W * im.naturalHeight) / im.naturalWidth); res(); };
      im.onerror = () => { state.pageH[p.n] = 1414; res(); };
      im.src = p.src;
    })));
  }

  async function boot() {
    new GaslampFog($("#gaslamp-canvas"));
    buildHud();
    buildDocks();
    await preload();
    prepareFold();
    renderPage(1);
    $("#wax-seal").focus({ preventScroll: true });
  }
  boot();
})();
