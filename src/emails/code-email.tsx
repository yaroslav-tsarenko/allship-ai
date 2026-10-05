import { Text } from "react-email";
import { EmailLayout, emailStyles } from "./layout";

type CodeEmailProps = { heading: string; intro: string; code: string; footnote: string };

export function CodeEmail({ heading, intro, code, footnote }: CodeEmailProps) {
  return (
    <EmailLayout preview={`${code} is your AllShip AI code`}>
      <Text style={emailStyles.h1}>{heading}</Text>
      <Text style={emailStyles.p}>{intro}</Text>
      <Text style={emailStyles.code}>{code}</Text>
      <Text style={{ ...emailStyles.p, marginTop: "24px", fontSize: "14px" }}>{footnote}</Text>
    </EmailLayout>
  );
}

CodeEmail.PreviewProps = {
  heading: "Your sign-in code",
  intro: "Enter this code on the AllShip AI sign-in page.",
  code: "482913",
  footnote: "The code expires in 10 minutes. Never share it with anyone, including AllShip staff.",
} satisfies CodeEmailProps;

export default CodeEmail;
