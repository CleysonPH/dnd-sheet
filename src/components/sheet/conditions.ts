import type { ActiveCondition } from "@/engine/traits/keys";

/**
 * Resumo da regra de cada condição do 5.5e, escrito para a ficha (design T6).
 * É só lembrete: a ficha não aplica nenhum destes efeitos.
 */
export const CONDITION_SUMMARY: Record<ActiveCondition, string> = {
  grappled:
    "Deslocamento 0. Desvantagem em ataques contra alvos que não sejam quem agarra. Quem agarra pode arrastar você.",
  frightened:
    "Desvantagem em testes de atributo e ataques enquanto vê a fonte do medo. Não pode se aproximar dela por vontade própria.",
  stunned:
    "Incapacitado. Falha automática em salvaguardas de FOR e DES. Ataques contra você têm vantagem.",
  prone:
    "Só rasteja, ou gasta metade do deslocamento para levantar. Desvantagem nos seus ataques. Ataques corpo a corpo a até 1,5 m têm vantagem contra você; os outros, desvantagem.",
  blinded:
    "Não enxerga e falha em testes que dependem de visão. Ataques contra você têm vantagem; os seus, desvantagem.",
  charmed:
    "Não pode atacar quem o enfeitiçou nem mirá-lo com efeitos nocivos. Quem enfeitiçou tem vantagem em testes sociais com você.",
  poisoned: "Desvantagem em ataques e testes de atributo.",
  restrained:
    "Deslocamento 0. Desvantagem nos seus ataques e em salvaguardas de DES. Ataques contra você têm vantagem.",
  incapacitated:
    "Sem ações, ações bônus nem reações. A concentração termina. Não pode falar. Desvantagem na iniciativa.",
  unconscious:
    "Incapacitado, caído e sem perceber o redor; larga o que segura. Falha em salvaguardas de FOR e DES. Ataques contra você têm vantagem, e um acerto a até 1,5 m é crítico.",
  invisible:
    "Não pode ser visto sem meios especiais. Vantagem na iniciativa e nos seus ataques; ataques contra você têm desvantagem.",
  paralyzed:
    "Incapacitado e deslocamento 0. Falha em salvaguardas de FOR e DES. Ataques contra você têm vantagem, e um acerto a até 1,5 m é crítico.",
  petrified:
    "Vira substância inanimada: incapacitado, deslocamento 0, falha em salvaguardas de FOR e DES, resistência a todo dano e imune a veneno.",
  deafened: "Não ouve e falha em testes que dependem de audição.",
};

export const EXHAUSTION_SUMMARY =
  "Cada nível tira 2 dos testes de d20 e 1,5 m do deslocamento (já aplicado na ficha). O descanso longo tira 1 nível. No nível 6, o personagem morre.";
