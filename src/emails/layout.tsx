import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text } from "react-email";
import type { ReactNode } from "react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://allship.ai";

export const emailStyles = {
  h1: { fontSize: "24px", lineHeight: "32px", fontWeight: 500, color: "#1a1c20", margin: "0 0 16px" },
  p: { fontSize: "16px", lineHeight: "24px", color: "#43474e", margin: "0 0 16px" },
  button: {
    display: "inline-block",
    backgroundColor: "#005bb3",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: "20px",
    padding: "10px 24px",
    borderRadius: "999px",
    textDecoration: "none",
  },
  code: {
    fontFamily: "'Google Sans Code', ui-monospace, monospace",
    fontSize: "32px",
    letterSpacing: "8px",
    fontWeight: 500,
    color: "#1a1c20",
    backgroundColor: "#eef0f8",
    borderRadius: "12px",
    padding: "16px 24px",
    display: "inline-block",
  },
  muted: { fontSize: "12px", lineHeight: "16px", color: "#73777f", margin: 0 },
} as const;

export function EmailLayout({ preview, children, footer }: { preview: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f9f9ff", fontFamily: "'Google Sans', Roboto, Arial, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "28px", border: "1px solid #e1e2ec", maxWidth: "520px", padding: "40px" }}>
          <Img src={`${appUrl}/brand/logo.png`} width="137" height="32" alt="AllShip AI" style={{ marginBottom: "32px" }} />
          <Section>{children}</Section>
          <Hr style={{ borderColor: "#e1e2ec", margin: "32px 0 16px" }} />
          {footer}
          <Text style={emailStyles.muted}>
            ALLSHIP AI INC · 254 Chapman Rd, Ste 209, Newark, DE 19702 · support@allship.ai
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
