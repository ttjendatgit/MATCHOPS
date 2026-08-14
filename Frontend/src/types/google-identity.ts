/** Minimal typings for the Google Identity Services (GIS) client library.
 * Loaded at runtime via https://accounts.google.com/gsi/client — see
 * src/components/auth/GoogleAuthButton.tsx. Only the subset of the API this
 * app actually uses is declared here. */

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

export type GoogleButtonTheme = "outline" | "filled_blue" | "filled_black";
export type GoogleButtonText = "signin_with" | "signup_with" | "continue_with" | "signup";
export type GoogleButtonShape = "rectangular" | "pill" | "circle" | "square";

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  ux_mode?: "popup" | "redirect";
}

interface GoogleButtonConfiguration {
  type?: "standard" | "icon";
  theme?: GoogleButtonTheme;
  size?: "large" | "medium" | "small";
  text?: GoogleButtonText;
  shape?: GoogleButtonShape;
  logo_alignment?: "left" | "center";
  width?: number;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
