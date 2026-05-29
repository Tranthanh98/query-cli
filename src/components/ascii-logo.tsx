import { colors } from "../theme";

const LOGO = `
 ██████   ██   ██  ███████  ██████   ██████        ██████  ██       ██████
██    ██  ██   ██  ██      ██       ██            ██       ██      ██
██   ███  ██   ██  █████   ██  ███  ██   ███     ██       ██      ██
██    ██  ██   ██  ██      ██    █  ██    █      ██       ██      ██
 ██████    █████   ███████  █████    █████        ██████  ██████  ██████
                                    ████████
`;

export function AsciiLogo() {
  return (
    <text fg={colors.title} alignSelf="center">
      {LOGO.trim()}
    </text>
  );
}
