/* eslint-disable @typescript-eslint/no-unused-vars */
import { Palette, purple, red, yellow } from "@ant-design/colors";
import { CompassOutlined, CustomerServiceOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import { ForwardRefExoticComponent } from "react";

export interface RoundCard {
  identifier: RoundCardIdentifier;
  themeColor?: Palette;
  icon: ForwardRefExoticComponent<Omit<AntdIconProps, "ref">>;
  title: string;
  description: string;
  modifiers: RoundCardModifiers;
  selected?: boolean;
  onClick?: () => void;
}

export interface RoundCardModifiers {
  time: number;
  guesses: number;
  streetview: string;
  map: "None" | "No Labels";
}

export type RoundCardIdentifier = "world" | "flash";
//TODO: title, description and modifiers will be removed and fetched from the server
const cards: RoundCard[] = [
  {
    identifier: "world",
    icon: CompassOutlined,
    title: "World",
    description: "A standard round with no restrictions.",
    modifiers: { time: 60, guesses: 1, streetview: "None", map: "None" } as RoundCardModifiers,
    themeColor: purple,
  },
  {
    identifier: "flash",
    icon: ThunderboltOutlined,
    title: "Flash",
    description: "A standard round with half the time.",
    modifiers: { time: 30, guesses: 1, streetview: "None", map: "None" } as RoundCardModifiers,
    themeColor: yellow,
  },
  // {
  //   identifier: "radio",
  //   icon: CustomerServiceOutlined,
  //   title: "Radio",
  //   description: "Instead of exploring streetview, you will listen to a radio station.",
  //   modifiers: { time: 60, guesses: 1, streetview: "Hidden", map: "None" } as RoundCardModifiers,
  //   themeColor: red,
  // },
];

export function getRoundCards(intentifiers: RoundCardIdentifier[]): RoundCard[] {
  return intentifiers.reduce((result, id) => {
    const card = cards.find((card) => card.identifier === id);
    if (card) {
      result.push(card);
    }
    return result;
  }, [] as RoundCard[]);
}
