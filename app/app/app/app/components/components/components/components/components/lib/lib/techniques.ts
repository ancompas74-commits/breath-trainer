export interface TechniquePhase {
  name: string;
  duration: number;
}

export interface Technique {
  id: string;
  name: string;
  description: string;
  phases: TechniquePhase[];
}

export const techniques: Technique[] = [
  {
    id: "square",
    name: "Квадратное дыхание",
    description:
      "4-4-4-4. Ровный ритм: вдох, задержка, выдох, задержка — по 4 секунды. Успокаивает ум и выравнивает нервную систему.",
    phases: [
      { name: "Вдох", duration: 4 },
      { name: "Задержка", duration: 4 },
      { name: "Выдох", duration: 4 },
      { name: "Задержка", duration: 4 },
    ],
  },
  {
    id: "relaxing",
    name: "Расслабляющее дыхание",
    description:
      "4-7-8. Вдох на 4 счета, задержка на 7, выдох на 8. Глубокое расслабление и подготовка ко сну.",
    phases: [
      { name: "Вдох", duration: 4 },
      { name: "Задержка", duration: 7 },
      { name: "Выдох", duration: 8 },
    ],
  },
  {
    id: "pranayama",
    name: "Пранаяма",
    description:
      "4-4-4. Древняя техника: вдох, задержка, выдох — равные части. Балансирует энергию и успокаивает ум.",
    phases: [
      { name: "Вдох", duration: 4 },
      { name: "Задержка", duration: 4 },
      { name: "Выдох", duration: 4 },
    ],
  },
  {
    id: "power",
    name: "Силовое дыхание",
    description:
      "Энергичное, глубокое дыхание с акцентом на мощный вдох и активный выдох. Заряжает бодростью и тонусом.",
    phases: [
      { name: "Вдох", duration: 2 },
      { name: "Выдох", duration: 2 },
    ],
  },
  {
    id: "coherent",
    name: "Когерентное дыхание",
    description:
      "5-5. Ровные вдох и выдох по 5 секунд. Синхронизирует сердечный ритм и дыхание, помогает войти в состояние потока.",
    phases: [
      { name: "Вдох", duration: 5 },
      { name: "Выдох", duration: 5 },
    ],
  },
  {
    id: "free",
    name: "Свободное дыхание",
    description:
      "Без ритма и правил. Дышите естественно, как чувствуете. Позвольте телу самому найти свой ритм.",
    phases: [],
  },
];
