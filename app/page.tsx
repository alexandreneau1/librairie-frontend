'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '../components/Header'
import { ajouterAuPanier, estDansPanier, getPanier } from '../lib/panier'

const C = {
  vert: '#1A3C2E', or: '#D4AF37', orIntense: '#B8960C',
  fond: '#F9F6F0', fondAlt: '#EAF2EC', texte: '#1C1C1C',
  texteSecondaire: '#6B6B5E', footer: '#0f2419',
}
const FONT = "'EB Garamond', Georgia, serif"
const GENRES = [
  'Roman', 'Policier', 'Thriller', 'Science-fiction', 'Fantasy',
  'Histoire', 'Biographie', 'Essai', 'Philosophie', 'Jeunesse',
  'Bande dessinée', 'Poésie', 'Romance', 'Développement personnel',
]

// ── Types wizard ──────────────────────────────────────────────────────────────
type ProfileType = 'grand' | 'occasionnel' | 'reprend' | 'cible'
type ProfileLabels = { grand?: string; occasionnel?: string; reprend?: string; cible?: string; default: string }
type ProfileNotes  = { grand?: string; occasionnel?: string; reprend?: string; default?: string }

type WizardResult = { emoji: string; genres: string[]; labels: ProfileLabels; notes?: ProfileNotes }
type WizardOptionNext   = { label: string; next: string; setProfile?: ProfileType; setCtx?: Record<string, string> }
type WizardOptionResult = { label: string; result: WizardResult }
type WizardOption = WizardOptionNext | WizardOptionResult

function isResult(opt: WizardOption): opt is WizardOptionResult { return 'result' in opt }
type WizardNode = { question: string; icone: string; options: WizardOption[] }

// Helper résultat
const R = (
  emoji: string, genres: string[], def: string,
  grand?: string, occasionnel?: string, reprend?: string,
  notes?: ProfileNotes
): WizardResult => ({ emoji, genres, labels: { default: def, grand, occasionnel, reprend }, notes })

// ── Arbre décisionnel — 44 nœuds ──────────────────────────────────────────────
const WIZARD: Record<string, WizardNode> = {

  // ── Racine ─────────────────────────────────────────────────────────────────
  start: {
    question: 'Pour qui cherchez-vous un livre ?',
    icone: '👤',
    options: [
      { label: 'Pour moi', next: 'a_profil' },
      { label: 'Pour offrir', next: 'b_age' },
    ],
  },

  // ── Profil lecteur ─────────────────────────────────────────────────────────
  a_profil: {
    question: 'Quel lecteur êtes-vous ?',
    icone: '📚',
    options: [
      { label: '📚 Grand lecteur — je lis régulièrement, je cherche des œuvres exigeantes', next: 'a_envie', setProfile: 'grand' },
      { label: '📖 Lecteur occasionnel — quelques livres par an, il faut que ça accroche vite', next: 'a_envie', setProfile: 'occasionnel' },
      { label: '🌱 Je reprends la lecture — je n\'ai pas lu depuis longtemps', next: 'a_envie', setProfile: 'reprend' },
      { label: '🎯 Lecteur ciblé — je lis beaucoup mais toujours dans le même genre', next: 'a_envie', setProfile: 'cible' },
    ],
  },

  // ── Envie du moment ────────────────────────────────────────────────────────
  a_envie: {
    question: "En ce moment, vous avez envie de...",
    icone: '💭',
    options: [
      { label: "M'évader, voyager ailleurs", next: 'a_evasion' },
      { label: 'Comprendre le monde', next: 'a_comprendre' },
      { label: 'Ressentir des émotions fortes', next: 'a_emotions' },
      { label: 'Me détendre, décompresser', next: 'a_detente' },
      { label: 'Relire un grand classique', next: 'a_classique' },
      { label: 'Être bousculé, surpris', next: 'a_surprise' },
    ],
  },

  // ── M'ÉVADER ───────────────────────────────────────────────────────────────
  a_evasion: {
    question: "Quel type d'ailleurs vous attire ?",
    icone: '🌍',
    options: [
      { label: 'Un monde imaginaire, de la magie', next: 'a_fantasy_ambiance' },
      { label: 'Le futur, la technologie, l\'espace', next: 'a_sf_theme' },
      { label: 'Une époque historique lointaine', next: 'a_histoire_type' },
      { label: 'Un pays étranger, une culture différente', result: R('🌐', ['Roman', 'Biographie'], 'Roman du monde & Biographie', 'Littérature mondiale — Murakami, Marquez, Achebe, Pamuk', 'Roman dépaysant accessible — voyage garanti dès les premières pages', 'Roman étranger court — une culture différente, un texte abordable') },
      { label: 'La nature, le sauvage', result: R('🌿', ['Roman', 'Essai'], 'Roman & Essai nature', 'Nature writing exigeant — Thoreau, London, Tesson, Mathieu', 'Roman d\'aventure nature accessible — fort et dépaysant', 'Roman nature court et sensoriel — immersion garantie') },
    ],
  },

  // Fantasy
  a_fantasy_ambiance: {
    question: 'Quelle ambiance de fantasy ?',
    icone: '🧙',
    options: [
      { label: 'Épopée, héros, quêtes, batailles', next: 'a_fantasy_heros', setCtx: { fantasyType: 'epopee' } },
      { label: 'Magie subtile, monde proche du nôtre', next: 'a_fantasy_saga', setCtx: { fantasyType: 'magie' } },
      { label: 'Sombre, moralement complexe, violent', next: 'a_fantasy_heros', setCtx: { fantasyType: 'sombre' } },
      { label: 'Poétique, onirique, littéraire', next: 'a_fantasy_saga', setCtx: { fantasyType: 'poetique' } },
    ],
  },

  a_fantasy_heros: {
    question: 'Votre rapport aux personnages ?',
    icone: '⚔️',
    options: [
      { label: 'Un héros central, un destin individuel', next: 'a_fantasy_saga', setCtx: { fantasyPov: 'heros' } },
      { label: 'Un groupe, des alliances, des trahisons', next: 'a_fantasy_saga', setCtx: { fantasyPov: 'groupe' } },
      { label: 'Peu importe', next: 'a_fantasy_saga' },
    ],
  },

  a_fantasy_saga: {
    question: 'Êtes-vous prêt à vous lancer dans une saga ?',
    icone: '📖',
    options: [
      { label: 'Oui, j\'adore enchaîner les tomes', result: R('📚', ['Fantasy'], 'Fantasy — saga recommandée', 'Fantasy épique en cycle — Sanderson, Martin, Erikson, Abercrombie — des mondes vertigineux', 'Fantasy en trilogie accessible — La Passe-miroir, His Dark Materials, Eragon', 'Fantasy d\'initiation — trilogie courte, immersive, facile d\'entrée', undefined, { grand: 'Comptez plusieurs mois de lecture — et c\'est tant mieux.', occasionnel: 'Commencez par le tome 1 — si vous accrochez, la suite vous emportera.', reprend: 'Prenez votre temps, aucune obligation de tout lire d\'une traite.' }) },
      { label: 'Non, un roman complet en un volume', result: R('✨', ['Fantasy'], 'Fantasy standalone', 'Fantasy littéraire standalone — Le Nom du Vent, Jonathan Strange, La Horde du Contrevent', 'Fantasy accessible en un tome — dépaysement immédiat, sans engagement', 'Fantasy courte et bienveillante — magie subtile, texte fluide') },
      { label: 'Peu importe', result: R('🧙', ['Fantasy'], 'Fantasy', 'Fantasy — œuvres majeures du genre selon vos goûts', 'Fantasy accessible — notre libraire vous guidera sur le bon point d\'entrée', 'Fantasy légère — un monde imaginaire sans prise de tête') },
    ],
  },

  // SF
  a_sf_theme: {
    question: 'Quelle thématique de SF ?',
    icone: '🚀',
    options: [
      { label: 'IA, transhumanisme, technologie', next: 'a_sf_science', setCtx: { sfTheme: 'ia' } },
      { label: 'Société dystopique, politique', next: 'a_sf_science', setCtx: { sfTheme: 'dystopie' } },
      { label: 'Espace, exploration, civilisations aliens', next: 'a_sf_science', setCtx: { sfTheme: 'espace' } },
      { label: 'Proche futur, réaliste', next: 'a_sf_science', setCtx: { sfTheme: 'proche' } },
    ],
  },

  a_sf_science: {
    question: 'Votre rapport à la science dans un roman ?',
    icone: '🔬',
    options: [
      { label: 'J\'aime les détails techniques, la hard science', next: 'a_sf_saga', setCtx: { sfStyle: 'hard' } },
      { label: 'Je veux que ce soit accessible, l\'histoire prime', next: 'a_sf_saga', setCtx: { sfStyle: 'accessible' } },
      { label: 'Peu importe', next: 'a_sf_saga' },
    ],
  },

  a_sf_saga: {
    question: 'Êtes-vous prêt à vous lancer dans une saga ?',
    icone: '🌌',
    options: [
      { label: 'Oui, j\'adore enchaîner les tomes', result: R('🌌', ['Science-fiction'], 'SF — cycle recommandé', 'SF monumentale — Dune, Fondation, Le Cycle de la Culture, Hypérion — des univers complets', 'SF accessible en série — Le Problème à 3 corps, Old Man\'s War — accrocheur dès le T1', 'SF grand public en série courte — immédiat, prenant, pas trop technique', undefined, { grand: 'Dune reste la référence absolue — commencez par le T1.', occasionnel: 'Le Problème à 3 corps est un excellent point d\'entrée.', reprend: 'Commencez par Ender\'s Game — court, efficace, culte.' }) },
      { label: 'Non, un roman complet en un volume', result: R('⚡', ['Science-fiction'], 'SF standalone', 'SF standalone exigeante — 1984, Solaris, Fahrenheit 451, La Servante écarlate', 'SF standalone accessible — L\'Homme des jeux, Ready Player One', 'SF courte et percutante — une idée forte, un texte fluide') },
      { label: 'Peu importe', result: R('🚀', ['Science-fiction'], 'Science-fiction', 'SF — selon vos goûts, grand ou petit format', 'SF accessible — notre libraire vous oriente', 'SF légère — une idée, un voyage, une lecture agréable') },
    ],
  },

  // Histoire
  a_histoire_type: {
    question: 'Vous cherchez plutôt ?',
    icone: '🏰',
    options: [
      { label: 'Un roman historique — personnages fictifs dans une époque réelle', next: 'a_histoire_epoque', setCtx: { histType: 'roman' } },
      { label: 'Un récit historique — faits réels, personnes réelles', next: 'a_histoire_epoque', setCtx: { histType: 'recit' } },
      { label: 'Les deux, peu importe', next: 'a_histoire_epoque', setCtx: { histType: 'mixte' } },
    ],
  },

  a_histoire_epoque: {
    question: 'Quelle époque vous attire ?',
    icone: '⏳',
    options: [
      { label: 'Antiquité / Moyen Âge', result: R('🏛️', ['Histoire', 'Roman'], 'Roman historique ancien', 'Histoire ancienne — Yourcenar, Colleen McCullough, Ken Follett — rigueur et souffle épique', 'Roman historique accessible — Ken Follett, Pillars of the Earth — immersif et solide', 'Roman historique d\'initiation — fort en couleurs, facile à suivre') },
      { label: 'XVIIe–XIXe siècle', result: R('🕯️', ['Histoire', 'Roman'], 'Roman historique classique', 'Siècle des Lumières et XIXe — Dumas, Hugo, Zweig, Hilary Mantel — écriture et Histoire', 'Roman XIXe accessible — Dumas, Les Misérables abrégés, romans victoriens', 'Roman XIXe court et vivant — chapitres courts, récit entraînant') },
      { label: 'XXe siècle, guerres mondiales', result: R('📜', ['Histoire', 'Roman'], 'Roman historique moderne', 'XXe siècle littéraire — Remarque, Perec, Modiano, Suite française — mémoire et style', 'Guerre et XXe accessible — All Quiet on the Western Front, Le Liseur', 'Roman de guerre court et fort — Remarque, Barbusse — percutant') },
      { label: 'Toutes époques confondues', result: R('🗺️', ['Histoire'], 'Histoire narrative', 'Histoire narrative — Herodote, Michelet, Yuval Noah Harari — récits de civilisations', 'Histoire accessible — Sapiens, une grande histoire courte — passionnant', 'Histoire grand public — Sapiens, facile et fascinant') },
    ],
  },

  // ── COMPRENDRE ─────────────────────────────────────────────────────────────
  a_comprendre: {
    question: 'Quel domaine vous attire ?',
    icone: '🔍',
    options: [
      { label: 'Histoire des peuples et civilisations', next: 'a_comprendre_histoire' },
      { label: "Politique, société aujourd'hui", result: R('📰', ['Essai'], 'Essai de société', 'Essai politique de fond — Piketty, Arendt, Foucault, Chomsky — exigeant et nécessaire', 'Essai de société accessible — Yuval Noah Harari, Klein — clair et percutant', 'Essai court et clair — facile à lire, important à connaître') },
      { label: "Les grandes questions de l'existence", next: 'a_comprendre_philo' },
      { label: 'La psychologie humaine', result: R('🧠', ['Essai', 'Développement personnel'], 'Psychologie & développement', 'Psychologie profonde — Jung, Frankl, Cialdini — fondements et théorie', 'Psychologie accessible — Thinking Fast and Slow, Le Pouvoir du moment présent', 'Développement personnel bienveillant — court, pratique, applicable') },
      { label: 'La science et le monde naturel', result: R('🔬', ['Essai'], 'Essai scientifique', 'Science de haut vol — Dawkins, Feynman, Sagan — rigueur et émerveillement', 'Science vulgarisée — Axolotl, Cosmos, Yuval Noah Harari version science', 'Science grand public — court, clair, fascinant') },
      { label: 'Une grande figure, un destin', next: 'a_comprendre_bio' },
    ],
  },

  a_comprendre_histoire: {
    question: 'Quelle approche historique vous attire ?',
    icone: '🏛️',
    options: [
      { label: 'Un récit factuel, rigoureux, sourcé', result: R('📐', ['Histoire'], 'Histoire rigoureuse', 'Histoire universitaire — Bloch, Braudel, Duby — dense, sourcé, indispensable', 'Histoire rigoureuse accessible — Sapiens, des auteurs clairs', 'Histoire courte et solide — un seul événement, bien raconté') },
      { label: 'Une narration vivante, presque romanesque', result: R('🎭', ['Histoire', 'Roman'], 'Histoire narrative', 'Histoire narrative — Zweig, Michelet, Barbara Tuchman — le meilleur des deux mondes', 'Histoire racontée comme un roman — entraînant, passionnant', 'Histoire narrative courte — fort, vivant, accessible') },
      { label: 'Peu importe', result: R('🗺️', ['Histoire'], 'Histoire', 'Histoire — grands auteurs selon votre sujet de prédilection', 'Histoire accessible — notre libraire vous guide', 'Histoire grand public — Sapiens reste une valeur sûre') },
    ],
  },

  a_comprendre_philo: {
    question: 'Votre rapport à la philosophie ?',
    icone: '🤔',
    options: [
      { label: 'Textes de référence, académique', result: R('📐', ['Philosophie'], 'Philosophie classique', 'Philosophie fondamentale — Platon, Kant, Nietzsche, Heidegger — lecture exigeante et décisive', 'Philosophie vulgarisée — Comte-Sponville, Ferry, Onfray — accès aux grandes idées', 'Philosophie pour débutants — Jostein Gaarder, Le Monde de Sophie — parfait pour commencer') },
      { label: 'Accessible, vulgarisée', result: R('💡', ['Essai', 'Philosophie'], 'Essai philosophique', 'Philosophie contemporaine — André Comte-Sponville, Martha Nussbaum — profond et lisible', 'Essai philosophique accessible — des grandes idées en langage clair', 'Initiation à la philo — Le Monde de Sophie, bref et révélateur') },
      { label: 'Appliquée à ma vie quotidienne', result: R('🌱', ['Développement personnel'], 'Développement personnel', 'Développement personnel exigeant — Stoïciens, Sénèque, Frankl — sagesse ancienne et profonde', 'Développement pratique — The Subtle Art, Atomic Habits — concret et efficace', 'Développement bienveillant — court, positif, applicable dès demain') },
    ],
  },

  a_comprendre_bio: {
    question: 'Quel type de figure vous fascine ?',
    icone: '🏆',
    options: [
      { label: 'Artiste, écrivain, musicien', result: R('🎨', ['Biographie'], 'Biographie d\'artiste', 'Biographie littéraire — Zweig (Balzac, Tolstoï), Modiano, Edmund White — style et destin', 'Biographie d\'artiste accessible — Steve Jobs (Isaacson), Frida Kahlo', 'Biographie courte d\'artiste — simple, inspirante, belle') },
      { label: 'Homme ou femme politique, chef d\'État', result: R('🏛️', ['Biographie'], 'Biographie politique', 'Biographie politique de fond — Churchill, De Gaulle, Lincoln — politique et Histoire', 'Biographie politique accessible — Obama, Mandela — récit et humanité', 'Biographie politique courte — un destin, un moment clé') },
      { label: 'Explorateur, scientifique, aventurier', result: R('🧭', ['Biographie'], 'Biographie d\'explorateur', 'Biographie de découvreur — Shackleton, Marie Curie, Einstein — destins exceptionnels', 'Biographie d\'aventurier accessible — Into the Wild, Touching the Void', 'Biographie d\'explorateur courte — aventure et courage') },
      { label: 'Figure contemporaine, de notre époque', result: R('⚡', ['Biographie'], 'Biographie contemporaine', 'Biographie contemporaine — Elon Musk, Steve Jobs, Michelle Obama — notre monde raconté', 'Biographie contemporaine accessible — inspirant et actuel', 'Biographie contemporaine courte — simple et motivante') },
    ],
  },

  // ── ÉMOTIONS ───────────────────────────────────────────────────────────────
  a_emotions: {
    question: 'Quelles émotions cherchez-vous ?',
    icone: '❤️',
    options: [
      { label: 'Être profondément touché, pleurer', next: 'a_emotions_touche' },
      { label: 'Avoir peur, frissonner', next: 'a_emotions_peur' },
      { label: "M'émerveiller, être fasciné", next: 'a_emotions_emerveille' },
      { label: 'Être en colère, révolté', next: 'a_emotions_revolte' },
      { label: "Rire, m'amuser", next: 'a_emotions_rire' },
    ],
  },

  a_emotions_touche: {
    question: 'Quel contexte vous touche le plus ?',
    icone: '💔',
    options: [
      { label: "Une histoire d'amour", next: 'a_emotions_fin', setCtx: { toucheCtx: 'amour' } },
      { label: 'Une famille, des liens humains', next: 'a_emotions_fin', setCtx: { toucheCtx: 'famille' } },
      { label: 'Un deuil, une perte', next: 'a_emotions_fin', setCtx: { toucheCtx: 'deuil' } },
      { label: 'Un personnage qui surmonte tout', next: 'a_emotions_fin', setCtx: { toucheCtx: 'surmonte' } },
    ],
  },

  a_emotions_fin: {
    question: 'Vous préférez une fin...',
    icone: '🎬',
    options: [
      { label: 'Ouverte, ambiguë', result: R('🌫️', ['Roman'], 'Roman littéraire', 'Roman contemporain exigeant — Knausgård, Modiano, Annie Ernaux — fin ouverte, écriture forte', 'Roman contemporain accessible — Jojo Moyes, David Nicholls — émotion et fin ouverte', 'Roman court et émouvant — fin ouverte, texte fluide') },
      { label: 'Heureuse, apaisante', result: R('☀️', ['Roman', 'Romance'], 'Roman feel-good', 'Roman humaniste — Fred Vargas, Muriel Barbery, Agnès Martin-Lugand — chaleur et profondeur', 'Roman feel-good — L\'Élégance du hérisson, La Délicatesse — léger et beau', 'Roman feel-good court — doux, bienveillant, qui fait du bien') },
      { label: 'Peu importe', result: R('💕', ['Roman', 'Romance'], 'Roman émotionnel', 'Roman émotionnel de qualité — prix Goncourt, Rentrée littéraire — émotion et style', 'Roman sentimental accessible — émouvant et prenant', 'Roman court et touchant — quelques soirées, beaucoup d\'émotions') },
    ],
  },

  a_emotions_peur: {
    question: 'Quel type de tension ?',
    icone: '😱',
    options: [
      { label: 'Psychologique, lente, oppressante', next: 'a_emotions_peur_serie', setCtx: { peurType: 'psychologique' } },
      { label: 'Un tueur, une enquête, un enquêteur récurrent', next: 'a_emotions_peur_serie', setCtx: { peurType: 'enquete' } },
      { label: 'Surnaturel, fantômes, horreur', next: 'a_emotions_peur_serie', setCtx: { peurType: 'surnaturel' } },
      { label: 'Géopolitique, espionnage, complot', next: 'a_emotions_peur_serie', setCtx: { peurType: 'geopolitique' } },
    ],
  },

  a_emotions_peur_serie: {
    question: 'Êtes-vous prêt pour une série à enchaîner ?',
    icone: '🔎',
    options: [
      { label: 'Oui, j\'aime retrouver le même enquêteur', result: R('🔎', ['Policier', 'Thriller'], 'Série policière', 'Série policière exigeante — Rebus (Rankin), Erlendur (Indridason), Adamsberg (Vargas) — atmosphère et style', 'Série policière accessible — Maigret, Hercule Poirot — facile à enchaîner', 'Série policière légère — Agatha Christie, chapitres courts, très accessible', undefined, { grand: 'Commencez par le T1 — chaque tome peut se lire indépendamment.', occasionnel: 'Maigret ou Poirot — parfaits pour entrer dans le genre.', reprend: 'Agatha Christie reste imbattable pour retrouver le plaisir de lire.' }) },
      { label: 'Non, je préfère un roman standalone', result: R('🕵️', ['Policier', 'Thriller'], 'Thriller / Policier standalone', 'Polar standalone exigeant — Highsmith, Ellroy, Manchette — tension et écriture', 'Thriller standalone accessible — Gillian Flynn, Harlan Coben — haletant du début à la fin', 'Thriller court et prenant — 250 pages max, impossible à lâcher') },
      { label: 'Peu importe', result: R('🔮', ['Policier', 'Thriller'], 'Polar & Thriller', 'Polar et thriller — le meilleur du genre selon votre goût', 'Thriller accessible — notre libraire vous guide', 'Polar ou thriller — court, efficace, notre sélection du moment') },
    ],
  },

  a_emotions_emerveille: {
    question: 'Plutôt SF ou Fantasy ?',
    icone: '🌟',
    options: [
      { label: 'SF — futur, technologie, espace', next: 'a_sf_theme' },
      { label: 'Fantasy — magie, mondes imaginaires', next: 'a_fantasy_ambiance' },
      { label: 'Les deux, peu importe', result: R('✨', ['Science-fiction', 'Fantasy'], 'SF & Fantasy', 'SF et Fantasy littéraires — les œuvres majeures des deux genres', 'SF ou Fantasy accessible — notre libraire choisit selon votre humeur', 'SF ou Fantasy légère — émerveillement garanti, entrée en douceur') },
    ],
  },

  a_emotions_revolte: {
    question: 'Quelle forme de révolte ?',
    icone: '✊',
    options: [
      { label: 'Injustice sociale, inégalités', result: R('⚡', ['Essai', 'Roman'], 'Roman & Essai engagé', 'Roman social exigeant — Zola, Steinbeck, Eribon, Ernaux — lutte et écriture', 'Roman social accessible — Les Raisins de la colère, La Honte — percutant', 'Roman social court — quelques soirées pour se révolter') },
      { label: 'Politique, pouvoir, corruption', result: R('🏛️', ['Essai', 'Roman'], 'Roman & Essai politique', 'Roman politique — 1984, Le Zéro et l\'Infini, Camus — dépasser le présent', 'Essai politique accessible — clairement écrit, nécessaire aujourd\'hui', 'Roman politique court et fort — 1984 reste le plus court et le plus puissant') },
      { label: 'Environnement, nature menacée', result: R('🌱', ['Essai', 'Roman'], 'Essai & Roman écologie', 'Écologie littéraire — Thoreau, Tesson, Wohlleben, Descola — nature et pensée', 'Essai écologie accessible — La Vie secrète des arbres, readable et révélateur', 'Essai nature court — La Vie secrète des arbres : quelques heures, une révélation') },
      { label: 'Questions de genre, d\'identité', result: R('🌈', ['Essai', 'Roman'], 'Roman & Essai identité', 'Littérature identité — James Baldwin, Toni Morrison, Virginie Despentes — voix essentielles', 'Roman identité accessible — Simone de Beauvoir vulgarisé, romans contemporains', 'Roman identité court — percutant, nécessaire, accessible') },
    ],
  },

  a_emotions_rire: {
    question: 'Quel type d\'humour ?',
    icone: '😄',
    options: [
      { label: 'Absurde, décalé, surréaliste', result: R('🎭', ['Roman'], 'Roman absurde', 'Absurde littéraire — Kafka, Ionesco, Boris Vian, Terry Pratchett — humour et profondeur', 'Absurde accessible — Le Guide du voyageur galactique, L\'Écume des jours', 'Absurde léger — drôle, court, facile à lire') },
      { label: 'Satirique, grinçant, critique', result: R('🗡️', ['Roman', 'Essai'], 'Satire', 'Satire littéraire — Swift, Voltaire, Mencken, Jarry — intelligence et humour noir', 'Satire accessible — Candide (très court), Animal Farm — efficace et drôle', 'Satire courte — Candide : 100 pages, brillant, parfait pour reprendre') },
      { label: 'Léger, feel-good, bienveillant', result: R('☀️', ['Roman'], 'Roman léger', 'Roman léger de qualité — E.F. Benson, Wodehouse, Muriel Spark — élégance et humour', 'Roman feel-good — La Délicatesse, L\'Élégance du hérisson — sourires garantis', 'Roman feel-good court — léger, bienveillant, parfait pour reprendre') },
      { label: 'Humour noir, cynique', result: R('🖤', ['Roman'], 'Humour noir', 'Humour noir littéraire — Bukowski, Cioran, Bierce, Dahl — mordant et exigeant', 'Humour noir accessible — Roald Dahl adulte, nouvelles de Carver', 'Humour noir court — Roald Dahl, nouvelles courtes : idéal pour reprendre') },
    ],
  },

  // ── DÉTENTE ────────────────────────────────────────────────────────────────
  a_detente: {
    question: 'Comment vous détendez-vous ?',
    icone: '😌',
    options: [
      { label: "Un roman qu'on lit en une soirée", next: 'a_detente_genre' },
      { label: 'Des images, peu de texte', result: R('🎨', ['Bande dessinée'], 'Bande dessinée & Manga', 'BD et manga exigeants — Mœbius, Alan Moore, Miyazaki, Naoki Urasawa — art graphique pur', 'BD accessible — Tintin, Astérix, One Piece — plaisir immédiat', 'BD ou manga court — quelques pages, beaucoup de plaisir') },
      { label: 'Des mots qui font du bien', result: R('🌸', ['Poésie'], 'Poésie', 'Poésie exigeante — Rimbaud, Rilke, Celan, Jaccottet — langue et vertige', 'Poésie accessible — Prévert, Apollinaire, Rumi — mots doux et beaux', 'Poésie courte — Prévert : quelques pages le soir, idéal pour reprendre') },
      { label: 'Une saga à enchaîner', next: 'a_detente_saga_univers' },
    ],
  },

  a_detente_genre: {
    question: 'Quel genre pour une lecture rapide ?',
    icone: '⚡',
    options: [
      { label: 'Drôle et léger', next: 'a_detente_duree', setCtx: { detGenre: 'drole' } },
      { label: 'Romantique', next: 'a_detente_duree', setCtx: { detGenre: 'romantique' } },
      { label: 'Haletant', next: 'a_detente_duree', setCtx: { detGenre: 'haletant' } },
      { label: 'Beau, bien écrit', next: 'a_detente_duree', setCtx: { detGenre: 'litteraire' } },
    ],
  },

  a_detente_duree: {
    question: 'Vous avez plutôt...',
    icone: '⏱',
    options: [
      { label: 'Une soirée (moins de 200 pages)', result: R('⚡', ['Roman'], 'Roman court', 'Roman court exigeant — L\'Étranger, Le Vieux et la Mer, Candide — dense et bref', 'Roman court accessible — La Délicatesse, The Perks of Being a Wallflower', 'Roman très court — L\'Étranger : 150 pages, idéal pour renouer avec la lecture') },
      { label: 'Un week-end (200–350 pages)', result: R('📖', ['Roman'], 'Roman de week-end', 'Roman de week-end — Belle du Seigneur, To Kill a Mockingbird — engagement et récompense', 'Roman 300 pages accessible — Nicholas Sparks, Jojo Moyes — parfait pour un week-end', 'Roman 250 pages — fluide, prenant, qu\'on finit sans s\'en rendre compte') },
      { label: 'Peu importe', result: R('📚', ['Roman'], 'Roman selon votre genre', 'Roman au choix — notre libraire vous sélectionne selon vos goûts', 'Roman accessible — notre sélection du moment', 'Roman feel-good — notre recommandation pour reprendre plaisir à lire') },
    ],
  },

  a_detente_saga_univers: {
    question: 'Quel univers pour une longue saga ?',
    icone: '🗺️',
    options: [
      { label: 'Fantasy — mondes imaginaires', next: 'a_fantasy_ambiance' },
      { label: 'SF — futur et espace', next: 'a_sf_theme' },
      { label: 'Policier — enquêteur récurrent', next: 'a_emotions_peur' },
      { label: 'Saga littéraire ou familiale', next: 'a_detente_saga_tomes' },
    ],
  },

  a_detente_saga_tomes: {
    question: 'Combien de tomes vous attirent ?',
    icone: '📚',
    options: [
      { label: 'Une trilogie, pas plus', result: R('📗', ['Roman'], 'Trilogie littéraire', 'Trilogie exigeante — À la recherche du temps perdu (3 vol.), Stieg Larsson, Philip Pullman', 'Trilogie accessible — La Passe-miroir, Millennium, His Dark Materials', 'Trilogie douce — La Passe-miroir T1 : accessible, prenant, bienveillant', undefined, { reprend: 'Commencez par le T1 — si vous accrochez, la suite sera naturelle.' }) },
      { label: '5 tomes et plus, je m\'engage pleinement', result: R('📚', ['Roman'], 'Grande saga', 'Grande saga littéraire — Zola (20 tomes), Proust, Balzac — une vie de lecture', 'Grande saga populaire — Harry Potter adulte, Game of Thrones — long mais passionnant', 'Grande saga accessible — Harry Potter reste le meilleur point d\'entrée pour reprendre', undefined, { grand: 'Bienvenue dans le grand jeu — prenez Zola ou Balzac.', occasionnel: 'Game of Thrones T1 : 900 pages d\'un souffle.', reprend: 'Harry Potter adulte — vous le connaissez peut-être déjà, relisez-le autrement.' }) },
      { label: 'Peu importe', result: R('📖', ['Roman'], 'Saga — selon votre rythme', 'Saga au choix — notre libraire vous guide selon votre engagement', 'Saga accessible — commençons par un T1 et on verra', 'Saga courte — on commence doucement, un tome à la fois') },
    ],
  },

  // ── CLASSIQUE ──────────────────────────────────────────────────────────────
  a_classique: {
    question: 'Quel type de classique ?',
    icone: '📜',
    options: [
      { label: 'XIXe siècle — Balzac, Flaubert, Tolstoï, Dickens', next: 'a_classique_longueur', setCtx: { classiqueEpoque: 'xixe' } },
      { label: 'XXe siècle — Camus, Sartre, Woolf, Kafka', next: 'a_classique_longueur', setCtx: { classiqueEpoque: 'xxe' } },
      { label: 'Classique étranger — littérature mondiale', next: 'a_classique_longueur', setCtx: { classiqueEpoque: 'monde' } },
      { label: 'Je ne sais pas lequel — guidez-moi', next: 'a_classique_orientation' },
    ],
  },

  a_classique_longueur: {
    question: 'Vous cherchez...',
    icone: '⚖️',
    options: [
      { label: 'Un roman court pour commencer', result: R('🕯️', ['Roman'], 'Classique court', 'Classique court exigeant — L\'Étranger, Candide, Le Procès, Mrs Dalloway — dense et bref', 'Classique court accessible — L\'Étranger (150p), De Profundis, Boule de suif', 'Classique très court — L\'Étranger : idéal pour reprendre, 150 pages inoubliables') },
      { label: 'Une grande fresque, un chef-d\'œuvre long', result: R('📖', ['Roman'], 'Grand classique', 'Grand classique — Guerre et Paix, À la recherche du temps perdu, Les Misérables — sommet de la littérature', 'Grand classique accessible — Les Misérables abrégés, David Copperfield — longs mais captivants', 'Grand classique en version abrégée — accessible et respectueux du texte') },
      { label: 'Peu importe', result: R('✒️', ['Roman'], 'Classique — notre sélection', 'Classique selon vos goûts — notre libraire vous guide dans 3000 ans de littérature', 'Classique accessible — on commence par quelque chose de court et fort', 'Classique court — L\'Étranger ou Candide : parfait pour revenir à la littérature') },
    ],
  },

  a_classique_orientation: {
    question: 'Ce qui vous attire dans un classique ?',
    icone: '🎯',
    options: [
      { label: 'La langue, le style, la beauté de l\'écriture', result: R('✒️', ['Roman'], 'Classique — style', 'Classique stylistique — Proust, Chateaubriand, Flaubert — la phrase comme architecture', 'Classique beau et accessible — Flaubert, Maupassant — belle langue, texte fluide', 'Classique court et beau — Maupassant nouvelles : parfait pour commencer') },
      { label: "L'histoire, l'intrigue, les personnages", result: R('🎭', ['Roman'], 'Classique — intrigue', 'Classique narratif — Dumas, Dickens, Dostoïevski — personnages inoubliables', 'Classique prenant — Dumas, Stevenson — aventure et rebondissements', 'Classique prenant court — Le Comte de Monte-Cristo version abrégée : haletant') },
      { label: 'La portée philosophique, les idées', result: R('💡', ['Roman', 'Philosophie'], 'Classique — idées', 'Classique philosophique — Voltaire, Rousseau, Camus, Dostoïevski — idées et littérature', 'Classique d\'idées accessible — Candide, L\'Étranger — courts et percutants', 'Classique d\'idées très court — Candide : 100 pages brillantes') },
      { label: 'Le dépaysement d\'une autre époque', result: R('🕰️', ['Roman'], 'Classique — dépaysement', 'Classique historique — Balzac, Hugo, Tolstoï — une époque entière dans un roman', 'Classique dépaysant accessible — Les Misérables abrégés, Autant en emporte le vent', 'Classique court et dépaysant — Contes de Maupassant : XIXe siècle en quelques pages') },
    ],
  },

  // ── SURPRISE ───────────────────────────────────────────────────────────────
  a_surprise: {
    question: 'Ce qui vous surprend, comment ?',
    icone: '✨',
    options: [
      { label: 'Une narration originale, expérimentale', next: 'a_surprise_narration' },
      { label: 'Un auteur peu connu, pointu', next: 'a_surprise_origine' },
      { label: 'Un sujet hors de ma zone de confort', next: 'a_surprise_defi' },
      { label: 'Un genre que je n\'ai jamais lu', next: 'a_envie' },
    ],
  },

  a_surprise_narration: {
    question: 'Quelle forme vous intrigue ?',
    icone: '🎭',
    options: [
      { label: 'Narration non-linéaire, puzzle temporel', result: R('🧩', ['Roman'], 'Roman non-linéaire', 'Non-linéaire exigeant — Faulkner, Pynchon, David Mitchell — lecture active et récompense', 'Non-linéaire accessible — Cloud Atlas, La Vérité sur l\'affaire Harry Quebert', 'Non-linéaire doux — La Vérité sur l\'affaire Harry Quebert : facile et prenant') },
      { label: 'Plusieurs voix, plusieurs points de vue', result: R('🎤', ['Roman'], 'Roman polyphonique', 'Polyphonique exigeant — Faulkner, Dos Passos, Tolstoï — voix multiples et complexité', 'Polyphonique accessible — Gone Girl, Le Cercle des menteurs — addictif', 'Polyphonique court — Gone Girl : quelques jours, impossible à lâcher') },
      { label: 'Roman épistolaire, journal intime', result: R('✉️', ['Roman'], 'Roman épistolaire', 'Épistolaire littéraire — Les Liaisons dangereuses, Clarissa, Dracula — genre fondateur', 'Épistolaire accessible — Les Liaisons dangereuses en version simplifiée, Le Diable au corps', 'Épistolaire court — Le Diable au corps, Chéri : courts et intenses') },
      { label: 'Métafiction, le roman parle de lui-même', result: R('🪞', ['Roman'], 'Métafiction', 'Métafiction exigeante — Calvino, Nabokov, Borges, Perec — jeu et intelligence', 'Métafiction accessible — Si par une nuit d\'hiver un voyageur (Calvino) — ludique et original', undefined, undefined, { reprend: 'Ce genre est déconseillé pour reprendre la lecture — essayez plutôt un roman classique.' }) },
    ],
  },

  a_surprise_origine: {
    question: 'Quelle origine littéraire vous attire ?',
    icone: '🌍',
    options: [
      { label: 'Littérature française contemporaine', result: R('🇫🇷', ['Roman'], 'Littérature française contemporaine', 'Littérature française exigeante — Ernaux, Modiano, Houellebecq, Angot — France d\'aujourd\'hui', 'Littérature française accessible — Marc Lévy, Guillaume Musso, Virginie Grimaldi', 'Littérature française feel-good — Guillaume Musso ou Virginie Grimaldi : courts et agréables') },
      { label: 'Littérature anglo-saxonne', result: R('🇬🇧', ['Roman'], 'Littérature anglo-saxonne', 'Anglo-saxonne exigeante — Cormac McCarthy, Don DeLillo, Ian McEwan, Julian Barnes', 'Anglo-saxonne accessible — Nick Hornby, Jonathan Tropper, Jojo Moyes', 'Anglo-saxonne courte — Nick Hornby : drôle, accessible, parfait pour reprendre') },
      { label: 'Littérature d\'Europe du Nord', result: R('🌨️', ['Roman'], 'Littérature nordique', 'Littérature nordique exigeante — Jon Fosse, Tomas Tranströmer, Per Petterson', 'Nordique accessible — Stieg Larsson, Jo Nesbø, Camilla Läckberg', 'Nordique accessible — Stieg Larsson T1 : policier nordique, court et très prenant') },
      { label: 'Asie, Afrique, Amérique latine', result: R('🌺', ['Roman'], 'Littérature du monde', 'Littérature mondiale — Marquez, Murakami, Achebe, Mahfouz — voir le monde autrement', 'Littérature du monde accessible — Murakami, L\'Alchimiste, Cent ans de solitude', 'Littérature du monde courte — L\'Alchimiste : 200 pages, beau et universel') },
    ],
  },

  a_surprise_defi: {
    question: 'Quel défi vous tente ?',
    icone: '🎯',
    options: [
      { label: 'Un témoignage qui change ma vision du monde', next: 'a_surprise_format', setCtx: { defi: 'temoignage' } },
      { label: 'Un pays dont je ne sais rien', next: 'a_surprise_format', setCtx: { defi: 'pays' } },
      { label: "Une époque que j'ignore complètement", next: 'a_surprise_format', setCtx: { defi: 'epoque' } },
      { label: 'Un débat de société qui me dérange', next: 'a_surprise_format', setCtx: { defi: 'societe' } },
    ],
  },

  a_surprise_format: {
    question: 'Format préféré pour aborder ce sujet ?',
    icone: '📐',
    options: [
      { label: 'Roman — je veux la fiction pour m\'y glisser', result: R('📖', ['Roman'], 'Roman de défi', 'Roman engagé — Steinbeck, Morrison, Dostoïevski — littérature qui change la vision du monde', 'Roman accessible et engagé — La Couleur des sentiments, Les Raisins de la colère', 'Roman court et fort — La Couleur des sentiments : 300 pages, bouleversant') },
      { label: 'Essai — je veux les faits et les arguments', result: R('📰', ['Essai'], 'Essai de fond', 'Essai exigeant — Arendt, Rawls, Piketty, Chomsky — pensée et rigueur', 'Essai accessible — Sapiens, This Changes Everything, Thinking Fast and Slow', 'Essai court — Chomsky en interviews, Sapiens : dense mais lisible') },
      { label: 'Biographie — je veux un destin humain', result: R('🌅', ['Biographie'], 'Biographie de défi', 'Biographie exigeante — Zweig, Edmund White, Robert Caro — vie et époque', 'Biographie accessible — Long Walk to Freedom, The Glass Castle', 'Biographie courte et forte — Moi, Malala : 300 pages, bouleversant') },
      { label: 'Peu importe', result: R('🎯', ['Roman', 'Essai'], 'Coup de cœur libraire', 'Coup de cœur exigeant — notre libraire vous sort de votre zone de confort', 'Coup de cœur accessible — notre sélection pour élargir votre horizon', 'Coup de cœur doux — on vous fait découvrir quelque chose de nouveau en douceur') },
    ],
  },

  // ── BRANCHE B : Pour offrir ───────────────────────────────────────────────
  b_age: {
    question: 'Quel âge a le destinataire ?',
    icone: '🎁',
    options: [
      { label: 'Moins de 6 ans', result: R('🌈', ['Jeunesse'], 'Album jeunesse', 'Album jeunesse illustré — notre sélection d\'albums poétiques et colorés') },
      { label: '6–9 ans', next: 'b_enfant' },
      { label: '10–13 ans', next: 'b_preado' },
      { label: '14–17 ans', next: 'b_ado' },
      { label: 'Adulte', next: 'b_adulte' },
    ],
  },

  b_enfant: {
    question: "Qu'est-ce qu'il ou elle aime ?",
    icone: '🧒',
    options: [
      { label: 'Les animaux', result: R('🐾', ['Jeunesse'], 'Jeunesse — animaux') },
      { label: 'Les aventures et les héros', result: R('⚔️', ['Jeunesse'], 'Jeunesse — aventure') },
      { label: "L'humour, faire rire", result: R('😄', ['Jeunesse'], 'Jeunesse — humour') },
      { label: 'Les contes, la magie', result: R('🌙', ['Jeunesse'], 'Jeunesse — féerie') },
    ],
  },

  b_preado: {
    question: 'Ses centres d\'intérêt ?',
    icone: '🧑',
    options: [
      { label: "L'aventure, l'action", result: R('⚡', ['Jeunesse'], 'Jeunesse — aventure') },
      { label: 'Les mondes fantastiques', result: R('🧙', ['Jeunesse', 'Fantasy'], 'Jeunesse — fantasy') },
      { label: 'Les animaux, la nature', result: R('🌿', ['Jeunesse'], 'Jeunesse — nature') },
      { label: "L'amitié, les émotions", result: R('💛', ['Jeunesse'], 'Jeunesse — contemporain') },
      { label: 'Les sciences, les inventions', result: R('🔬', ['Jeunesse'], 'Jeunesse — sciences') },
    ],
  },

  b_ado: {
    question: 'Qu\'est-ce qui le ou la passionne ?',
    icone: '🎤',
    options: [
      { label: 'Dystopies, SF', result: R('🚀', ['Science-fiction', 'Jeunesse'], 'YA Science-fiction', 'YA SF — Hunger Games, Divergente, Le Passeur') },
      { label: 'Fantasy, magie', result: R('🧙', ['Fantasy', 'Jeunesse'], 'YA Fantasy', 'YA Fantasy — Harry Potter, Percy Jackson, Shadowhunters') },
      { label: 'Romance', result: R('💕', ['Romance', 'Jeunesse'], 'YA Romance', 'YA Romance — La Faute à nos étoiles, Eleanor & Park') },
      { label: 'Thriller, mystère', result: R('🔎', ['Thriller', 'Policier'], 'YA Thriller', 'YA Thriller — Gone Girl YA, Pretty Little Liars') },
      { label: "Questions d'identité, grandir", result: R('🌱', ['Roman', 'Jeunesse'], 'YA contemporain', 'YA contemporain — Thirteen Reasons Why, The Perks of Being a Wallflower') },
    ],
  },

  b_adulte: {
    question: 'Vous le connaissez comment ?',
    icone: '🤝',
    options: [
      { label: 'Grand lecteur, exigeant', next: 'b_grandlecteur' },
      { label: 'Lit de temps en temps', next: 'b_occasionnel' },
      { label: 'Lit peu — cadeau symbolique', result: R('🎀', ['Roman'], 'Roman accessible & beau objet', 'Roman accessible — Le Petit Prince, L\'Alchimiste — beau et court, idéal comme cadeau') },
      { label: 'Je ne sais pas du tout', result: R('❤️', ['Roman'], 'Coup de cœur libraire', 'Coup de cœur libraire — nos lecteurs passionnés choisissent pour vous') },
    ],
  },

  b_grandlecteur: {
    question: 'Ses genres préférés ?',
    icone: '📚',
    options: [
      { label: 'Littérature générale, prix littéraires', result: R('🏆', ['Roman'], 'Roman primé & Rentrée littéraire', 'Roman primé — Goncourt, Renaudot, Booker Prize — le meilleur de la littérature contemporaine') },
      { label: 'Policier / Roman noir', result: R('🔎', ['Policier'], 'Polar exigeant', 'Polar exigeant — Ellroy, Manchette, Highsmith — noir et littérature') },
      { label: 'Essai, non-fiction', result: R('📰', ['Essai'], 'Essai de fond', 'Essai de fond — selon ses centres d\'intérêt, notre libraire vous guide') },
      { label: 'SF / Fantasy', result: R('🌌', ['Science-fiction', 'Fantasy'], 'SF & Fantasy littéraire', 'SF & Fantasy littéraire — Le Guin, Wolfe, Simmons — sommet du genre') },
      { label: 'Histoire', result: R('🏛️', ['Histoire'], 'Histoire narrative', 'Histoire narrative — Barbero, Tuchman, Michelet — récits de civilisations') },
    ],
  },

  b_occasionnel: {
    question: "Ce qui peut l'accrocher ?",
    icone: '🎣',
    options: [
      { label: 'Une histoire vraie, un récit de vie', result: R('🌅', ['Biographie'], 'Biographie & Récit', 'Biographie accessible — Into the Wild, Moi Malala, The Glass Castle — destins vrais et forts') },
      { label: 'Un roman court et prenant', result: R('⚡', ['Roman', 'Policier'], 'Roman accessible', 'Roman accessible et prenant — Harlan Coben, Jojo Moyes — accrocheur dès la page 1') },
      { label: "De l'humour", result: R('😄', ['Roman'], 'Roman humoristique', 'Roman humoristique accessible — Nick Hornby, Douglas Adams — rires garantis') },
      { label: 'Un sujet qui le passionne dans la vie', result: R('💡', ['Essai', 'Biographie'], 'Essai thématique', 'Essai thématique — selon sa passion : sport, musique, cuisine, voyage — notre libraire guide') },
    ],
  },
}

// ── Types données page ────────────────────────────────────────────────────────
type SelectionLivre = {
  id: number; livre_id: number; type: string; label: string | null
  rang: number | null; titre: string; auteur: string; isbn: string
  prix: number; stock: number; livre_genre?: string | null
}
type Selections = { coups_de_coeur: SelectionLivre[]; prix: SelectionLivre[]; top_ventes: SelectionLivre[] }
type Recommandation = { livre_id: number; titre: string; auteur: string; genre: string; prix: number; raison: string }
type Evenement = { id: number; titre: string; description: string | null; date_evenement: string; categorie: string | null; affiche_url: string | null }

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  return {
    jour: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
    date: d.getDate(),
    mois: d.toLocaleDateString('fr-FR', { month: 'short' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  }
}
const COULEURS_CAT: Record<string, { bg: string; text: string }> = {
  'Rencontre': { bg: '#EAF2EC', text: '#1A3C2E' }, 'Lecture': { bg: '#FFF8E6', text: '#B8960C' },
  'Atelier': { bg: '#F0EAF8', text: '#5B2D8E' }, 'Dédicace': { bg: '#FDE8E8', text: '#C0392B' },
  'Jeunesse': { bg: '#E8F4FD', text: '#1A6FA8' },
}

// ── SVG Trophée ───────────────────────────────────────────────────────────────
function TrophéeSVG({ rang }: { rang: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
      <svg width="44" height="48" viewBox="0 0 44 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 4 H36 L32 24 Q30 32 22 34 Q14 32 12 24 Z" fill="#B07D4E" />
        <path d="M12 6 H20 L18 20 Q16 26 13 28 Q10 22 12 6 Z" fill="rgba(255,255,255,0.15)" />
        <path d="M8 8 Q2 8 2 16 Q2 22 8 22" stroke="#8C6239" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M36 8 Q42 8 42 16 Q42 22 36 22" stroke="#8C6239" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <rect x="17" y="34" width="10" height="6" fill="#8C6239" rx="1"/><rect x="13" y="40" width="18" height="4" fill="#8C6239" rx="2"/>
        <text x="22" y="22" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="900" fill="#F9F6F0" fontFamily="'EB Garamond', Georgia, serif">{rang}</text>
      </svg>
    </div>
  )
}

// ── Carte livre ───────────────────────────────────────────────────────────────
function CarteLivre({ livre, label, rang }: { livre: SelectionLivre; label?: string | null; rang?: number | null }) {
  const [imgOk, setImgOk] = useState(true)
  const [ajout, setAjout] = useState(false)
  const [dansPanier, setDansPanier] = useState(false)

  useEffect(() => {
    setDansPanier(estDansPanier(livre.livre_id))
    const handler = () => setDansPanier(estDansPanier(livre.livre_id))
    window.addEventListener('bookdog_panier_change', handler)
    return () => window.removeEventListener('bookdog_panier_change', handler)
  }, [livre.livre_id])

  const handlePanier = (e: React.MouseEvent) => {
    e.preventDefault()
    if (dansPanier) {
      const qte = getPanier().find(a => a.livre_id === livre.livre_id)?.quantite || 1
      if (!confirm(`"${livre.titre}" est déjà dans votre panier (${qte} ex.). Ajouter un exemplaire ?`)) return
    }
    ajouterAuPanier({ livre_id: livre.livre_id, titre: livre.titre, auteur: livre.auteur, isbn: livre.isbn, prix: livre.prix, stock: livre.stock })
    setAjout(true); setDansPanier(true)
    setTimeout(() => setAjout(false), 1500)
  }

  return (
    <a href={`/livres/${livre.livre_id}`} style={{ textDecoration: 'none', flexShrink: 0, width: '170px', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {rang && <TrophéeSVG rang={rang} />}
      {label && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 2px' }}><span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>❤️</span><p style={{ color: C.vert, fontSize: '14px', fontWeight: '600', margin: 0, lineHeight: '1.2', fontStyle: 'italic' }}>{label}</p></div>}
      <div style={{ width: '170px', height: '240px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', backgroundColor: C.fondAlt, marginBottom: '10px', flexShrink: 0 }}>
        {imgOk ? <img src={`https://covers.openlibrary.org/b/isbn/${livre.isbn}-M.jpg`} alt={livre.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgOk(false)} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', boxSizing: 'border-box', textAlign: 'center' }}><span style={{ fontSize: '32px', marginBottom: '8px' }}>📚</span><p style={{ fontSize: '12px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>{livre.titre}</p></div>}
      </div>
      <p style={{ fontSize: '15px', fontWeight: '600', color: C.texte, margin: '0 0 3px', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{livre.titre}</p>
      <p style={{ fontSize: '14px', color: C.texteSecondaire, margin: '0 0 10px', fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{livre.auteur}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '17px', fontWeight: '700', color: C.vert }}>{livre.prix} €</span>
        <span style={{ fontSize: '11px', fontWeight: '600', color: livre.stock > 0 ? C.vert : C.orIntense }}>{livre.stock > 0 ? 'En stock' : 'Commande'}</span>
      </div>
      <button onClick={handlePanier} style={{ width: '100%', padding: '8px 0', border: `1px solid ${ajout ? C.vert : dansPanier ? C.or : '#ddd'}`, borderRadius: '6px', backgroundColor: ajout ? C.fondAlt : dansPanier ? '#fff8e6' : 'white', color: ajout ? C.vert : dansPanier ? C.orIntense : C.texteSecondaire, fontSize: '14px', cursor: 'pointer', fontWeight: ajout || dansPanier ? '700' : '400', transition: 'all 0.2s', fontFamily: FONT }}>
        {ajout ? '✓ Ajouté' : dansPanier ? '🛒 Dans le panier' : '🛒 Panier'}
      </button>
    </a>
  )
}

// ── Carousel ──────────────────────────────────────────────────────────────────
function SectionCarousel({ titre, sousTitre, livres, accentColor }: { titre: string; sousTitre?: string; livres: SelectionLivre[]; accentColor?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  if (!livres || livres.length === 0) return null
  const scroll = (dir: 'left' | 'right') => scrollRef.current?.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' })
  return (
    <div style={{ marginBottom: '56px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', borderBottom: `2px solid ${accentColor || C.vert}`, paddingBottom: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: C.texte, margin: '0 0 3px', fontFamily: FONT }}>{titre}</h2>
          {sousTitre && <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>{sousTitre}</p>}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => scroll('left')} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>‹</button>
          <button onClick={() => scroll('right')} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.texteSecondaire }}>›</button>
        </div>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
        {livres.map(l => <CarteLivre key={l.id} livre={l} label={l.label} rang={l.rang} />)}
      </div>
    </div>
  )
}

// ── Wizard Panel ──────────────────────────────────────────────────────────────
function WizardPanel() {
  const [visible, setVisible] = useState(true)
  const [nodeId, setNodeId] = useState('start')
  const [history, setHistory] = useState<string[]>([])
  const [profil, setProfil] = useState<ProfileType | null>(null)
  const [ctx, setCtx] = useState<Record<string, string>>({})
  const [result, setResult] = useState<WizardResult | null>(null)

  const node = WIZARD[nodeId]

  const handleOption = (opt: WizardOption) => {
    if (isResult(opt)) {
      setResult(opt.result)
    } else {
      if (opt.setProfile) setProfil(opt.setProfile)
      if (opt.setCtx) setCtx(prev => ({ ...prev, ...opt.setCtx }))
      setHistory(h => [...h, nodeId])
      setNodeId(opt.next)
    }
  }

  const handleBack = () => {
    if (result) { setResult(null); return }
    const prev = history[history.length - 1]
    if (prev) { setHistory(h => h.slice(0, -1)); setNodeId(prev) }
  }

  const handleReset = () => { setNodeId('start'); setHistory([]); setProfil(null); setCtx({}); setResult(null) }

  // Calcul du label adapté au profil
  const getLabel = (r: WizardResult) => {
    if (!profil || profil === 'cible') return r.labels.grand || r.labels.default
    return r.labels[profil] || r.labels.default
  }
  const getNote = (r: WizardResult) => {
    if (!r.notes) return null
    if (!profil || profil === 'cible') return r.notes.grand || null
    return r.notes[profil as keyof typeof r.notes] || null
  }

  const profilLabel: Record<ProfileType, string> = {
    grand: '📚 Grand lecteur', occasionnel: '📖 Lecteur occasionnel',
    reprend: '🌱 Je reprends', cible: '🎯 Lecteur ciblé',
  }

  if (!visible) return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
      <button onClick={() => setVisible(true)} style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '40px', padding: '8px 18px', fontSize: '14px', color: C.texteSecondaire, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
        💡 Trouver un livre
      </button>
    </div>
  )

  return (
    <div style={{ backgroundColor: C.vert, borderRadius: '16px', padding: '24px 32px', marginBottom: '48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <p style={{ color: C.or, fontSize: '11px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 3px', fontFamily: FONT }}>AIDE AU CHOIX</p>
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0, fontFamily: FONT }}>Trouvez votre prochain livre</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {profil && <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontFamily: FONT }}>{profilLabel[profil]}</span>}
          <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '20px', cursor: 'pointer', padding: '0', lineHeight: 1 }}>✕</button>
        </div>
      </div>

      {/* Barre de progression */}
      {history.length > 0 && !result && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {Array.from({ length: Math.max(history.length + 1, 6) }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: i < history.length ? C.or : i === history.length ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
          ))}
        </div>
      )}

      {/* Résultat */}
      {result && (
        <div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px', textAlign: 'center' }}>
            <p style={{ fontSize: '44px', margin: '0 0 12px' }}>{result.emoji}</p>
            <p style={{ color: C.or, fontSize: '12px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 8px', fontFamily: FONT }}>NOTRE SUGGESTION</p>
            <p style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: '0 0 8px', fontFamily: FONT, lineHeight: '1.3' }}>{getLabel(result)}</p>
            {getNote(result) && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: '0 0 20px', fontStyle: 'italic', fontFamily: FONT }}>{getNote(result)}</p>}
            {!getNote(result) && <div style={{ marginBottom: '20px' }} />}
            <button onClick={() => { const g = result.genres[0]; window.location.href = g ? `/livres?genre=${encodeURIComponent(g)}` : '/livres' }}
              style={{ backgroundColor: C.or, color: C.vert, border: 'none', borderRadius: '40px', padding: '12px 28px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT, display: 'block', width: '100%', marginBottom: '12px' }}>
              Voir la sélection →
            </button>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleBack} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>← Question précédente</button>
              <button onClick={handleReset} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '6px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>↺ Recommencer</button>
            </div>
          </div>
        </div>
      )}

      {/* Question courante */}
      {!result && node && (
        <div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', letterSpacing: '1px', margin: '0 0 8px', fontFamily: FONT }}>
            {node.icone} {nodeId === 'start' ? 'Commençons' : `Étape ${history.length + 1}`}
          </p>
          <p style={{ color: 'white', fontSize: '19px', fontWeight: '700', margin: '0 0 20px', fontFamily: FONT, lineHeight: '1.3' }}>{node.question}</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {node.options.map((opt, i) => (
              <button key={i} onClick={() => handleOption(opt)}
                style={{ padding: '10px 18px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px', color: 'white', fontSize: '14px', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}>
                {opt.label}
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <button onClick={handleBack} style={{ marginTop: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>← Question précédente</button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Section événements ────────────────────────────────────────────────────────
function SectionEvenements({ evenements }: { evenements: Evenement[] }) {
  const aVenir = evenements.filter(e => new Date(e.date_evenement) >= new Date()).slice(0, 3)
  if (aVenir.length === 0) return null
  return (
    <div style={{ marginBottom: '56px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', borderBottom: `2px solid ${C.or}`, paddingBottom: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: C.texte, margin: '0 0 3px', fontFamily: FONT }}>À venir à la librairie</h2>
          <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>Rencontres, ateliers, dédicaces</p>
        </div>
        <a href="/evenements" style={{ fontSize: '13px', color: C.texteSecondaire, textDecoration: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '6px 14px', backgroundColor: 'white', fontFamily: FONT }}>Tous les événements →</a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {aVenir.map(ev => {
          const { jour, date, mois, heure } = formatDate(ev.date_evenement)
          const catStyle = ev.categorie ? (COULEURS_CAT[ev.categorie] || { bg: '#F0F0F0', text: '#555' }) : null
          return (
            <a key={ev.id} href="/evenements" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', gap: '16px', alignItems: 'flex-start', border: '1px solid #eee' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ backgroundColor: C.vert, borderRadius: '10px', padding: '10px 14px', textAlign: 'center', flexShrink: 0, minWidth: '56px' }}>
                  <p style={{ color: C.or, fontSize: '11px', margin: '0 0 2px', fontWeight: '600', textTransform: 'uppercase', fontFamily: FONT }}>{jour}</p>
                  <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: '0 0 2px', lineHeight: 1, fontFamily: FONT }}>{date}</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0, fontFamily: FONT }}>{mois}</p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {catStyle && ev.categorie && <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', backgroundColor: catStyle.bg, color: catStyle.text, fontFamily: FONT, display: 'inline-block', marginBottom: '6px' }}>{ev.categorie}</span>}
                  <p style={{ fontSize: '15px', fontWeight: '700', color: C.texte, margin: '0 0 4px', lineHeight: '1.3', fontFamily: FONT }}>{ev.titre}</p>
                  <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>🕐 {heure}</p>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

// ── Bandeau catalogue ─────────────────────────────────────────────────────────
function BandeauCatalogue({ nbLivres }: { nbLivres: number | null }) {
  if (!nbLivres) return null
  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #e8e3db', borderRadius: '12px', padding: '20px 28px', marginBottom: '56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '28px' }}>📚</span>
        <div>
          <p style={{ fontSize: '20px', fontWeight: '700', color: C.vert, margin: '0 0 2px', fontFamily: FONT }}>{nbLivres.toLocaleString('fr-FR')} titres disponibles en boutique</p>
          <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontFamily: FONT }}>Roman, policier, essai, jeunesse, BD et bien d'autres</p>
        </div>
      </div>
      <a href="/livres" style={{ display: 'inline-block', backgroundColor: C.vert, color: 'white', padding: '11px 24px', borderRadius: '40px', fontSize: '15px', fontWeight: '700', textDecoration: 'none', fontFamily: FONT, whiteSpace: 'nowrap' }}>Parcourir le catalogue →</a>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Home() {
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState<any[]>([])
  const [rechercheActive, setRechercheActive] = useState(false)
  const [selections, setSelections] = useState<Selections>({ coups_de_coeur: [], prix: [], top_ventes: [] })
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [nbLivres, setNbLivres] = useState<number | null>(null)
  const [rayonsOuvert, setRayonsOuvert] = useState(false)
  const [clientConnecte, setClientConnecte] = useState(false)
  const [recommandations, setRecommandations] = useState<Recommandation[]>([])
  const [chargementReco, setChargementReco] = useState(false)
  const [recoChargees, setRecoChargees] = useState(false)
  const rayonsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('http://localhost:3001/selections').then(r => r.json()).then(d => setSelections(d)).catch(() => {})
    fetch('http://localhost:3001/evenements').then(r => r.json()).then(d => { if (Array.isArray(d)) setEvenements(d) }).catch(() => {})
    fetch('http://localhost:3001/livres').then(r => r.json()).then(d => { if (Array.isArray(d)) setNbLivres(d.length) }).catch(() => {})
    const token = localStorage.getItem('clientToken')
    setClientConnecte(!!token)
    const handleClick = (e: MouseEvent) => { if (rayonsRef.current && !rayonsRef.current.contains(e.target as Node)) setRayonsOuvert(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!recherche.trim()) { setResultats([]); setRechercheActive(false); return }
    const delai = setTimeout(() => {
      const q = recherche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '')
      fetch(`http://localhost:3001/livres?titre=${encodeURIComponent(q)}`).then(r => r.json()).then(d => { setResultats(d); setRechercheActive(true) }).catch(() => {})
    }, 300)
    return () => clearTimeout(delai)
  }, [recherche])

  async function chargerRecommandations() {
    const token = localStorage.getItem('clientToken')
    if (!token) return
    setChargementReco(true)
    try {
      const res = await fetch('http://localhost:3001/api/recommandations', { headers: { Authorization: 'Bearer ' + token } })
      const data = await res.json()
      if (data.recommandations) setRecommandations(data.recommandations)
    } catch {}
    setChargementReco(false); setRecoChargees(true)
  }

  const adresseMap = '42+rue+laugier+75017+Paris'

  return (
    <div style={{ backgroundColor: C.fond, minHeight: '100vh', fontFamily: FONT }}>
      <Header pageCourante="accueil" />

      {/* HERO */}
      <div style={{ backgroundColor: C.vert, paddingBottom: '48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 0', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <p style={{ color: C.or, fontSize: '13px', letterSpacing: '3px', margin: '0 0 12px', fontWeight: '500', fontFamily: FONT }}>Bienvenue chez Bookdog</p>
            <h1 style={{ color: 'white', fontSize: '38px', fontWeight: '700', margin: 0, lineHeight: '1.2', fontFamily: FONT }}>Des livres choisis avec passion</h1>
          </div>

          <div style={{ position: 'relative', maxWidth: '720px', margin: '0 auto 28px' }}>
            <span style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', pointerEvents: 'none' }}>🔍</span>
            <input type="text" placeholder="Rechercher un livre, un auteur..." value={recherche} onChange={e => setRecherche(e.target.value)}
              style={{ width: '100%', padding: '18px 20px 18px 56px', borderRadius: '40px', border: 'none', fontSize: '16px', boxSizing: 'border-box', backgroundColor: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.25)', outline: 'none', fontFamily: FONT }} />
            {recherche && <button onClick={() => { setRecherche(''); setRechercheActive(false) }} style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: C.texteSecondaire }}>✕</button>}
            {rechercheActive && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 100, overflow: 'hidden', maxHeight: '340px', overflowY: 'auto' }}>
                {resultats.length === 0
                  ? <p style={{ padding: '20px', color: C.texteSecondaire, margin: 0, fontSize: '15px', fontFamily: FONT }}>Aucun résultat pour « {recherche} »</p>
                  : resultats.slice(0, 6).map((l: any) => (
                    <a key={l.id} href={`/livres/${l.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid #f5f5f5', textDecoration: 'none', backgroundColor: 'white' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = C.fondAlt}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: C.texte, margin: '0 0 2px', fontFamily: FONT }}>{l.titre}</p>
                        <p style={{ fontSize: '13px', color: C.texteSecondaire, margin: 0, fontStyle: 'italic', fontFamily: FONT }}>{l.auteur}</p>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: C.vert, flexShrink: 0, marginLeft: '16px', fontFamily: FONT }}>{l.prix} €</span>
                    </a>
                  ))}
                {resultats.length > 6 && <a href={`/livres?q=${encodeURIComponent(recherche)}`} style={{ display: 'block', padding: '14px 22px', textAlign: 'center', fontSize: '14px', color: C.vert, fontWeight: '600', textDecoration: 'none', backgroundColor: C.fondAlt, fontFamily: FONT }}>Voir tous les résultats ({resultats.length}) →</a>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div ref={rayonsRef} style={{ position: 'relative' }}>
              <button onClick={() => setRayonsOuvert(!rayonsOuvert)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', backgroundColor: rayonsOuvert ? 'white' : 'rgba(255,255,255,0.15)', color: rayonsOuvert ? C.vert : 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '40px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                ☰ Rayons {rayonsOuvert ? '▲' : '▼'}
              </button>
              {rayonsOuvert && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 200, minWidth: '230px', overflow: 'hidden' }}>
                  {GENRES.map((g, i) => (
                    <a key={g} href={`/livres?genre=${encodeURIComponent(g)}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 22px', textDecoration: 'none', color: C.texte, fontSize: '15px', borderBottom: i < GENRES.length - 1 ? '1px solid #f5f5f5' : 'none', backgroundColor: 'white', fontFamily: FONT }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.fondAlt; e.currentTarget.style.color = C.vert }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = C.texte }}>
                      <span style={{ color: C.or, fontSize: '12px' }}>▶</span> {g}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <a href="/livres" style={{ padding: '11px 22px', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '40px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', fontFamily: FONT }}>Tout le catalogue</a>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: C.vert, height: '32px', borderRadius: '0 0 50% 50% / 0 0 28px 28px' }} />

      {/* CONTENU PRINCIPAL */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 24px 60px', boxSizing: 'border-box' }}>

        <WizardPanel />
        <SectionEvenements evenements={evenements} />

        {/* Recommandations IA */}
        {clientConnecte && (
          <div style={{ backgroundColor: C.vert, borderRadius: '16px', padding: '28px 32px', marginBottom: '56px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: recoChargees && recommandations.length > 0 ? '20px' : '0', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ color: C.or, fontSize: '11px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 4px', fontFamily: FONT }}>POUR VOUS</p>
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0, fontFamily: FONT }}>Nos suggestions personnalisées</h3>
              </div>
              {!recoChargees
                ? <button onClick={chargerRecommandations} disabled={chargementReco} style={{ backgroundColor: chargementReco ? 'rgba(255,255,255,0.1)' : C.or, color: chargementReco ? 'rgba(255,255,255,0.5)' : C.vert, border: 'none', borderRadius: '40px', padding: '10px 22px', fontSize: '14px', fontWeight: '700', cursor: chargementReco ? 'not-allowed' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' as const }}>{chargementReco ? '✨ Analyse...' : '✨ Voir mes recommandations'}</button>
                : <button onClick={chargerRecommandations} disabled={chargementReco} style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>{chargementReco ? '...' : '↺ Actualiser'}</button>}
            </div>
            {recoChargees && recommandations.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {recommandations.map((r, i) => (
                  <a key={i} href={`/livres/${r.livre_id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '18px', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ backgroundColor: C.or, color: C.vert, fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', fontFamily: FONT }}>#{i + 1}</span>
                        <span style={{ color: C.or, fontSize: '15px', fontWeight: '700', fontFamily: FONT }}>{Number(r.prix).toFixed(2)} €</span>
                      </div>
                      <p style={{ color: 'white', fontSize: '15px', fontWeight: '700', margin: '0 0 3px', lineHeight: '1.3', fontFamily: FONT }}>{r.titre}</p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 8px', fontStyle: 'italic', fontFamily: FONT }}>{r.auteur}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, lineHeight: '1.5', fontStyle: 'italic', fontFamily: FONT }}>{r.raison}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <SectionCarousel titre="Coups de cœur de vos libraires" sousTitre="Une sélection passionnée, renouvelée chaque semaine" livres={selections.coups_de_coeur} accentColor={C.vert} />
        <SectionCarousel titre="Top ventes" sousTitre="Les titres les plus demandés en ce moment" livres={selections.top_ventes} accentColor={C.or} />
        <SectionCarousel titre="Récompensés" sousTitre="Prix littéraires et distinctions" livres={selections.prix} accentColor="#8B4513" />

        <BandeauCatalogue nbLivres={nbLivres} />

        {/* Entreprises */}
        <div style={{ backgroundColor: C.vert, borderRadius: '16px', padding: '44px 48px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'center' }}>
          <div>
            <p style={{ color: C.or, fontSize: '11px', letterSpacing: '2px', fontWeight: '600', margin: '0 0 10px', fontFamily: FONT }}>SERVICES PROFESSIONNELS</p>
            <h2 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: '0 0 14px', fontFamily: FONT }}>Vous êtes une entreprise ?</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: '1.8', margin: '0 0 22px', fontFamily: FONT }}>Comités d'entreprise, cadeaux professionnels, bibliothèques d'entreprise, événements culturels — Bookdog accompagne les organisations avec des offres sur mesure.</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['Cadeaux CE', 'Ateliers lecture', 'Commandes groupées', 'Facturation entreprise'].map(tag => (
                <span key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', fontSize: '13px', padding: '5px 14px', borderRadius: '20px', fontFamily: FONT }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 14px', fontFamily: FONT }}>Offre en cours de développement</p>
            <a href="mailto:Bookdog@librairie.com?subject=Services entreprise" style={{ display: 'inline-block', backgroundColor: C.or, color: C.vert, padding: '13px 26px', borderRadius: '40px', fontSize: '15px', fontWeight: '700', textDecoration: 'none', fontFamily: FONT }}>Nous contacter →</a>
          </div>
        </div>
      </main>

      {/* INFOS PRATIQUES */}
      <div id="infos" style={{ backgroundColor: C.vert }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <p style={{ color: C.or, fontSize: '12px', letterSpacing: '3px', marginBottom: '10px', fontFamily: FONT }}>Nous trouver</p>
            <h2 style={{ color: 'white', fontSize: '30px', fontWeight: '700', margin: 0, fontFamily: FONT }}>Infos pratiques</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px' }}>
              <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1px', marginBottom: '12px', fontWeight: '600', fontFamily: FONT }}>ADRESSE</p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${adresseMap}`} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: '500', lineHeight: '1.7', fontFamily: FONT }}>42 rue Laugier, 75017 Paris<br /><span style={{ color: C.fondAlt, fontSize: '13px', fontWeight: '400' }}>Ouvrir dans Maps →</span></a>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px' }}>
              <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1px', marginBottom: '12px', fontWeight: '600', fontFamily: FONT }}>HORAIRES</p>
              <p style={{ color: 'white', fontSize: '16px', fontWeight: '500', lineHeight: '1.8', margin: 0, fontFamily: FONT }}>Lundi – Samedi : 10h00 – 20h00</p>
              <p style={{ color: C.fondAlt, fontSize: '13px', marginTop: '6px', fontFamily: FONT }}>Fermé le dimanche</p>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px' }}>
              <p style={{ color: C.or, fontSize: '11px', letterSpacing: '1px', marginBottom: '12px', fontWeight: '600', fontFamily: FONT }}>CONTACT</p>
              <a href="tel:0677402151" style={{ display: 'block', color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: '500', marginBottom: '6px', fontFamily: FONT }}>06 77 40 21 51</a>
              <a href="mailto:Bookdog@librairie.com" style={{ display: 'block', color: C.fondAlt, textDecoration: 'none', fontSize: '14px', fontFamily: FONT }}>Bookdog@librairie.com</a>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ backgroundColor: C.footer, padding: '28px', textAlign: 'center' }}>
        <p style={{ color: C.fondAlt, fontSize: '14px', margin: 0, fontFamily: FONT }}>2026 Bookdog — Librairie indépendante Paris 17e</p>
      </footer>
    </div>
  )
}