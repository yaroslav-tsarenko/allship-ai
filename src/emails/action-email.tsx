import { Button, Text } from "react-email";
import { EmailLayout, emailStyles } from "./layout";

type ActionEmailProps = {
  preview: string;
  heading: string;
  intro: string;
  actionLabel: string;
  url: string;
  footnote: string;
};

export function ActionEmail({ preview, heading, intro, actionLabel, url, footnote }: ActionEmailProps) {
  return (
    <EmailLayout preview={preview}>
      <Text style={emailStyles.h1}>{heading}</Text>
      <Text style={emailStyles.p}>{intro}</Text>
      <Button href={url} style={emailStyles.button}>
        {actionLabel}
      </Button>
      <Text style={{ ...emailStyles.p, marginTop: "24px", fontSize: "14px" }}>{footnote}</Text>
      <Text style={emailStyles.muted}>If the button does not work, open this link: {url}</Text>
    </EmailLayout>
  );
}

ActionEmail.PreviewProps = {
  preview: "Confirm your email",
  heading: "Confirm your email",
  intro: "Tap the button to confirm this address and finish setting up your AllShip AI account.",
  actionLabel: "Confirm email",
  url: "https://allship.ai/verify?token=example",
  footnote: "The link expires in 1 hour. If you did not create an account, ignore this email.",
} satisfies ActionEmailProps;

export default ActionEmail;
