export const ARENA_WIDTH = 1320;
export const ARENA_HEIGHT = 860;
export const ARENA_MARGIN = 46;
export const RUN_DURATION = 600;
export const SURGE_TIME = 120;
export const MINIBOSS_TIME = 270;
export const BOSS_TIME = 510;
export const FINAL_COUNTDOWN = 30;

export const WEAPON_CATALOG = {
  dawn_blade: {
    id: "dawn_blade",
    name: "Lame de l'Aube",
    evolvedName: "Excalibur Solaire",
    icon: "🗡️",
    maxLevel: 5,
    evolveLevel: 4,
    baseCooldown: 0.62,
    baseDamage: 24,
    descriptions: [
      "Projette des lames d'acier vers l'ennemi le plus proche.",
      "+1 lame par salve et +22% dégâts.",
      "Les lames transpercent +1 ennemi et volent plus vite.",
      "ÉVEIL : 4 lames solaires perforantes à cadence infernale !",
      "Lames divines : +35% dégâts et salve de 5 lames."
    ]
  },
  morning_star: {
    id: "morning_star",
    name: "Fléau Orbital",
    evolvedName: "Couronne d'Acier",
    icon: "⛓️",
    maxLevel: 5,
    evolveLevel: 4,
    baseCooldown: 0.1,
    baseDamage: 18,
    descriptions: [
      "2 boulets à pointes orbitent et broient les ennemis proches.",
      "+1 boulet orbital et rayon agrandi.",
      "+30% vitesse de rotation et dégâts accrus.",
      "ÉVEIL : 5 boulets enflammés qui repoussent la horde !",
      "6 boulets solaires à force d'impact dévastatrice."
    ]
  },
  berserker_axe: {
    id: "berserker_axe",
    name: "Hache du Berserker",
    evolvedName: "Fureur de Ragnar",
    icon: "🪓",
    maxLevel: 5,
    evolveLevel: 4,
    baseCooldown: 1.35,
    baseDamage: 46,
    descriptions: [
      "Lance une lourde hache tournoyante à dégâts perforants.",
      "Lance 2 haches simultanées à large portée.",
      "+30% dégâts et taille de hache augmentée.",
      "ÉVEIL : Salve de 3 haches géantes qui fendent tout sur passage !",
      "4 haches colossales avec onde de choc à l'impact."
    ]
  },
  greek_fire: {
    id: "greek_fire",
    name: "Feu Grégeois",
    evolvedName: "Bûcher Royal",
    icon: "🔥",
    maxLevel: 5,
    evolveLevel: 4,
    baseCooldown: 2.2,
    baseDamage: 15,
    descriptions: [
      "Lance une fiole créant une zone de flammes brûlantes.",
      "+35% rayon de flammes et brûlure plus intense.",
      "Lance 2 fioles sur les groupes d'ennemis.",
      "ÉVEIL : 3 brasiers infernaux qui ralentissent la horde !",
      "Bûchers gigantesques à dégâts incendiaires massifs."
    ]
  },
  runic_lightning: {
    id: "runic_lightning",
    name: "Foudre Runique",
    evolvedName: "Colère des Cieux",
    icon: "⚡",
    maxLevel: 5,
    evolveLevel: 4,
    baseCooldown: 1.55,
    baseDamage: 48,
    descriptions: [
      "Foudroie un ennemi et rebondit sur 2 cibles voisines.",
      "+2 éclairs en chaîne et recharge plus rapide.",
      "+35% dégâts électriques et bref étourdissement.",
      "ÉVEIL : Double impact céleste qui chaîne sur 6 ennemis !",
      "Tempête runique : 3 éclairs majeurs à dégâts critiques."
    ]
  },
  holy_shield: {
    id: "holy_shield",
    name: "Onde du Bouclier",
    evolvedName: "Égide de l'Aube",
    icon: "🛡️",
    maxLevel: 5,
    evolveLevel: 4,
    baseCooldown: 2.8,
    baseDamage: 28,
    descriptions: [
      "Pulsation sacrée qui repousse les ennemis et détruit les tirs.",
      "+30% rayon et temps de recharge réduit.",
      "+40% dégâts sacrés et recul renforcé.",
      "ÉVEIL : Double onde dorée qui pulvérise projectiles et ennemis !",
      "Égide suprême : onde immense et soin +3 PV par déclenchement."
    ]
  }
};

export const PASSIVE_CATALOG = {
  quicksilver_boots: {
    id: "quicksilver_boots",
    name: "Bottes de Vif-Argent",
    icon: "👢",
    maxLevel: 3,
    description: "+16% vitesse de déplacement et -18% recharge de Roulade."
  },
  blacksmith_fury: {
    id: "blacksmith_fury",
    name: "Fureur du Forgeron",
    icon: "⚒️",
    maxLevel: 3,
    description: "+22% dégâts de toutes les armes et +8% chance de critique."
  },
  war_hourglass: {
    id: "war_hourglass",
    name: "Sablier de Guerre",
    icon: "⏳",
    maxLevel: 3,
    description: "-15% temps de recharge sur tout ton arsenal."
  },
  treasure_magnet: {
    id: "treasure_magnet",
    name: "Aimant Royal",
    icon: "🧲",
    maxLevel: 3,
    description: "+55% portée d'aimant à gemmes et +20% gain d'XP."
  },
  plate_armor: {
    id: "plate_armor",
    name: "Armure de Plates",
    icon: "🏰",
    maxLevel: 3,
    description: "+25 PV max et restaure immédiatement 30 PV."
  },
  blood_seal: {
    id: "blood_seal",
    name: "Sceau du Carnage",
    icon: "🩸",
    maxLevel: 3,
    description: "Tous les 12 kills, récupère +6 PV et prolonge ton combo."
  }
};

export const ENEMY_CATALOG = {
  goblin: {
    id: "goblin",
    name: "Gobelin",
    hp: 26,
    speed: 138,
    damage: 9,
    radius: 13,
    xp: 6,
    score: 25,
    color: "#4a8c4a"
  },
  skeleton: {
    id: "skeleton",
    name: "Squelette",
    hp: 44,
    speed: 102,
    damage: 13,
    radius: 15,
    xp: 9,
    score: 40,
    color: "#d9d2c0"
  },
  charger: {
    id: "charger",
    name: "Lancier Noir",
    hp: 68,
    speed: 96,
    damage: 18,
    radius: 17,
    xp: 16,
    score: 75,
    color: "#b3342c"
  },
  cultist: {
    id: "cultist",
    name: "Cultiste",
    hp: 52,
    speed: 82,
    damage: 12,
    radius: 15,
    xp: 15,
    score: 70,
    color: "#7f48b8"
  },
  cursed_knight: {
    id: "cursed_knight",
    name: "Chevalier Maudit",
    hp: 155,
    speed: 86,
    damage: 22,
    radius: 21,
    xp: 30,
    score: 140,
    color: "#6b7382"
  },
  executioner: {
    id: "executioner",
    name: "Exécuteur d'Acier",
    hp: 1400,
    speed: 108,
    damage: 26,
    radius: 30,
    xp: 90,
    score: 650,
    color: "#a8442a",
    isBoss: true
  },
  arch_lich: {
    id: "arch_lich",
    name: "SEIGNEUR LICHE",
    hp: 6200,
    speed: 98,
    damage: 28,
    radius: 34,
    xp: 200,
    score: 2500,
    color: "#8e44ad",
    isBoss: true,
    isFinalBoss: true
  }
};

export const WEAPON_IDS = Object.keys(WEAPON_CATALOG);
export const PASSIVE_IDS = Object.keys(PASSIVE_CATALOG);

export function getPhaseLabel(elapsed) {
  if (elapsed >= BOSS_TIME) {
    return "BOSS FINAL — SEIGNEUR LICHE";
  }
  if (elapsed >= MINIBOSS_TIME) {
    return "L'ASSAUT INFERNAL";
  }
  if (elapsed >= SURGE_TIME) {
    return "LA MARÉE SOMBRE";
  }
  return "L'AVANT-GARDE";
}

export function computeRank(score, victory, elapsed) {
  if (victory && (score >= 200000 || elapsed <= RUN_DURATION - 25)) {
    return "S+";
  }
  if (victory && score >= 100000) {
    return "S";
  }
  if (victory || score >= 45000) {
    return "A";
  }
  if (score >= 15000) {
    return "B";
  }
  return "C";
}
