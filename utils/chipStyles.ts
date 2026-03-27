import { Colors } from '@/constants/Colors';

export const filterChipStyle = (selected: boolean) => ({
  backgroundColor: selected ? Colors.tint.teal : Colors.chip.darkCard,
  borderColor: selected ? Colors.sway.bright : Colors.chip.darkCardAlt,
  borderWidth: 1
});

export const filterChipTextStyle = (selected: boolean) => ({
  color: selected ? Colors.sway.bright : Colors.sway.darkGrey,
  fontSize: 13
});
