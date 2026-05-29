import { colors } from "../theme";

const LOGO = `>_ 
 ██████   ██   ██  ███████ ██████   ██    ██         ██████  ██      ██
██    ██  ██   ██  ██      ██   ██   ██  ██         ██       ██      ██
██    ██  ██   ██  █████   ██ ██      ████          ██       ██      ██
██  █  █  ██   ██  ██      ██   ██     ██           ██       ██      ██
 ██████    █████   ███████ ██    █     ██     ████   ██████  ██████  ██
      █
`;

export function AsciiLogo() {
  return (
    <text fg={colors.title} alignSelf="center">
      {LOGO.trim()}
    </text>
  );
}
