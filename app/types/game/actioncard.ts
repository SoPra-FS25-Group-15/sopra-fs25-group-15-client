export interface ActionCard {
  identifier: ActionCardIdentifier;
  type: ActionCardType;
  title: string;
  description: string;
  toUsername?: string;
  selected?: boolean;
  onClick?: () => void;
}

export type ActionCardIdentifier = "7choices" | "badsight";
export type ActionCardType = "powerup" | "punishment";

//TODO: will be removed and fetched from the server
const cards: ActionCard[] = [
  {
    identifier: "7choices",
    type: "powerup",
    title: "7 Choices",
    description: "Reveal the continent of the target location.",
  },
  {
    identifier: "badsight",
    type: "punishment",
    title: "Bad Sight",
    description: "A player of your choice has their screen blurred for the first 15 seconds of the round.",
  },
];

//TODO: will be removed and fetched from the server
export function getActionCards(intentifiers: ActionCardIdentifier[]): ActionCard[] {
  return intentifiers.reduce((result, id) => {
    const card = cards.find((card) => card.identifier === id);
    if (card) {
      result.push(card);
    }
    return result;
  }, [] as ActionCard[]);
}
