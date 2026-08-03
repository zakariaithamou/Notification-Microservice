import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

async function sendCeremonyMessage(to) {
  try {
    const message = await client.messages.create({
      body: "🎓 Universiapolis celebrated its latest graduation ceremony! Relive the highlights and explore more here: https://universiapolis.ma",
      mediaUrl: [
        "https://upload.wikimedia.org/wikipedia/commons/5/5d/Universiapolis_-_Universit%C3%A9_Internationale_d%27Agadir.jpg",
      ],
      from: "whatsapp:+14155238886",
      to: `whatsapp:${to}`,
    });

    console.log("✅ Sent:", message.sid);

    // optional: check delivery status after a few seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const status = await client.messages(message.sid).fetch();
    console.log(
      "Status:",
      status.status,
      "| Error:",
      status.errorCode || "none",
    );
  } catch (err) {
    console.error("💥 Error:", err.message);
  }
}

sendCeremonyMessage("+212602588936");
