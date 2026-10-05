import { Button, Link, Section, Text } from "react-email";
import { EmailLayout, emailStyles } from "../layout";

export type NurtureFooter = { reason: string; unsubscribeUrl: string; unsubscribeLabel: string; settingsUrl?: string };
export type NurtureFact = { label: string; value: string };

export type NurtureEmailProps = {
  preview: string;
  heading: string;
  paragraphs: string[];
  facts?: NurtureFact[];
  list?: { title: string; body: string }[];
  actionLabel: string;
  url: string;
  after?: string;
  footer: NurtureFooter;
};

const factBox = { backgroundColor: "#eef0f8", borderRadius: "12px", padding: "12px 16px", margin: "0 0 24px" } as const;
const factLabel = { fontSize: "12px", lineHeight: "16px", color: "#43474e", margin: 0, letterSpacing: "0.4px" } as const;
const factValue = { fontSize: "14px", lineHeight: "20px", color: "#1a1c20", margin: "0 0 8px", fontWeight: 500 } as const;
const itemTitle = { fontSize: "14px", lineHeight: "20px", color: "#1a1c20", margin: "0 0 2px", fontWeight: 500 } as const;
const itemBody = { fontSize: "14px", lineHeight: "20px", color: "#43474e", margin: "0 0 16px" } as const;
const footLink = { color: "#005bb3", textDecoration: "underline" } as const;

export function NurtureEmail({ preview, heading, paragraphs, facts, list, actionLabel, url, after, footer }: NurtureEmailProps) {
  return (
    <EmailLayout
      preview={preview}
      footer={
        <Text style={{ ...emailStyles.muted, marginBottom: "8px" }}>
          {footer.reason}{" "}
          <Link href={footer.unsubscribeUrl} style={footLink}>
            {footer.unsubscribeLabel}
          </Link>
          {footer.settingsUrl ? (
            <>
              {" · "}
              <Link href={footer.settingsUrl} style={footLink}>
                Email settings
              </Link>
            </>
          ) : null}
        </Text>
      }
    >
      <Text style={emailStyles.h1}>{heading}</Text>
      {paragraphs.map((p, i) => (
        <Text key={i} style={emailStyles.p}>
          {p}
        </Text>
      ))}
      {facts && facts.length > 0 ? (
        <Section style={factBox}>
          {facts.map((f, i) => (
            <div key={i}>
              <Text style={factLabel}>{f.label}</Text>
              <Text style={{ ...factValue, margin: i === facts.length - 1 ? 0 : factValue.margin }}>{f.value}</Text>
            </div>
          ))}
        </Section>
      ) : null}
      {list && list.length > 0 ? (
        <Section style={{ margin: "0 0 8px" }}>
          {list.map((item, i) => (
            <div key={i}>
              <Text style={itemTitle}>
                {i + 1}. {item.title}
              </Text>
              <Text style={itemBody}>{item.body}</Text>
            </div>
          ))}
        </Section>
      ) : null}
      <Button href={url} style={emailStyles.button}>
        {actionLabel}
      </Button>
      {after ? <Text style={{ ...emailStyles.p, marginTop: "24px", fontSize: "14px", lineHeight: "20px" }}>{after}</Text> : null}
      <Text style={{ ...emailStyles.muted, marginTop: after ? 0 : "24px" }}>If the button does not work, open this link: {url}</Text>
    </EmailLayout>
  );
}
