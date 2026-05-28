// Color palette inspired by opencode. Hex strings are accepted directly by
// OpenTUI wherever a `fg`, `bg`, `borderColor`, etc. is expected.
// See: https://opentui.com/docs/core-concepts/colors/

export const colors = {
  // Surfaces
  surface: "#0E0E10",
  surfaceAlt: "#15151A",

  // Borders
  border: "#26262C",
  borderFocus: "#3D3D46",

  // Text
  text: "#E6E6E6",
  textDim: "#7A7A82",
  textMuted: "#4A4A52",

  // Brand / accents
  title: "#7FB3FF", //   app title, primary accent
  section: "#B197E6", //   form labels when focused
  command: "#F0B458", //   slash commands, tips
  warning: "#F0B458", //   running / connecting
  success: "#8FE388", //   ok / row counts
  error: "#FF7B7B", //     errors

  // Panel accents — each card gets its own subtle hue so titles read like
  // colored tabs without being loud.
  panelQueries: "#6EC4B5", //   mint-teal · saved queries (library)
  panelQuery: "#B197E6", //     violet · the active SQL input
  panelResult: "#7FB3FF", //    blue · query output

  // Selection
  selectedFg: "#F0B458",
  selectedBg: "#2C2317",
} as const
